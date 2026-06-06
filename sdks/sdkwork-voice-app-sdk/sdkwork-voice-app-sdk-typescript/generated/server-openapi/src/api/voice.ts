import { appApiPath } from './paths';
import type { HttpClient } from '../http/client';

import type { VoiceApiResult, VoiceMusicCreateCommand, VoiceOperationCommand, VoiceSoundEffectCreateCommand, VoiceSpeechCreateCommand, VoiceTranscriptionCreateCommand, VoiceTranslationCreateCommand } from '../types';


export class VoiceTranslationsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Translations create. */
  async create(body: VoiceTranslationCreateCommand): Promise<VoiceApiResult> {
    return this.client.post<VoiceApiResult>(appApiPath(`/voice/translations`), body, undefined, undefined, 'application/json');
  }
}

export class VoiceTranscriptionsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Transcriptions create. */
  async create(body: VoiceTranscriptionCreateCommand): Promise<VoiceApiResult> {
    return this.client.post<VoiceApiResult>(appApiPath(`/voice/transcriptions`), body, undefined, undefined, 'application/json');
  }
}

export interface VoiceTasksListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class VoiceTasksApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Tasks list. */
  async list(params?: VoiceTasksListParams): Promise<VoiceApiResult> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<VoiceApiResult>(appendQueryString(appApiPath(`/voice/tasks`), query));
  }

/** Tasks retrieve. */
  async retrieve(taskId: string): Promise<VoiceApiResult> {
    return this.client.get<VoiceApiResult>(appApiPath(`/voice/tasks/${serializePathParameter(taskId, { name: 'taskId', style: 'simple', explode: false })}`));
  }

/** Tasks cancel. */
  async cancel(taskId: string, body: VoiceOperationCommand): Promise<VoiceApiResult> {
    return this.client.post<VoiceApiResult>(appApiPath(`/voice/tasks/${serializePathParameter(taskId, { name: 'taskId', style: 'simple', explode: false })}/cancel`), body, undefined, undefined, 'application/json');
  }
}

export interface VoiceTaskEventsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class VoiceTaskEventsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Task Events list. */
  async list(params?: VoiceTaskEventsListParams): Promise<VoiceApiResult> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<VoiceApiResult>(appendQueryString(appApiPath(`/voice/task_events`), query));
  }
}

export class VoiceSpeechApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Speech create. */
  async create(body: VoiceSpeechCreateCommand): Promise<VoiceApiResult> {
    return this.client.post<VoiceApiResult>(appApiPath(`/voice/speech`), body, undefined, undefined, 'application/json');
  }
}

export class VoiceSoundEffectsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Sound Effects create. */
  async create(body: VoiceSoundEffectCreateCommand): Promise<VoiceApiResult> {
    return this.client.post<VoiceApiResult>(appApiPath(`/voice/sound_effects`), body, undefined, undefined, 'application/json');
  }
}

export class VoiceMusicApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Music create. */
  async create(body: VoiceMusicCreateCommand): Promise<VoiceApiResult> {
    return this.client.post<VoiceApiResult>(appApiPath(`/voice/music`), body, undefined, undefined, 'application/json');
  }
}

export interface VoiceAudioAssetsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class VoiceAudioAssetsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Audio Assets list. */
  async list(params?: VoiceAudioAssetsListParams): Promise<VoiceApiResult> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<VoiceApiResult>(appendQueryString(appApiPath(`/voice/audio_assets`), query));
  }

/** Audio Assets retrieve. */
  async retrieve(audioAssetId: string): Promise<VoiceApiResult> {
    return this.client.get<VoiceApiResult>(appApiPath(`/voice/audio_assets/${serializePathParameter(audioAssetId, { name: 'audioAssetId', style: 'simple', explode: false })}`));
  }
}

export class VoiceApi {
  private client: HttpClient;
  public readonly audioAssets: VoiceAudioAssetsApi;
  public readonly music: VoiceMusicApi;
  public readonly soundEffects: VoiceSoundEffectsApi;
  public readonly speech: VoiceSpeechApi;
  public readonly taskEvents: VoiceTaskEventsApi;
  public readonly tasks: VoiceTasksApi;
  public readonly transcriptions: VoiceTranscriptionsApi;
  public readonly translations: VoiceTranslationsApi;

  constructor(client: HttpClient) {
    this.client = client;
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

export function createVoiceApi(client: HttpClient): VoiceApi {
  return new VoiceApi(client);
}

function appendQueryString(path: string, rawQueryString: string): string {
  const query = rawQueryString.replace(/^\?+/, '');
  if (!query) {
    return path;
  }
  return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}

interface PathParameterSpec {
  name: string;
  style: string;
  explode: boolean;
}

function serializePathParameter(value: unknown, spec: PathParameterSpec): string {
  if (value === undefined || value === null) {
    return '';
  }

  const style = spec.style || 'simple';
  if (Array.isArray(value)) {
    return serializePathArray(spec.name, value, style, spec.explode);
  }
  if (typeof value === 'object') {
    return serializePathObject(spec.name, value as Record<string, unknown>, style, spec.explode);
  }
  return pathPrefix(spec.name, style, false) + encodePathValue(serializePathPrimitive(value));
}

function serializePathArray(name: string, values: unknown[], style: string, explode: boolean): string {
  const serialized = values
    .filter((item) => item !== undefined && item !== null)
    .map((item) => encodePathValue(serializePathPrimitive(item)));
  if (serialized.length === 0) {
    return pathPrefix(name, style, false);
  }
  if (style === 'matrix') {
    return explode
      ? serialized.map((item) => `;${name}=${item}`).join('')
      : `;${name}=${serialized.join(',')}`;
  }
  return pathPrefix(name, style, false) + serialized.join(explode ? '.' : ',');
}

function serializePathObject(name: string, value: Record<string, unknown>, style: string, explode: boolean): string {
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
  if (entries.length === 0) {
    return pathPrefix(name, style, true);
  }
  if (style === 'matrix') {
    return explode
      ? entries.map(([key, entryValue]) => `;${encodePathValue(key)}=${encodePathValue(serializePathPrimitive(entryValue))}`).join('')
      : `;${name}=${entries.flatMap(([key, entryValue]) => [encodePathValue(key), encodePathValue(serializePathPrimitive(entryValue))]).join(',')}`;
  }
  const serialized = explode
    ? entries.map(([key, entryValue]) => `${encodePathValue(key)}=${encodePathValue(serializePathPrimitive(entryValue))}`).join(style === 'label' ? '.' : ',')
    : entries.flatMap(([key, entryValue]) => [encodePathValue(key), encodePathValue(serializePathPrimitive(entryValue))]).join(',');
  return pathPrefix(name, style, true) + serialized;
}

function pathPrefix(name: string, style: string, _objectValue: boolean): string {
  if (style === 'label') return '.';
  if (style === 'matrix') return `;${name}`;
  return '';
}

function encodePathValue(value: string): string {
  return encodeURIComponent(value);
}

function serializePathPrimitive(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
interface QueryParameterSpec {
  name: string;
  value: unknown;
  style: string;
  explode: boolean;
  allowReserved: boolean;
  contentType?: string;
}

function buildQueryString(parameters: QueryParameterSpec[]): string {
  const pairs: string[] = [];
  for (const parameter of parameters) {
    appendSerializedParameter(pairs, parameter);
  }
  return pairs.join('&');
}

function appendSerializedParameter(pairs: string[], parameter: QueryParameterSpec): void {
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
    appendObjectParameter(pairs, parameter.name, parameter.value as Record<string, unknown>, style, parameter.explode, parameter.allowReserved);
    return;
  }

  pairs.push(`${encodeQueryComponent(parameter.name)}=${encodeQueryValue(serializePrimitive(parameter.value), parameter.allowReserved)}`);
}

function appendArrayParameter(
  pairs: string[],
  name: string,
  value: unknown[],
  style: string,
  explode: boolean,
  allowReserved: boolean,
): void {
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

function appendObjectParameter(
  pairs: string[],
  name: string,
  value: Record<string, unknown>,
  style: string,
  explode: boolean,
  allowReserved: boolean,
): void {
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

function appendDeepObjectParameter(
  pairs: string[],
  name: string,
  value: unknown,
  allowReserved: boolean,
): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(serializePrimitive(value), allowReserved)}`);
    return;
  }

  for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
    if (entryValue === undefined || entryValue === null) {
      continue;
    }
    pairs.push(`${encodeQueryComponent(`${name}[${key}]`)}=${encodeQueryValue(serializePrimitive(entryValue), allowReserved)}`);
  }
}

function serializePrimitive(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function encodeQueryComponent(value: string): string {
  return encodeURIComponent(value);
}

function encodeQueryValue(value: string, allowReserved: boolean): string {
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
