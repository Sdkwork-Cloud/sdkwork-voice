import type { VoiceArtifactDriveSyncStatus } from './voice-artifact-drive-sync-status';

export interface VoiceArtifactDriveSync {
  syncNo: string;
  taskId: string;
  artifactId: string;
  artifactIndex: number;
  actorType: 'anonymous' | 'system' | 'user';
  userId?: string;
  anonymousId?: string;
  driveSpaceType: 'ai_generated' | 'app_upload' | 'app' | 'personal' | 'team' | 'knowledge_base';
  driveSpaceId?: string;
  driveNodeId?: string;
  driveUploadItemId?: string;
  driveUploadSessionId?: string;
  driveResource?: Record<string, unknown>;
  sourceUri?: string;
  status: VoiceArtifactDriveSyncStatus;
  errorCode?: string;
  errorMessage?: string;
}
