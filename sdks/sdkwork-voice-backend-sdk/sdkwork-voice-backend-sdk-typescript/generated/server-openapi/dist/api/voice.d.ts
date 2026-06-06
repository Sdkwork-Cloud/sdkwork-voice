import type { HttpClient } from '../http/client';
import type { VoiceApiResult, VoiceOperationCommand, VoiceProviderWebhookEventCommand } from '../types';
export interface VoiceWebhookDeliveriesListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class VoiceWebhookDeliveriesApi {
    private client;
    constructor(client: HttpClient);
    /** Webhook Deliveries list. */
    list(params?: VoiceWebhookDeliveriesListParams): Promise<VoiceApiResult>;
}
export interface VoiceTasksListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class VoiceTasksApi {
    private client;
    constructor(client: HttpClient);
    /** Tasks list. */
    list(params?: VoiceTasksListParams): Promise<VoiceApiResult>;
    /** Tasks retrieve. */
    retrieve(taskId: string): Promise<VoiceApiResult>;
    /** Tasks cancel. */
    cancel(taskId: string, body: VoiceOperationCommand): Promise<VoiceApiResult>;
    /** Tasks reconcile. */
    reconcile(taskId: string, body: VoiceOperationCommand): Promise<VoiceApiResult>;
    /** Tasks retry. */
    retry(taskId: string, body: VoiceOperationCommand): Promise<VoiceApiResult>;
}
export interface VoiceTaskEventsListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class VoiceTaskEventsApi {
    private client;
    constructor(client: HttpClient);
    /** Task Events list. */
    list(params?: VoiceTaskEventsListParams): Promise<VoiceApiResult>;
}
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
export declare class VoiceProviderWebhooksApi {
    private client;
    constructor(client: HttpClient);
    /** Provider Webhooks accept. */
    accept(providerCode: string, body: VoiceProviderWebhookEventCommand): Promise<VoiceApiResult>;
}
export interface VoiceProviderWebhookEventsListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class VoiceProviderWebhookEventsApi {
    private client;
    constructor(client: HttpClient);
    /** Provider Webhook Events list. */
    list(params?: VoiceProviderWebhookEventsListParams): Promise<VoiceApiResult>;
    /** Provider Webhook Events replay. */
    replay(eventId: string, body: VoiceOperationCommand): Promise<VoiceApiResult>;
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
export interface VoiceArtifactDriveSyncListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class VoiceArtifactDriveSyncApi {
    private client;
    constructor(client: HttpClient);
    /** Artifact Drive Sync list. */
    list(params?: VoiceArtifactDriveSyncListParams): Promise<VoiceApiResult>;
    /** Artifact Drive Sync retry. */
    retry(syncId: string, body: VoiceOperationCommand): Promise<VoiceApiResult>;
}
export declare class VoiceApi {
    private client;
    readonly artifactDriveSync: VoiceArtifactDriveSyncApi;
    readonly audioArtifacts: VoiceAudioArtifactsApi;
    readonly providerRoutes: VoiceProviderRoutesApi;
    readonly providerWebhookEvents: VoiceProviderWebhookEventsApi;
    readonly providerWebhooks: VoiceProviderWebhooksApi;
    readonly requestLogs: VoiceRequestLogsApi;
    readonly taskEvents: VoiceTaskEventsApi;
    readonly tasks: VoiceTasksApi;
    readonly webhookDeliveries: VoiceWebhookDeliveriesApi;
    constructor(client: HttpClient);
}
export declare function createVoiceApi(client: HttpClient): VoiceApi;
//# sourceMappingURL=voice.d.ts.map