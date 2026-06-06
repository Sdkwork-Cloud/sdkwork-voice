export type SdkworkVoiceMediaKind = "audio" | "voice";
export type SdkworkVoiceMediaSource = "data_url" | "drive" | "external_url" | "generated" | "provider_asset";

export type SdkworkVoiceOperationType =
  | "speech"
  | "transcription"
  | "translation"
  | "sound_effect"
  | "music"
  | "realtime_transcription"
  | "realtime_translation";

export type SdkworkVoiceTaskStatus =
  | "queued"
  | "routing"
  | "submitted"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "expired"
  | "needs_review";

export type SdkworkVoiceProviderRouteCapability =
  | "speech"
  | "transcription"
  | "translation"
  | "sound_effect"
  | "music"
  | "voice_catalog"
  | "voice_consent"
  | "realtime_transcription"
  | "realtime_translation";

export type SdkworkVoiceArtifactKind = "audio" | "transcript" | "translation" | "sfx" | "music";

export interface SdkworkVoiceMediaAiProvenance {
  generationTaskId?: string;
  model?: string;
  provenance: "edited" | "generated" | "imported" | "recorded";
  provider?: string;
  sourceMediaIds?: string[];
}

export interface SdkworkVoiceMediaAccess {
  expiresAt?: string;
  public?: boolean;
  scope?: "organization" | "owner" | "tenant" | "user";
}

export interface SdkworkVoiceMediaResource {
  access?: SdkworkVoiceMediaAccess;
  ai?: SdkworkVoiceMediaAiProvenance;
  checksum?: {
    algorithm: "md5" | "sha1" | "sha256";
    value: string;
  };
  durationSeconds?: number;
  fileName?: string;
  id?: string;
  kind: SdkworkVoiceMediaKind;
  metadata?: Record<string, unknown>;
  mimeType?: string;
  sizeBytes?: number;
  source: SdkworkVoiceMediaSource;
  title?: string;
  uri?: string;
  url?: string;
}

export interface SdkworkVoiceTask {
  artifacts?: SdkworkVoiceArtifact[];
  completedAt?: string;
  createdAt: string;
  errorCode?: string;
  errorMessage?: string;
  id: string;
  model?: string;
  operationType: SdkworkVoiceOperationType;
  progress?: number;
  providerCode?: string;
  providerTaskId?: string;
  status: SdkworkVoiceTaskStatus;
  updatedAt: string;
}

export interface SdkworkVoiceArtifact {
  durationSeconds?: number;
  id: string;
  kind: SdkworkVoiceArtifactKind;
  mediaResource: SdkworkVoiceMediaResource;
  providerAssetId?: string;
  providerCode?: string;
  taskId: string;
  transcriptText?: string;
  translationText?: string;
}

export interface SdkworkVoiceTaskEvent {
  createdAt: string;
  eventType: string;
  fromStatus?: SdkworkVoiceTaskStatus;
  id: string;
  providerEventId?: string;
  providerTaskId?: string;
  taskId: string;
  toStatus?: SdkworkVoiceTaskStatus;
}

export interface SdkworkVoiceProviderInvocationResult {
  artifacts?: SdkworkVoiceArtifact[];
  providerCode: string;
  providerResponse?: unknown;
  providerTaskId?: string;
  status: "completed" | "task_started" | "accepted_webhook";
  task?: SdkworkVoiceTask;
}

export const voiceContractsPackageMeta = {
  architecture: "common",
  capability: "contracts",
  domain: "voice",
  package: "@sdkwork/voice-contracts",
  status: "ready",
  workspace: "sdkwork-voice",
} as const;
