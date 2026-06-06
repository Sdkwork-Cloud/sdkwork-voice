import type { MediaResource } from './media-resource';
import type { VoiceArtifactDriveSync } from './voice-artifact-drive-sync';
export interface VoiceArtifact {
    id: string;
    taskId: string;
    kind: 'audio' | 'transcript' | 'translation' | 'sfx' | 'music' | 'image' | 'video';
    artifactIndex?: number;
    providerCode?: string;
    providerAssetId?: string;
    durationSeconds?: number;
    transcriptText?: string;
    translationText?: string;
    mediaResource: MediaResource;
    driveSync?: VoiceArtifactDriveSync;
}
//# sourceMappingURL=voice-artifact.d.ts.map