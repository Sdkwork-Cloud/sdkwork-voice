import type { HttpClient } from '../http/client';
import type { VoiceApiResult, VoiceOperationCommand } from '../types';
export declare class VoiceTranslationsApi {
    private client;
    constructor(client: HttpClient);
    /** Translations create. */
    create(body: VoiceOperationCommand): Promise<VoiceApiResult>;
}
export declare class VoiceTranscriptionsApi {
    private client;
    constructor(client: HttpClient);
    /** Transcriptions create. */
    create(body: VoiceOperationCommand): Promise<VoiceApiResult>;
}
export declare class VoiceSpeechApi {
    private client;
    constructor(client: HttpClient);
    /** Speech create. */
    create(body: VoiceOperationCommand): Promise<VoiceApiResult>;
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
export declare class VoiceApi {
    private client;
    readonly audioAssets: VoiceAudioAssetsApi;
    readonly speech: VoiceSpeechApi;
    readonly transcriptions: VoiceTranscriptionsApi;
    readonly translations: VoiceTranslationsApi;
    constructor(client: HttpClient);
}
export declare function createVoiceApi(client: HttpClient): VoiceApi;
//# sourceMappingURL=voice.d.ts.map