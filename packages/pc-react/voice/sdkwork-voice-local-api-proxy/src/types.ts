export const VOICE_LOCAL_API_PROXY_SCHEMA_VERSION = 1 as const;
export const VOICE_LOCAL_API_PROXY_TABLE_PREFIX = "vlap_" as const;
export const VOICE_LOCAL_API_PROXY_DEFAULT_SQLITE_FILENAME = "voice-local-api-proxy.db" as const;
export const VOICE_LOCAL_API_PROXY_DEFAULT_POSTGRES_SCHEMA = "voice_local_api_proxy" as const;
export const VOICE_LOCAL_API_PROXY_DEFAULT_HOST = "127.0.0.1" as const;
export const VOICE_LOCAL_API_PROXY_DEFAULT_PORT = 21381 as const;

export type VoiceLocalApiProxyMode = "desktop-local" | "server-managed";
export type VoiceLocalApiClientProtocol = "openai-compatible" | "custom-http";
export type VoiceLocalApiUpstreamProtocol = "openai-compatible" | "azure-openai" | "custom-http";
export type VoiceLocalApiCapability = "audio-speech" | "audio-transcription" | "audio-translation";
export type VoiceLocalApiProxyManagedBy = "system" | "user";
export type VoiceLocalApiProxyModelRole = "speech" | "transcription" | "translation" | "custom";
export type VoiceLocalApiProxyExposureTarget = "sdkwork" | "desktop-clients" | "internal-sdk" | "custom";
export type VoiceLocalApiProxyHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type VoiceLocalApiProxyStorageConfig =
  | {
      dialect: "sqlite";
      sqlitePath: string;
    }
  | {
      dialect: "postgresql";
      postgresUrl: string;
      schema?: string;
    };

export interface VoiceLocalApiProxyBind {
  host: string;
  port: number;
  publicBaseUrl: string;
}

export interface VoiceLocalApiProxyCaptureConfig {
  enabled: boolean;
  storeMessageContent: boolean;
  redactHeaders: string[];
  retentionDays?: number;
}

export interface VoiceProxyUpstreamIdentity {
  providerId: string;
  protocolKind: VoiceLocalApiUpstreamProtocol;
  mirrorProtocolIdentity?: string;
  baseUrl: string;
  credentialRef?: string;
}

export interface VoiceRouteCapabilityBinding {
  capability: VoiceLocalApiCapability;
  enabled: boolean;
  operationSet: string[];
  streaming: boolean;
  timeoutMs?: number;
  pathOverride?: string;
  methodOverride?: VoiceLocalApiProxyHttpMethod;
  requestPolicyRef?: string;
  responsePolicyRef?: string;
}

export interface VoiceLocalApiProxyModelBinding {
  role: VoiceLocalApiProxyModelRole;
  modelId: string;
  capability?: VoiceLocalApiCapability;
  label?: string;
}

export interface VoiceLocalApiProxyExposure {
  target: VoiceLocalApiProxyExposureTarget;
  enabled: boolean;
  consumerId?: string;
  label?: string;
}

export interface VoiceLocalApiProxyRouteRuntimePolicy {
  retryCount?: number;
  timeoutMs?: number;
}

export interface VoiceLocalApiProxyRoute {
  id: string;
  name: string;
  enabled: boolean;
  managedBy: VoiceLocalApiProxyManagedBy;
  providerId: string;
  clientProtocol: VoiceLocalApiClientProtocol;
  upstreamProtocol: VoiceLocalApiUpstreamProtocol;
  upstream: VoiceProxyUpstreamIdentity;
  capabilities: VoiceRouteCapabilityBinding[];
  modelBindings: VoiceLocalApiProxyModelBinding[];
  runtimePolicy?: VoiceLocalApiProxyRouteRuntimePolicy;
  exposures: VoiceLocalApiProxyExposure[];
  tags: string[];
  notes?: string;
}

export interface VoiceLocalApiProxyDefaults {
  defaultRouteByCapability: Partial<Record<VoiceLocalApiCapability, string>>;
  defaultRouteByProtocol: Partial<Record<VoiceLocalApiClientProtocol, string>>;
}

export interface VoiceLocalApiProxyPolicies {
  request: Record<string, string>;
  response: Record<string, string>;
}

export interface VoiceLocalApiProxyRuntimeSettings {
  retryCount: number;
  cleanupIntervalMs: number;
  maxConcurrentRequests: number;
  startupProbeTimeoutMs: number;
}

export interface VoiceLocalApiProxyConfig {
  schemaVersion: number;
  mode: VoiceLocalApiProxyMode;
  bind: VoiceLocalApiProxyBind;
  storage: VoiceLocalApiProxyStorageConfig;
  capture: VoiceLocalApiProxyCaptureConfig;
  routes: VoiceLocalApiProxyRoute[];
  defaults: VoiceLocalApiProxyDefaults;
  policies: VoiceLocalApiProxyPolicies;
  runtime: VoiceLocalApiProxyRuntimeSettings;
}

export interface VoiceProxyUpstreamIdentityDraft {
  providerId: string;
  protocolKind: VoiceLocalApiUpstreamProtocol;
  mirrorProtocolIdentity?: string;
  baseUrl: string;
  credentialRef?: string;
}

export interface VoiceRouteCapabilityBindingDraft {
  capability: VoiceLocalApiCapability;
  enabled?: boolean;
  operationSet?: string[];
  streaming?: boolean;
  timeoutMs?: number;
  pathOverride?: string;
  methodOverride?: VoiceLocalApiProxyHttpMethod | Lowercase<VoiceLocalApiProxyHttpMethod>;
  requestPolicyRef?: string;
  responsePolicyRef?: string;
}

export interface VoiceLocalApiProxyModelBindingDraft {
  role: VoiceLocalApiProxyModelRole;
  modelId: string;
  capability?: VoiceLocalApiCapability;
  label?: string;
}

export interface VoiceLocalApiProxyExposureDraft {
  target: VoiceLocalApiProxyExposureTarget;
  enabled?: boolean;
  consumerId?: string;
  label?: string;
}

export interface VoiceLocalApiProxyRouteDraft {
  id?: string;
  name?: string;
  enabled?: boolean;
  managedBy?: VoiceLocalApiProxyManagedBy;
  providerId: string;
  clientProtocol: VoiceLocalApiClientProtocol;
  upstreamProtocol: VoiceLocalApiUpstreamProtocol;
  upstream: VoiceProxyUpstreamIdentityDraft;
  capabilities?: VoiceRouteCapabilityBindingDraft[];
  modelBindings?: VoiceLocalApiProxyModelBindingDraft[];
  runtimePolicy?: VoiceLocalApiProxyRouteRuntimePolicy;
  exposures?: VoiceLocalApiProxyExposureDraft[];
  tags?: string[];
  notes?: string;
}

export interface VoiceLocalApiProxyConfigDraft {
  schemaVersion?: number;
  mode?: VoiceLocalApiProxyMode;
  bind?: Partial<VoiceLocalApiProxyBind>;
  storage: VoiceLocalApiProxyStorageConfig;
  capture?: Partial<VoiceLocalApiProxyCaptureConfig>;
  routes?: VoiceLocalApiProxyRouteDraft[];
  defaults?: Partial<VoiceLocalApiProxyDefaults>;
  policies?: Partial<VoiceLocalApiProxyPolicies>;
  runtime?: Partial<VoiceLocalApiProxyRuntimeSettings>;
}
