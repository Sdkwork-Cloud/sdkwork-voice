import type {
  SdkworkVoiceProviderInvocationResult,
  SdkworkVoiceTask,
} from "@sdkwork/voice-contracts";

export interface VoiceProviderOptions {
  providerCode?: string;
  providerOptions?: Record<string, unknown>;
  providerRouteId?: string;
}

export interface VoiceSpeechCreateCommand {
  callbackUrl?: string;
  idempotencyKey?: string;
  input: string | string[];
  instructions?: string;
  metadata?: Record<string, unknown>;
  model: string;
  provider?: VoiceProviderOptions;
  responseFormat?: "aac" | "flac" | "mp3" | "opus" | "pcm" | "wav";
  speed?: number;
  voice: string;
}

export interface VoiceTranscriptionCreateCommand {
  callbackUrl?: string;
  file: unknown;
  idempotencyKey?: string;
  language?: string;
  metadata?: Record<string, unknown>;
  model: string;
  prompt?: string;
  provider?: VoiceProviderOptions;
  responseFormat?: "json" | "text" | "srt" | "verbose_json" | "vtt";
}

export interface VoiceTranslationCreateCommand {
  callbackUrl?: string;
  file: unknown;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  model: string;
  prompt?: string;
  provider?: VoiceProviderOptions;
  responseFormat?: "json" | "text" | "srt" | "verbose_json" | "vtt";
  sourceLanguage?: string;
  targetLanguage?: string;
}

export interface VoiceSoundEffectCreateCommand {
  callbackUrl?: string;
  durationSeconds?: number;
  idempotencyKey?: string;
  loop?: boolean;
  metadata?: Record<string, unknown>;
  model: string;
  prompt: string;
  promptInfluence?: number;
  provider?: VoiceProviderOptions;
  responseFormat?: "mp3" | "wav";
}

export interface VoiceMusicCreateCommand {
  callbackUrl?: string;
  durationSeconds?: number;
  idempotencyKey?: string;
  instrumental?: boolean;
  metadata?: Record<string, unknown>;
  model: string;
  negativeTags?: string;
  prompt: string;
  provider?: VoiceProviderOptions;
  tags?: string;
  title?: string;
}

export interface VoiceProviderTaskCommand {
  providerCode?: string;
  providerTaskId: string;
}

export interface VoiceProviderTaskSnapshot {
  providerCode: string;
  providerResponse?: unknown;
  providerTaskId: string;
  status?: string;
  task?: SdkworkVoiceTask;
}

export interface VoiceProviderAdapter {
  cancelTask(command: VoiceProviderTaskCommand): Promise<VoiceProviderTaskSnapshot>;
  queryTask(command: VoiceProviderTaskCommand): Promise<VoiceProviderTaskSnapshot>;
  startMusic(command: VoiceMusicCreateCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  startSoundEffect(command: VoiceSoundEffectCreateCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  startSpeech(command: VoiceSpeechCreateCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  startTranscription(command: VoiceTranscriptionCreateCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  startTranslation(command: VoiceTranslationCreateCommand): Promise<SdkworkVoiceProviderInvocationResult>;
}

export interface ClawRouterVoiceProviderClient {
  audio?: {
    speech?: {
      create(body: unknown): Promise<unknown>;
    };
    transcriptions?: {
      create(body: unknown): Promise<unknown>;
    };
    translations?: {
      create(body: unknown): Promise<unknown>;
    };
  };
  audioSuno?: {
    v1?: {
      music?: {
        generations?: {
          create(body: unknown): Promise<unknown>;
          retrieve?(taskId: string): Promise<unknown>;
        };
      };
    };
  };
  videosVolcengine?: {
    api?: {
      v3?: {
        contents?: {
          generations?: {
            tasks?: {
              create(body: unknown): Promise<unknown>;
              retrieve?(taskId: string): Promise<unknown>;
            };
          };
        };
      };
    };
  };
}

export interface ProviderRouteInvocation {
  body?: unknown;
  method: "GET" | "POST";
  path: string;
  providerCode: string;
}

export interface ProviderRouteInvocationResult {
  body?: unknown;
  contentType?: string;
  providerCode?: string;
  providerTaskId?: string;
  status?: string;
}

export interface ClawRouterVoiceProviderAdapterOptions {
  client: ClawRouterVoiceProviderClient;
  defaultProviderCode?: string;
  invokeProviderRoute?: (invocation: ProviderRouteInvocation) => Promise<ProviderRouteInvocationResult>;
}

function providerCodeFrom(command: { provider?: VoiceProviderOptions }, fallback: string) {
  return command.provider?.providerCode || fallback;
}

function requireClientMethod<T>(value: T | undefined, name: string): T {
  if (!value) {
    throw new Error(`Missing claw-router SDK method: ${name}`);
  }
  return value;
}

function providerTaskIdFrom(response: unknown) {
  if (!response || typeof response !== "object") {
    return undefined;
  }
  const object = response as Record<string, unknown>;
  return typeof object.task_id === "string"
    ? object.task_id
    : typeof object.id === "string"
      ? object.id
      : undefined;
}

function providerStatusFrom(response: unknown) {
  if (!response || typeof response !== "object") {
    return undefined;
  }
  const object = response as Record<string, unknown>;
  return typeof object.status === "string"
    ? object.status
    : typeof object.state === "string"
      ? object.state
      : undefined;
}

function completed(providerCode: string, providerResponse: unknown): SdkworkVoiceProviderInvocationResult {
  return {
    providerCode,
    providerResponse,
    status: "completed",
  };
}

function taskStarted(providerCode: string, providerResponse: unknown): SdkworkVoiceProviderInvocationResult {
  return {
    providerCode,
    providerResponse,
    providerTaskId: providerTaskIdFrom(providerResponse),
    status: "task_started",
  };
}

function buildSpeechBody(command: VoiceSpeechCreateCommand) {
  return {
    input: command.input,
    metadata: command.metadata,
    model: command.model,
    response_format: command.responseFormat,
    speed: command.speed,
    voice: command.voice,
  };
}

function buildTranscriptionBody(command: VoiceTranscriptionCreateCommand) {
  return {
    file: command.file,
    language: command.language,
    model: command.model,
    prompt: command.prompt,
    response_format: command.responseFormat,
  };
}

function buildTranslationBody(command: VoiceTranslationCreateCommand) {
  return {
    file: command.file,
    model: command.model,
    prompt: command.prompt,
    response_format: command.responseFormat,
  };
}

function buildSunoMusicBody(command: VoiceMusicCreateCommand) {
  return {
    callback_url: command.callbackUrl,
    duration: command.durationSeconds,
    model: command.model,
    negative_tags: command.negativeTags,
    prompt: command.prompt,
    tags: command.tags,
    title: command.title,
  };
}

function buildVolcengineContentTaskBody(command: VoiceMusicCreateCommand) {
  return {
    callback_url: command.callbackUrl,
    content: [{ text: command.prompt, type: "text" }],
    metadata: command.metadata,
    model: command.model,
  };
}

function buildElevenLabsSoundBody(command: VoiceSoundEffectCreateCommand) {
  return {
    duration_seconds: command.durationSeconds,
    loop: command.loop,
    model_id: command.model,
    prompt_influence: command.promptInfluence,
    text: command.prompt,
  };
}

function withDefinedValues<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)) as Partial<T>;
}

function elevenLabsSoundPath(responseFormat: VoiceSoundEffectCreateCommand["responseFormat"]) {
  return responseFormat
    ? `/provider/elevenlabs/v1/sound-generation?output_format=${encodeURIComponent(responseFormat)}`
    : "/provider/elevenlabs/v1/sound-generation";
}

export function createClawRouterVoiceProviderAdapter(
  options: ClawRouterVoiceProviderAdapterOptions,
): VoiceProviderAdapter {
  const defaultProviderCode = options.defaultProviderCode || "openai";

  return {
    async startSpeech(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const create = requireClientMethod(options.client.audio?.speech?.create, "audio.speech.create");
      const response = await create(withDefinedValues(buildSpeechBody(command)));
      return completed(providerCode, response);
    },

    async startTranscription(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const create = requireClientMethod(options.client.audio?.transcriptions?.create, "audio.transcriptions.create");
      const response = await create(withDefinedValues(buildTranscriptionBody(command)));
      return completed(providerCode, response);
    },

    async startTranslation(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const create = requireClientMethod(options.client.audio?.translations?.create, "audio.translations.create");
      const response = await create(withDefinedValues(buildTranslationBody(command)));
      return completed(providerCode, response);
    },

    async startSoundEffect(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const invokeProviderRoute = requireClientMethod(options.invokeProviderRoute, "invokeProviderRoute");
      const response = await invokeProviderRoute({
        body: withDefinedValues(buildElevenLabsSoundBody(command)),
        method: "POST",
        path: elevenLabsSoundPath(command.responseFormat),
        providerCode,
      });
      return {
        providerCode: response.providerCode || providerCode,
        providerResponse: response.body,
        providerTaskId: response.providerTaskId,
        status: response.providerTaskId ? "task_started" : "completed",
      };
    },

    async startMusic(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      if (providerCode === "volcengine") {
        const create = requireClientMethod(
          options.client.videosVolcengine?.api?.v3?.contents?.generations?.tasks?.create,
          "videosVolcengine.api.v3.contents.generations.tasks.create",
        );
        const response = await create(withDefinedValues(buildVolcengineContentTaskBody(command)));
        return taskStarted(providerCode, response);
      }

      const create = requireClientMethod(
        options.client.audioSuno?.v1?.music?.generations?.create,
        "audioSuno.v1.music.generations.create",
      );
      const response = await create(withDefinedValues(buildSunoMusicBody(command)));
      return taskStarted(providerCode, response);
    },

    async queryTask(command) {
      const providerCode = command.providerCode || defaultProviderCode;
      const retrieve = providerCode === "volcengine"
        ? options.client.videosVolcengine?.api?.v3?.contents?.generations?.tasks?.retrieve
        : options.client.audioSuno?.v1?.music?.generations?.retrieve;
      const response = await requireClientMethod(retrieve, `${providerCode}.task.retrieve`)(command.providerTaskId);
      return {
        providerCode,
        providerResponse: response,
        providerTaskId: command.providerTaskId,
        status: providerStatusFrom(response),
      };
    },

    async cancelTask(command) {
      return {
        providerCode: command.providerCode || defaultProviderCode,
        providerTaskId: command.providerTaskId,
        status: "cancel_requested",
      };
    },
  };
}

export const voiceProviderAdapterPackageMeta = {
  architecture: "common",
  capability: "provider-adapter",
  domain: "voice",
  package: "@sdkwork/voice-provider-adapter",
  status: "ready",
  workspace: "sdkwork-voice",
} as const;
