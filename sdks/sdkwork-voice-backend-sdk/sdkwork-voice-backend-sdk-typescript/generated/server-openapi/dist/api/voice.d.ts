import type { HttpClient } from '../http/client';
import type { VoiceApiResult, VoiceOperationCommand } from '../types';
export interface VoiceRequestLogsListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class VoiceRequestLogsApi {
    private client;
    constructor(client: HttpClient);
    /** Request Logs list. */
    list(params?: VoiceRequestLogsListParams): Promise<VoiceApiResult>;
}
export interface VoiceProviderRoutesListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class VoiceProviderRoutesApi {
    private client;
    constructor(client: HttpClient);
    /** Provider Routes list. */
    list(params?: VoiceProviderRoutesListParams): Promise<VoiceApiResult>;
    /** Provider Routes create. */
    create(body: VoiceOperationCommand): Promise<VoiceApiResult>;
    /** Provider Routes delete. */
    delete(providerRouteId: string): Promise<VoiceApiResult>;
    /** Provider Routes retrieve. */
    retrieve(providerRouteId: string): Promise<VoiceApiResult>;
    /** Provider Routes update. */
    update(providerRouteId: string, body?: VoiceOperationCommand): Promise<VoiceApiResult>;
}
export interface VoiceAudioArtifactsListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class VoiceAudioArtifactsApi {
    private client;
    constructor(client: HttpClient);
    /** Audio Artifacts list. */
    list(params?: VoiceAudioArtifactsListParams): Promise<VoiceApiResult>;
    /** Audio Artifacts delete. */
    delete(audioArtifactId: string): Promise<VoiceApiResult>;
    /** Audio Artifacts retrieve. */
    retrieve(audioArtifactId: string): Promise<VoiceApiResult>;
}
export declare class VoiceApi {
    private client;
    readonly audioArtifacts: VoiceAudioArtifactsApi;
    readonly providerRoutes: VoiceProviderRoutesApi;
    readonly requestLogs: VoiceRequestLogsApi;
    constructor(client: HttpClient);
}
export declare function createVoiceApi(client: HttpClient): VoiceApi;
//# sourceMappingURL=voice.d.ts.map