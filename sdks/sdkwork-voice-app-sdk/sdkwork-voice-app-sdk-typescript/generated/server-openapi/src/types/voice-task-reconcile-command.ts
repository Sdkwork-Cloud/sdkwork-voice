import type { VoiceTaskStatus } from './voice-task-status';

export interface VoiceTaskReconcileCommand {
  /** Normalized provider invocation output from the generation worker or webhook replay. */
  providerResult?: { status?: VoiceTaskStatus; providerTaskId?: string; providerResponse?: Record<string, unknown>; generatedArtifacts?: Record<string, unknown>[]; result?: Record<string, unknown>; errorCode?: string; errorMessage?: string; } & Record<string, unknown>;
}
