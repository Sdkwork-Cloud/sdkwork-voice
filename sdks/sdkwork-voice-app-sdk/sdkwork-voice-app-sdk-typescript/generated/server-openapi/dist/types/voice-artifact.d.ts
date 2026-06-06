import type { MediaResource } from './media-resource';
export interface VoiceArtifact {
    id: string;
    taskId: string;
    kind: 'audio' | 'transcript' | 'translation' | 'sfx' | 'music';
    providerCode?: string;
    providerAssetId?: string;
    durationSeconds?: number;
    transcriptText?: string;
    translationText?: string;
    mediaResource: MediaResource;
}
//# sourceMappingURL=voice-artifact.d.ts.map