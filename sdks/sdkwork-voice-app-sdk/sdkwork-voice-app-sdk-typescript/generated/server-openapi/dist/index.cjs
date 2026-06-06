'use strict';

var sdkCommon = require('@sdkwork/sdk-common');

class HttpClient extends sdkCommon.BaseHttpClient {
    constructor(config) {
        super(config);
    }
    getInternalAuthConfig() {
        const self = this;
        self.authConfig = self.authConfig || {};
        return self.authConfig;
    }
    getInternalHeaders() {
        const self = this;
        self.config = self.config || {};
        self.config.headers = self.config.headers || {};
        return self.config.headers;
    }
    buildRequestHeaders(headers, contentType) {
        const mergedHeaders = {
            ...(headers ?? {}),
        };
        if (contentType && contentType.toLowerCase() !== 'multipart/form-data') {
            mergedHeaders['Content-Type'] = contentType;
        }
        return Object.keys(mergedHeaders).length > 0 ? mergedHeaders : undefined;
    }
    buildRequestBody(body, contentType) {
        if (body == null) {
            return body;
        }
        const normalizedContentType = (contentType ?? '').toLowerCase();
        if (normalizedContentType === 'application/x-www-form-urlencoded') {
            return this.encodeFormBody(body);
        }
        if (normalizedContentType === 'multipart/form-data') {
            return this.encodeMultipartBody(body);
        }
        return body;
    }
    encodeMultipartBody(body) {
        if (body instanceof FormData) {
            return body;
        }
        const formData = new FormData();
        if (body instanceof Map) {
            for (const [key, value] of body.entries()) {
                this.appendMultipartValue(formData, String(key), value);
            }
            return formData;
        }
        if (typeof body === 'object') {
            const record = body;
            for (const [key, value] of Object.entries(record)) {
                if (this.isMultipartMetadataField(key)) {
                    continue;
                }
                this.appendMultipartValue(formData, key, value, this.resolveMultipartFileName(record, key));
            }
            return formData;
        }
        this.appendMultipartValue(formData, 'value', body);
        return formData;
    }
    appendMultipartValue(formData, key, value, fileName) {
        if (value == null) {
            return;
        }
        if (Array.isArray(value)) {
            value.forEach((item) => this.appendMultipartValue(formData, key, item, fileName));
            return;
        }
        if (value instanceof Blob) {
            if (fileName) {
                formData.append(key, value, fileName);
                return;
            }
            formData.append(key, value);
            return;
        }
        if (value instanceof Date) {
            formData.append(key, value.toISOString());
            return;
        }
        if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
            return;
        }
        formData.append(key, String(value));
    }
    resolveMultipartFileName(record, key) {
        const fieldSpecificName = record[`${key}FileName`];
        if (typeof fieldSpecificName === 'string' && fieldSpecificName.trim()) {
            return fieldSpecificName.trim();
        }
        const genericName = record.fileName;
        if (key === 'file' && typeof genericName === 'string' && genericName.trim()) {
            return genericName.trim();
        }
        return undefined;
    }
    isMultipartMetadataField(key) {
        return key === 'fileName' || key.endsWith('FileName');
    }
    encodeFormBody(body) {
        if (body instanceof URLSearchParams) {
            return body.toString();
        }
        if (typeof body === 'string') {
            return body;
        }
        const params = new URLSearchParams();
        if (body instanceof Map) {
            for (const [key, value] of body.entries()) {
                this.appendFormValue(params, String(key), value);
            }
            return params.toString();
        }
        if (typeof body === 'object') {
            for (const [key, value] of Object.entries(body)) {
                this.appendFormValue(params, key, value);
            }
            return params.toString();
        }
        params.append('value', String(body));
        return params.toString();
    }
    appendFormValue(params, key, value) {
        if (value == null) {
            return;
        }
        if (Array.isArray(value)) {
            value.forEach((item) => this.appendFormValue(params, key, item));
            return;
        }
        if (value instanceof Date) {
            params.append(key, value.toISOString());
            return;
        }
        if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
            return;
        }
        params.append(key, String(value));
    }
    setApiKey(apiKey) {
        const authConfig = this.getInternalAuthConfig();
        const headers = this.getInternalHeaders();
        authConfig.apiKey = apiKey;
        authConfig.tokenManager?.clearTokens?.();
        if (HttpClient.API_KEY_HEADER === 'Authorization' && HttpClient.API_KEY_USE_BEARER) {
            authConfig.authMode = 'apikey';
            return;
        }
        authConfig.authMode = 'dual-token';
        headers[HttpClient.API_KEY_HEADER] = HttpClient.API_KEY_USE_BEARER
            ? `Bearer ${apiKey}`
            : apiKey;
        if (HttpClient.API_KEY_HEADER.toLowerCase() !== 'authorization') {
            delete headers['Authorization'];
        }
    }
    setAuthToken(token) {
        const headers = this.getInternalHeaders();
        if (HttpClient.API_KEY_HEADER.toLowerCase() !== 'authorization') {
            delete headers[HttpClient.API_KEY_HEADER];
        }
        super.setAuthToken(token);
    }
    setAccessToken(token) {
        const headers = this.getInternalHeaders();
        headers[HttpClient.ACCESS_TOKEN_HEADER] = token;
        super.setAccessToken(token);
    }
    setTokenManager(manager) {
        const baseProto = Object.getPrototypeOf(HttpClient.prototype);
        if (typeof baseProto.setTokenManager === 'function') {
            baseProto.setTokenManager.call(this, manager);
            return;
        }
        this.getInternalAuthConfig().tokenManager = manager;
    }
    applySdkworkAuthHeaders(headers) {
        const authConfig = this.getInternalAuthConfig();
        const tokenManager = authConfig.tokenManager;
        const accessToken = tokenManager?.getAccessToken?.();
        if (!accessToken) {
            return headers;
        }
        return {
            ...(headers ?? {}),
            [HttpClient.ACCESS_TOKEN_HEADER]: accessToken,
        };
    }
    async request(path, options = {}) {
        const execute = this.execute;
        if (typeof execute !== 'function') {
            throw new Error('BaseHttpClient execute method is not available');
        }
        const { body, headers, contentType, method = 'GET', ...rest } = options;
        const requestHeaders = this.applySdkworkAuthHeaders(headers);
        return sdkCommon.withRetry(() => execute.call(this, {
            url: path,
            method,
            ...rest,
            body: this.buildRequestBody(body, contentType),
            headers: this.buildRequestHeaders(requestHeaders, body == null ? undefined : contentType),
        }), { maxRetries: 3 });
    }
    async *streamJson(path, options = {}) {
        const stream = sdkCommon.BaseHttpClient.prototype.stream;
        if (typeof stream !== 'function') {
            throw new Error('BaseHttpClient stream method is not available');
        }
        const { body, headers, contentType, method = 'GET', ...rest } = options;
        const authHeaders = this.applySdkworkAuthHeaders(headers);
        const requestHeaders = this.buildRequestHeaders({ Accept: 'text/event-stream', ...(authHeaders ?? {}) }, body == null ? undefined : contentType);
        for await (const data of stream.call(this, path, {
            method,
            ...rest,
            body: this.buildRequestBody(body, contentType),
            headers: requestHeaders,
        })) {
            if (data === '[DONE]') {
                return;
            }
            if (typeof data !== 'string' || data.trim().length === 0) {
                continue;
            }
            yield JSON.parse(data);
        }
    }
    async get(path, params, headers) {
        return this.request(path, { method: 'GET', params, headers });
    }
    async post(path, body, params, headers, contentType) {
        return this.request(path, { method: 'POST', body, params, headers, contentType });
    }
    async put(path, body, params, headers, contentType) {
        return this.request(path, { method: 'PUT', body, params, headers, contentType });
    }
    async delete(path, params, headers) {
        return this.request(path, { method: 'DELETE', params, headers });
    }
    async patch(path, body, params, headers, contentType) {
        return this.request(path, { method: 'PATCH', body, params, headers, contentType });
    }
}
HttpClient.API_KEY_HEADER = 'Access-Token';
HttpClient.ACCESS_TOKEN_HEADER = 'Access-Token';
HttpClient.API_KEY_USE_BEARER = false;
function createHttpClient(config) {
    return new HttpClient(config);
}

const APP_API_PREFIX = '/app/v3/api';
function appApiPath(path) {
    if (!path) {
        return APP_API_PREFIX;
    }
    if (/^https?:\/\//i.test(path)) {
        return path;
    }
    const normalizedPrefixRaw = (APP_API_PREFIX).trim();
    const normalizedPrefix = normalizedPrefixRaw
        ? `/${normalizedPrefixRaw.replace(/^\/+|\/+$/g, '')}`
        : '';
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    if (!normalizedPrefix || normalizedPrefix === '/') {
        return normalizedPath;
    }
    if (normalizedPath === normalizedPrefix || normalizedPath.startsWith(`${normalizedPrefix}/`)) {
        return normalizedPath;
    }
    return `${normalizedPrefix}${normalizedPath}`;
}

class VoiceTranslationsApi {
    constructor(client) {
        this.client = client;
    }
    /** Translations create. */
    async create(body) {
        return this.client.post(appApiPath(`/voice/translations`), body, undefined, undefined, 'application/json');
    }
}
class VoiceTranscriptionsApi {
    constructor(client) {
        this.client = client;
    }
    /** Transcriptions create. */
    async create(body) {
        return this.client.post(appApiPath(`/voice/transcriptions`), body, undefined, undefined, 'application/json');
    }
}
class VoiceTasksApi {
    constructor(client) {
        this.client = client;
    }
    /** Tasks list. */
    async list(params) {
        const query = buildQueryString([
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
            { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
            { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.get(appendQueryString(appApiPath(`/voice/tasks`), query));
    }
    /** Tasks retrieve. */
    async retrieve(taskId) {
        return this.client.get(appApiPath(`/voice/tasks/${serializePathParameter(taskId, { name: 'taskId', style: 'simple', explode: false })}`));
    }
    /** Tasks cancel. */
    async cancel(taskId, body) {
        return this.client.post(appApiPath(`/voice/tasks/${serializePathParameter(taskId, { name: 'taskId', style: 'simple', explode: false })}/cancel`), body, undefined, undefined, 'application/json');
    }
}
class VoiceTaskEventsApi {
    constructor(client) {
        this.client = client;
    }
    /** Task Events list. */
    async list(params) {
        const query = buildQueryString([
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
            { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
            { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.get(appendQueryString(appApiPath(`/voice/task_events`), query));
    }
}
class VoiceSpeechApi {
    constructor(client) {
        this.client = client;
    }
    /** Speech create. */
    async create(body) {
        return this.client.post(appApiPath(`/voice/speech`), body, undefined, undefined, 'application/json');
    }
}
class VoiceSoundEffectsApi {
    constructor(client) {
        this.client = client;
    }
    /** Sound Effects create. */
    async create(body) {
        return this.client.post(appApiPath(`/voice/sound_effects`), body, undefined, undefined, 'application/json');
    }
}
class VoiceMusicApi {
    constructor(client) {
        this.client = client;
    }
    /** Music create. */
    async create(body) {
        return this.client.post(appApiPath(`/voice/music`), body, undefined, undefined, 'application/json');
    }
}
class VoiceAudioAssetsApi {
    constructor(client) {
        this.client = client;
    }
    /** Audio Assets list. */
    async list(params) {
        const query = buildQueryString([
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
            { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
            { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.get(appendQueryString(appApiPath(`/voice/audio_assets`), query));
    }
    /** Audio Assets retrieve. */
    async retrieve(audioAssetId) {
        return this.client.get(appApiPath(`/voice/audio_assets/${serializePathParameter(audioAssetId, { name: 'audioAssetId', style: 'simple', explode: false })}`));
    }
}
class VoiceArtifactDriveSyncApi {
    constructor(client) {
        this.client = client;
    }
    /** Artifact Drive Sync list. */
    async list(params) {
        const query = buildQueryString([
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
            { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
            { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.get(appendQueryString(appApiPath(`/voice/artifact_drive_sync`), query));
    }
}
class VoiceApi {
    constructor(client) {
        this.client = client;
        this.artifactDriveSync = new VoiceArtifactDriveSyncApi(client);
        this.audioAssets = new VoiceAudioAssetsApi(client);
        this.music = new VoiceMusicApi(client);
        this.soundEffects = new VoiceSoundEffectsApi(client);
        this.speech = new VoiceSpeechApi(client);
        this.taskEvents = new VoiceTaskEventsApi(client);
        this.tasks = new VoiceTasksApi(client);
        this.transcriptions = new VoiceTranscriptionsApi(client);
        this.translations = new VoiceTranslationsApi(client);
    }
}
function createVoiceApi(client) {
    return new VoiceApi(client);
}
function appendQueryString(path, rawQueryString) {
    const query = rawQueryString.replace(/^\?+/, '');
    if (!query) {
        return path;
    }
    return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}
function serializePathParameter(value, spec) {
    if (value === undefined || value === null) {
        return '';
    }
    const style = spec.style || 'simple';
    if (Array.isArray(value)) {
        return serializePathArray(spec.name, value, style, spec.explode);
    }
    if (typeof value === 'object') {
        return serializePathObject(spec.name, value, style, spec.explode);
    }
    return pathPrefix(spec.name, style) + encodePathValue(serializePathPrimitive(value));
}
function serializePathArray(name, values, style, explode) {
    const serialized = values
        .filter((item) => item !== undefined && item !== null)
        .map((item) => encodePathValue(serializePathPrimitive(item)));
    if (serialized.length === 0) {
        return pathPrefix(name, style);
    }
    if (style === 'matrix') {
        return explode
            ? serialized.map((item) => `;${name}=${item}`).join('')
            : `;${name}=${serialized.join(',')}`;
    }
    return pathPrefix(name, style) + serialized.join(explode ? '.' : ',');
}
function serializePathObject(name, value, style, explode) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return pathPrefix(name, style);
    }
    if (style === 'matrix') {
        return explode
            ? entries.map(([key, entryValue]) => `;${encodePathValue(key)}=${encodePathValue(serializePathPrimitive(entryValue))}`).join('')
            : `;${name}=${entries.flatMap(([key, entryValue]) => [encodePathValue(key), encodePathValue(serializePathPrimitive(entryValue))]).join(',')}`;
    }
    const serialized = explode
        ? entries.map(([key, entryValue]) => `${encodePathValue(key)}=${encodePathValue(serializePathPrimitive(entryValue))}`).join(style === 'label' ? '.' : ',')
        : entries.flatMap(([key, entryValue]) => [encodePathValue(key), encodePathValue(serializePathPrimitive(entryValue))]).join(',');
    return pathPrefix(name, style) + serialized;
}
function pathPrefix(name, style, _objectValue) {
    if (style === 'label')
        return '.';
    if (style === 'matrix')
        return `;${name}`;
    return '';
}
function encodePathValue(value) {
    return encodeURIComponent(value);
}
function serializePathPrimitive(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function buildQueryString(parameters) {
    const pairs = [];
    for (const parameter of parameters) {
        appendSerializedParameter(pairs, parameter);
    }
    return pairs.join('&');
}
function appendSerializedParameter(pairs, parameter) {
    if (parameter.value === undefined || parameter.value === null) {
        return;
    }
    if (parameter.contentType) {
        pairs.push(`${encodeQueryComponent(parameter.name)}=${encodeQueryValue(JSON.stringify(parameter.value), parameter.allowReserved)}`);
        return;
    }
    const style = parameter.style || 'form';
    if (style === 'deepObject') {
        appendDeepObjectParameter(pairs, parameter.name, parameter.value, parameter.allowReserved);
        return;
    }
    if (Array.isArray(parameter.value)) {
        appendArrayParameter(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    if (typeof parameter.value === 'object') {
        appendObjectParameter(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    pairs.push(`${encodeQueryComponent(parameter.name)}=${encodeQueryValue(serializePrimitive(parameter.value), parameter.allowReserved)}`);
}
function appendArrayParameter(pairs, name, value, style, explode, allowReserved) {
    const values = value
        .filter((item) => item !== undefined && item !== null)
        .map((item) => serializePrimitive(item));
    if (values.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const item of values) {
            pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(item, allowReserved)}`);
        }
        return;
    }
    pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(values.join(','), allowReserved)}`);
}
function appendObjectParameter(pairs, name, value, style, explode, allowReserved) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const [key, entryValue] of entries) {
            pairs.push(`${encodeQueryComponent(key)}=${encodeQueryValue(serializePrimitive(entryValue), allowReserved)}`);
        }
        return;
    }
    const serialized = entries.flatMap(([key, entryValue]) => [key, serializePrimitive(entryValue)]).join(',');
    pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(serialized, allowReserved)}`);
}
function appendDeepObjectParameter(pairs, name, value, allowReserved) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(serializePrimitive(value), allowReserved)}`);
        return;
    }
    for (const [key, entryValue] of Object.entries(value)) {
        if (entryValue === undefined || entryValue === null) {
            continue;
        }
        pairs.push(`${encodeQueryComponent(`${name}[${key}]`)}=${encodeQueryValue(serializePrimitive(entryValue), allowReserved)}`);
    }
}
function serializePrimitive(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function encodeQueryComponent(value) {
    return encodeURIComponent(value);
}
function encodeQueryValue(value, allowReserved) {
    const encoded = encodeURIComponent(value);
    if (!allowReserved) {
        return encoded;
    }
    return encoded.replace(/%3A/gi, ':')
        .replace(/%2F/gi, '/')
        .replace(/%3F/gi, '?')
        .replace(/%23/gi, '#')
        .replace(/%5B/gi, '[')
        .replace(/%5D/gi, ']')
        .replace(/%40/gi, '@')
        .replace(/%21/gi, '!')
        .replace(/%24/gi, '$')
        .replace(/%26/gi, '&')
        .replace(/%27/gi, "'")
        .replace(/%28/gi, '(')
        .replace(/%29/gi, ')')
        .replace(/%2A/gi, '*')
        .replace(/%2B/gi, '+')
        .replace(/%2C/gi, ',')
        .replace(/%3B/gi, ';')
        .replace(/%3D/gi, '=');
}

class SdkworkAppClient {
    constructor(config) {
        this.httpClient = createHttpClient(config);
        this.voice = createVoiceApi(this.httpClient);
    }
    setApiKey(apiKey) {
        this.httpClient.setApiKey(apiKey);
        return this;
    }
    setAuthToken(token) {
        this.httpClient.setAuthToken(token);
        return this;
    }
    setAccessToken(token) {
        this.httpClient.setAccessToken(token);
        return this;
    }
    setTokenManager(manager) {
        this.httpClient.setTokenManager(manager);
        return this;
    }
    get http() {
        return this.httpClient;
    }
}
function createClient(config) {
    return new SdkworkAppClient(config);
}

class BaseApi {
    constructor(http, basePath) {
        this.http = http;
        this.basePath = basePath;
    }
    async get(path, params, headers) {
        return this.http.get(`${this.basePath}${path}`, params, headers);
    }
    async post(path, body, params, headers, contentType) {
        return this.http.post(`${this.basePath}${path}`, body, params, headers, contentType);
    }
    async put(path, body, params, headers, contentType) {
        return this.http.put(`${this.basePath}${path}`, body, params, headers, contentType);
    }
    async delete(path, params, headers) {
        return this.http.delete(`${this.basePath}${path}`, params, headers);
    }
    async patch(path, body, params, headers, contentType) {
        return this.http.patch(`${this.basePath}${path}`, body, params, headers, contentType);
    }
    async request(method, path, body, params, headers, contentType) {
        return this.http.request(`${this.basePath}${path}`, { method: method, body, params, headers, contentType });
    }
}

Object.defineProperty(exports, "DEFAULT_TIMEOUT", {
    enumerable: true,
    get: function () { return sdkCommon.DEFAULT_TIMEOUT; }
});
Object.defineProperty(exports, "DefaultAuthTokenManager", {
    enumerable: true,
    get: function () { return sdkCommon.DefaultAuthTokenManager; }
});
Object.defineProperty(exports, "SUCCESS_CODES", {
    enumerable: true,
    get: function () { return sdkCommon.SUCCESS_CODES; }
});
Object.defineProperty(exports, "createTokenManager", {
    enumerable: true,
    get: function () { return sdkCommon.createTokenManager; }
});
exports.BaseApi = BaseApi;
exports.HttpClient = HttpClient;
exports.SdkworkAppClient = SdkworkAppClient;
exports.VoiceApi = VoiceApi;
exports.appApiPath = appApiPath;
exports.createClient = createClient;
exports.createHttpClient = createHttpClient;
exports.createVoiceApi = createVoiceApi;
