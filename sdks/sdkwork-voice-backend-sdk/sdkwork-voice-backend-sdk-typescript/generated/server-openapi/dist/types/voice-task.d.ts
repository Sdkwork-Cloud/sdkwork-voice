import type { VoiceArtifact } from './voice-artifact';
import type { VoiceOperationType } from './voice-operation-type';
import type { VoiceTaskStatus } from './voice-task-status';
export interface VoiceTask {
    id: string;
    operationType: VoiceOperationType;
    status: VoiceTaskStatus;
    progress?: number;
    providerCode?: string;
    providerTaskId?: string;
    model?: string;
    artifacts?: VoiceArtifact[];
    errorCode?: string;
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
}
//# sourceMappingURL=voice-task.d.ts.map