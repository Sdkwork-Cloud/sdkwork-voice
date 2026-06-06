import type {
  VoiceLocalApiCapability,
  VoiceLocalApiClientProtocol,
  VoiceLocalApiProxyHttpMethod,
} from "./types.ts";

export type VoiceLocalApiProxyRouteGroupId = "voice-audio";

export interface VoiceLocalApiProxyOperation {
  capability: VoiceLocalApiCapability;
  consumerProtocol: VoiceLocalApiClientProtocol;
  groupId: VoiceLocalApiProxyRouteGroupId;
  id: string;
  method: VoiceLocalApiProxyHttpMethod;
  pathPattern: string;
  probeSupport: boolean;
  streaming: boolean;
}

export interface VoiceLocalApiProxyRouteGroup {
  capabilityFamilies: VoiceLocalApiCapability[];
  id: VoiceLocalApiProxyRouteGroupId;
  operationIds: string[];
}

const VOICE_LOCAL_API_PROXY_OPERATION_CATALOG = [
  {
    id: "openai.v1.audio.speech.create",
    capability: "audio-speech",
    consumerProtocol: "openai-compatible",
    method: "POST",
    pathPattern: "/v1/audio/speech",
    streaming: false,
    groupId: "voice-audio",
    probeSupport: true,
  },
  {
    id: "openai.v1.audio.transcriptions.create",
    capability: "audio-transcription",
    consumerProtocol: "openai-compatible",
    method: "POST",
    pathPattern: "/v1/audio/transcriptions",
    streaming: false,
    groupId: "voice-audio",
    probeSupport: true,
  },
  {
    id: "openai.v1.audio.translations.create",
    capability: "audio-translation",
    consumerProtocol: "openai-compatible",
    method: "POST",
    pathPattern: "/v1/audio/translations",
    streaming: false,
    groupId: "voice-audio",
    probeSupport: true,
  },
] as const satisfies readonly VoiceLocalApiProxyOperation[];

const VOICE_LOCAL_API_PROXY_ROUTE_CAPABILITIES: readonly VoiceLocalApiCapability[] = [
  "audio-speech",
  "audio-transcription",
  "audio-translation",
];

export function createVoiceLocalApiProxyOperationCatalog(): VoiceLocalApiProxyOperation[] {
  return VOICE_LOCAL_API_PROXY_OPERATION_CATALOG.map((operation) => ({ ...operation }));
}

export function findVoiceLocalApiProxyOperation(operationId: string) {
  return createVoiceLocalApiProxyOperationCatalog().find((operation) => operation.id === operationId);
}

export function listVoiceLocalApiProxyOperationsByCapability(capability: VoiceLocalApiCapability) {
  return createVoiceLocalApiProxyOperationCatalog().filter((operation) => operation.capability === capability);
}

export function createVoiceLocalApiProxyRouteGroups(
  operations = createVoiceLocalApiProxyOperationCatalog(),
): VoiceLocalApiProxyRouteGroup[] {
  const group: VoiceLocalApiProxyRouteGroup = {
    capabilityFamilies: [...VOICE_LOCAL_API_PROXY_ROUTE_CAPABILITIES],
    id: "voice-audio",
    operationIds: operations.filter((operation) => operation.groupId === "voice-audio").map((operation) => operation.id),
  };

  return group.operationIds.length > 0 ? [group] : [];
}
