export const voiceLocalApiProxyPackageMeta = {
  architecture: "pc-react",
  capability: "voice-local-api-proxy",
  domain: "voice",
  package: "@sdkwork/voice-local-api-proxy",
  status: "ready",
  workspace: "sdkwork-voice",
} as const;

export type VoiceLocalApiProxyPackageMeta = typeof voiceLocalApiProxyPackageMeta;

export * from "./types.ts";
export * from "./config.ts";
export * from "./operations.ts";
export * from "./schema.ts";
export * from "./sqlite.ts";
export * from "./postgresql.ts";
