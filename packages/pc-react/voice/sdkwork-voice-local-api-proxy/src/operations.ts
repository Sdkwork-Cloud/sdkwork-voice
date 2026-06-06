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
  {
    id: "openai.v1.realtime.transcription_sessions.create",
    capability: "audio-realtime-transcription",
    consumerProtocol: "openai-compatible",
    method: "POST",
    pathPattern: "/v1/realtime/transcription_sessions",
    streaming: false,
    groupId: "voice-audio",
    probeSupport: true,
  },
  {
    id: "openai.v1.realtime.translations.create",
    capability: "audio-realtime-translation",
    consumerProtocol: "openai-compatible",
    method: "POST",
    pathPattern: "/v1/realtime/translations",
    streaming: false,
    groupId: "voice-audio",
    probeSupport: true,
  },
  {
    id: "suno.v1.music.generations.create",
    capability: "audio-music",
    consumerProtocol: "custom-http",
    method: "POST",
    pathPattern: "/suno/v1/music/generations",
    streaming: false,
    groupId: "voice-audio",
    probeSupport: true,
  },
  {
    id: "suno.v1.music.generations.retrieve",
    capability: "audio-music",
    consumerProtocol: "custom-http",
    method: "GET",
    pathPattern: "/suno/v1/music/generations/{task_id}",
    streaming: false,
    groupId: "voice-audio",
    probeSupport: true,
  },
  {
    id: "elevenlabs.v1.sound_generation.create",
    capability: "audio-sound-effect",
    consumerProtocol: "custom-http",
    method: "POST",
    pathPattern: "/provider/elevenlabs/v1/sound-generation",
    streaming: false,
    groupId: "voice-audio",
    probeSupport: true,
  },
  {
    id: "volcengine.api.v3.contents.generations.tasks.create",
    capability: "audio-music",
    consumerProtocol: "custom-http",
    method: "POST",
    pathPattern: "/volcengine/api/v3/contents/generations/tasks",
    streaming: false,
    groupId: "voice-audio",
    probeSupport: true,
  },
  {
    id: "volcengine.api.v3.contents.generations.tasks.retrieve",
    capability: "audio-music",
    consumerProtocol: "custom-http",
    method: "GET",
    pathPattern: "/volcengine/api/v3/contents/generations/tasks/{task_id}",
    streaming: false,
    groupId: "voice-audio",
    probeSupport: true,
  },
] as const satisfies readonly VoiceLocalApiProxyOperation[];

const VOICE_LOCAL_API_PROXY_ROUTE_CAPABILITIES: readonly VoiceLocalApiCapability[] = [
  "audio-speech",
  "audio-transcription",
  "audio-translation",
  "audio-sound-effect",
  "audio-music",
  "audio-realtime-transcription",
  "audio-realtime-translation",
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
