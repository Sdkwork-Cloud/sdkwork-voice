import type { VoiceTaskStatus } from './voice-task-status';
export interface VoiceTaskEvent {
    id: string;
    taskId: string;
    eventType: string;
    fromStatus?: VoiceTaskStatus;
    toStatus?: VoiceTaskStatus;
    providerEventId?: string;
    providerTaskId?: string;
    createdAt: string;
}
//# sourceMappingURL=voice-task-event.d.ts.map