import type { HttpClient } from '../http/client';
import type { VoiceApiResult, VoiceMusicCreateCommand, VoiceOperationCommand, VoiceSoundEffectCreateCommand, VoiceSpeechCreateCommand, VoiceTranscriptionCreateCommand, VoiceTranslationCreateCommand } from '../types';
export declare class VoiceTranslationsApi {
    private client;
    constructor(client: HttpClient);
    /** Translations create. */
    create(body: VoiceTranslationCreateCommand): Promise<VoiceApiResult>;
}
export declare class VoiceTranscriptionsApi {
    private client;
    constructor(client: HttpClient);
    /** Transcriptions create. */
    create(body: VoiceTranscriptionCreateCommand): Promise<VoiceApiResult>;
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
export declare class VoiceSpeechApi {
    private client;
    constructor(client: HttpClient);
    /** Speech create. */
    create(body: VoiceSpeechCreateCommand): Promise<VoiceApiResult>;
}
export declare class VoiceSoundEffectsApi {
    private client;
    constructor(client: HttpClient);
    /** Sound Effects create. */
    create(body: VoiceSoundEffectCreateCommand): Promise<VoiceApiResult>;
}
export declare class VoiceMusicApi {
    private client;
    constructor(client: HttpClient);
    /** Music create. */
    create(body: VoiceMusicCreateCommand): Promise<VoiceApiResult>;
}
export interface VoiceAudioAssetsListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class VoiceAudioAssetsApi {
    private client;
    constructor(client: HttpClient);
    /** Audio Assets list. */
    list(params?: VoiceAudioAssetsListParams): Promise<VoiceApiResult>;
    /** Audio Assets retrieve. */
    retrieve(audioAssetId: string): Promise<VoiceApiResult>;
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
}
export declare class VoiceApi {
    private client;
    readonly artifactDriveSync: VoiceArtifactDriveSyncApi;
    readonly audioAssets: VoiceAudioAssetsApi;
    readonly music: VoiceMusicApi;
    readonly soundEffects: VoiceSoundEffectsApi;
    readonly speech: VoiceSpeechApi;
    readonly taskEvents: VoiceTaskEventsApi;
    readonly tasks: VoiceTasksApi;
    readonly transcriptions: VoiceTranscriptionsApi;
    readonly translations: VoiceTranslationsApi;
    constructor(client: HttpClient);
}
export declare function createVoiceApi(client: HttpClient): VoiceApi;
//# sourceMappingURL=voice.d.ts.map