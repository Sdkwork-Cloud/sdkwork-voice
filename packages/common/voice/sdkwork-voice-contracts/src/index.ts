export type SdkworkVoiceMediaKind = "audio" | "voice";
export type SdkworkVoiceMediaSource = "data_url" | "drive" | "external_url" | "generated" | "provider_asset";

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

export const voiceContractsPackageMeta = {
  architecture: "common",
  capability: "contracts",
  domain: "voice",
  package: "@sdkwork/voice-contracts",
  status: "ready",
  workspace: "sdkwork-voice",
} as const;
