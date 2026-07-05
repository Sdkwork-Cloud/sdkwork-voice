import type { VoiceTaskStatus } from './voice-task-status';

export interface VoiceTaskReconcileCommand {
  /** Normalized provider invocation output from the generation worker or webhook replay. */
  providerResult?: Record<string, unknown>;
}
