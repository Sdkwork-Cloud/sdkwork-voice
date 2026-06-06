import type {
  SdkworkVoiceArtifactKind,
  SdkworkVoiceMediaKind,
  SdkworkVoiceProviderGeneratedArtifact,
  SdkworkVoiceProviderGeneratedArtifactSource,
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
  generatedArtifacts?: SdkworkVoiceProviderGeneratedArtifact[];
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

interface VoiceProviderArtifactCandidate {
  contentLength?: number;
  durationSeconds?: number;
  fileNameBase?: string;
  kind: SdkworkVoiceArtifactKind;
  mediaKind: SdkworkVoiceMediaKind;
  metadata?: Record<string, unknown>;
  mimeType?: string;
  providerAssetId?: string;
  source: SdkworkVoiceProviderGeneratedArtifactSource;
  sourceUri: string;
  title?: string;
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

function completed(
  providerCode: string,
  providerResponse: unknown,
  defaults?: VoiceGeneratedArtifactDefaults,
): SdkworkVoiceProviderInvocationResult {
  return {
    generatedArtifacts: normalizeVoiceProviderGeneratedArtifacts(providerResponse, providerCode, defaults),
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

export interface VoiceGeneratedArtifactDefaults {
  contentType?: string;
  fileExtension?: string;
  kind?: SdkworkVoiceArtifactKind;
  mediaKind?: SdkworkVoiceMediaKind;
  operation?: string;
  title?: string;
}

export function normalizeVoiceProviderGeneratedArtifacts(
  providerResponse: unknown,
  providerCode: string,
  defaults: VoiceGeneratedArtifactDefaults = {},
): SdkworkVoiceProviderGeneratedArtifact[] | undefined {
  const candidates = collectGeneratedArtifactCandidates(providerResponse, providerCode, defaults);
  if (candidates.length === 0) {
    return undefined;
  }

  return candidates.map((candidate, artifactIndex) => {
    const mimeType = normalizeMimeType(
      candidate.mimeType || defaults.contentType,
      candidate.kind,
      candidate.sourceUri,
    );
    const extension = extensionForMimeType(mimeType) || extensionFromUri(candidate.sourceUri) || defaults.fileExtension || "bin";
    const fileNameBase = sanitizeFileNameBase(candidate.fileNameBase || candidate.providerAssetId || candidate.kind);
    return {
      artifactIndex,
      contentLength: candidate.contentLength,
      durationSeconds: candidate.durationSeconds,
      fileName: `${fileNameBase}-${artifactIndex.toString().padStart(4, "0")}.${extension}`,
      kind: candidate.kind,
      mediaKind: candidate.mediaKind,
      metadata: candidate.metadata,
      mimeType,
      providerAssetId: candidate.providerAssetId,
      providerCode,
      source: candidate.source,
      sourceUri: candidate.sourceUri,
      title: candidate.title,
    };
  });
}

function collectGeneratedArtifactCandidates(
  providerResponse: unknown,
  providerCode: string,
  defaults: VoiceGeneratedArtifactDefaults,
): VoiceProviderArtifactCandidate[] {
  if (isBlobLike(providerResponse)) {
    return [
      {
        contentLength: providerResponse.size,
        fileNameBase: defaults.operation || defaults.kind || "artifact",
        kind: defaults.kind || "audio",
        mediaKind: defaults.mediaKind || "audio",
        mimeType: providerResponse.type || defaults.contentType,
        source: "generated",
        sourceUri: `provider://${providerCode}/${defaults.operation || defaults.kind || "artifact"}/0000`,
        title: defaults.title,
      },
    ];
  }

  if (!providerResponse || typeof providerResponse !== "object") {
    return [];
  }

  const object = providerResponse as Record<string, unknown>;
  const candidates: VoiceProviderArtifactCandidate[] = [];

  collectSunoTrackCandidates(object, candidates);
  collectProviderGeneratedMediaArray(object.videos, "video", candidates);
  collectProviderGeneratedMediaArray(object.images, "image", candidates);
  collectProviderGeneratedMediaArray(object.audios, defaults.kind || "audio", candidates);
  if (isRecord(object.result)) {
    collectProviderGeneratedMediaArray(object.result.videos, "video", candidates);
    collectProviderGeneratedMediaArray(object.result.images, "image", candidates);
    collectProviderGeneratedMediaArray(object.result.audios, defaults.kind || "audio", candidates);
  }
  collectOpenAiImageCandidates(object, candidates);

  if (candidates.length === 0) {
    const sourceUri = firstString(object.url, object.uri, object.audio_url, object.video_url, object.image_url);
    if (sourceUri) {
      candidates.push(candidateFromUri({
        durationSeconds: optionalNumber(object.duration, object.duration_seconds),
        fileNameBase: firstString(object.id, object.title) || defaults.operation,
        kind: defaults.kind || kindFromUri(sourceUri),
        mimeType: firstString(object.mime_type, object.mimeType) || defaults.contentType,
        providerAssetId: firstString(object.id),
        sourceUri,
        title: firstString(object.title) || defaults.title,
      }));
    }
  }

  return candidates;
}

function collectSunoTrackCandidates(object: Record<string, unknown>, candidates: VoiceProviderArtifactCandidate[]) {
  if (!Array.isArray(object.tracks)) {
    return;
  }

  for (const entry of object.tracks) {
    if (!isRecord(entry)) {
      continue;
    }
    const providerAssetId = firstString(entry.id);
    const title = firstString(entry.title);
    const durationSeconds = optionalNumber(entry.duration);
    const base = providerAssetId || title || "music";
    const audioUrl = firstString(entry.audio_url);
    if (audioUrl) {
      candidates.push(candidateFromUri({
        durationSeconds,
        fileNameBase: base,
        kind: "music",
        providerAssetId,
        sourceUri: audioUrl,
        title,
      }));
    }
    const imageUrl = firstString(entry.image_url);
    if (imageUrl) {
      candidates.push(candidateFromUri({
        fileNameBase: `${base}-cover`,
        kind: "image",
        providerAssetId,
        sourceUri: imageUrl,
        title,
      }));
    }
    const videoUrl = firstString(entry.video_url);
    if (videoUrl) {
      candidates.push(candidateFromUri({
        durationSeconds,
        fileNameBase: `${base}-video`,
        kind: "video",
        providerAssetId,
        sourceUri: videoUrl,
        title,
      }));
    }
  }
}

function collectProviderGeneratedMediaArray(
  value: unknown,
  kind: SdkworkVoiceArtifactKind,
  candidates: VoiceProviderArtifactCandidate[],
) {
  if (!Array.isArray(value)) {
    return;
  }

  for (const entry of value) {
    if (!isRecord(entry)) {
      continue;
    }
    const sourceUri = firstString(entry.url, entry.uri);
    if (!sourceUri) {
      continue;
    }
    candidates.push(candidateFromUri({
      durationSeconds: optionalNumber(entry.duration),
      fileNameBase: firstString(entry.id),
      kind,
      metadata: isRecord(entry.metadata) ? entry.metadata : undefined,
      mimeType: firstString(entry.mime_type, entry.mimeType),
      providerAssetId: firstString(entry.id),
      sourceUri,
    }));
  }
}

function collectOpenAiImageCandidates(object: Record<string, unknown>, candidates: VoiceProviderArtifactCandidate[]) {
  if (!Array.isArray(object.data)) {
    return;
  }

  for (const entry of object.data) {
    if (!isRecord(entry)) {
      continue;
    }
    const url = firstString(entry.url);
    const b64Json = firstString(entry.b64_json);
    const mimeType = firstString(entry.mime_type, entry.mimeType) || "image/png";
    if (url) {
      candidates.push(candidateFromUri({
        kind: "image",
        metadata: firstString(entry.revised_prompt)
          ? { revisedPrompt: firstString(entry.revised_prompt) }
          : undefined,
        mimeType,
        sourceUri: url,
      }));
    } else if (b64Json) {
      candidates.push({
        contentLength: estimateBase64ByteLength(b64Json),
        fileNameBase: "image",
        kind: "image",
        mediaKind: "image",
        metadata: firstString(entry.revised_prompt)
          ? { revisedPrompt: firstString(entry.revised_prompt) }
          : undefined,
        mimeType,
        source: "data_url",
        sourceUri: `data:${mimeType};base64,${b64Json}`,
      });
    }
  }
}

function candidateFromUri(input: {
  durationSeconds?: number;
  fileNameBase?: string;
  kind: SdkworkVoiceArtifactKind;
  metadata?: Record<string, unknown>;
  mimeType?: string;
  providerAssetId?: string;
  sourceUri: string;
  title?: string;
}): VoiceProviderArtifactCandidate {
  return {
    durationSeconds: input.durationSeconds,
    fileNameBase: input.fileNameBase,
    kind: input.kind,
    mediaKind: mediaKindForArtifactKind(input.kind),
    metadata: input.metadata,
    mimeType: input.mimeType,
    providerAssetId: input.providerAssetId,
    source: sourceForUri(input.sourceUri),
    sourceUri: input.sourceUri,
    title: input.title,
  };
}

function isBlobLike(value: unknown): value is Blob {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function optionalNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function mediaKindForArtifactKind(kind: SdkworkVoiceArtifactKind): SdkworkVoiceMediaKind {
  switch (kind) {
    case "image":
      return "image";
    case "video":
      return "video";
    case "transcript":
    case "translation":
      return "voice";
    case "audio":
    case "music":
    case "sfx":
      return "audio";
  }
}

function sourceForUri(uri: string): SdkworkVoiceProviderGeneratedArtifactSource {
  if (uri.startsWith("data:")) {
    return "data_url";
  }
  if (uri.startsWith("provider:")) {
    return "provider_asset";
  }
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return "external_url";
  }
  return "provider_asset";
}

function kindFromUri(uri: string): SdkworkVoiceArtifactKind {
  const extension = extensionFromUri(uri);
  if (extension && ["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
    return "image";
  }
  if (extension && ["mp4", "mov", "webm", "mkv"].includes(extension)) {
    return "video";
  }
  return "audio";
}

function normalizeMimeType(
  mimeType: string | undefined,
  kind: SdkworkVoiceArtifactKind,
  uri: string,
) {
  if (mimeType && mimeType.includes("/")) {
    return mimeType.toLowerCase();
  }
  const extension = extensionFromUri(uri);
  if (extension) {
    const fromExtension = mimeTypeForExtension(extension);
    if (fromExtension) {
      return fromExtension;
    }
  }
  switch (kind) {
    case "image":
      return "image/png";
    case "video":
      return "video/mp4";
    case "transcript":
    case "translation":
      return "text/plain";
    case "audio":
    case "music":
    case "sfx":
      return "audio/mpeg";
  }
}

function extensionFromUri(uri: string) {
  const withoutQuery = uri.split(/[?#]/, 1)[0] || uri;
  const match = /\.([a-zA-Z0-9]+)$/.exec(withoutQuery);
  return match?.[1]?.toLowerCase();
}

function extensionForMimeType(mimeType: string) {
  switch (mimeType.toLowerCase()) {
    case "audio/aac":
      return "aac";
    case "audio/flac":
      return "flac";
    case "audio/mpeg":
    case "audio/mp3":
      return "mp3";
    case "audio/ogg":
    case "audio/opus":
      return "opus";
    case "audio/wav":
    case "audio/wave":
    case "audio/x-wav":
      return "wav";
    case "image/gif":
      return "gif";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "text/plain":
      return "txt";
    case "video/mp4":
      return "mp4";
    case "video/quicktime":
      return "mov";
    case "video/webm":
      return "webm";
    default:
      return undefined;
  }
}

function mimeTypeForExtension(extension: string) {
  switch (extension.toLowerCase()) {
    case "aac":
      return "audio/aac";
    case "flac":
      return "audio/flac";
    case "mp3":
      return "audio/mpeg";
    case "opus":
      return "audio/opus";
    case "wav":
      return "audio/wav";
    case "gif":
      return "image/gif";
    case "jpeg":
    case "jpg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "mov":
      return "video/quicktime";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    default:
      return undefined;
  }
}

function sanitizeFileNameBase(value: string) {
  const sanitized = value
    .trim()
    .replace(/\.[a-zA-Z0-9]+$/, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return sanitized || "artifact";
}

function estimateBase64ByteLength(value: string) {
  const normalized = value.replace(/\s+/g, "");
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding);
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
      return completed(providerCode, response, {
        contentType: command.responseFormat ? mimeTypeForExtension(command.responseFormat) : "audio/mpeg",
        fileExtension: command.responseFormat || "mp3",
        kind: "audio",
        mediaKind: "audio",
        operation: "speech",
      });
    },

    async startTranscription(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const create = requireClientMethod(options.client.audio?.transcriptions?.create, "audio.transcriptions.create");
      const response = await create(withDefinedValues(buildTranscriptionBody(command)));
      return completed(providerCode, response, {
        contentType: "text/plain",
        fileExtension: command.responseFormat === "json" || command.responseFormat === "verbose_json" ? "json" : command.responseFormat || "txt",
        kind: "transcript",
        mediaKind: "voice",
        operation: "transcription",
      });
    },

    async startTranslation(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const create = requireClientMethod(options.client.audio?.translations?.create, "audio.translations.create");
      const response = await create(withDefinedValues(buildTranslationBody(command)));
      return completed(providerCode, response, {
        contentType: "text/plain",
        fileExtension: command.responseFormat === "json" || command.responseFormat === "verbose_json" ? "json" : command.responseFormat || "txt",
        kind: "translation",
        mediaKind: "voice",
        operation: "translation",
      });
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
        generatedArtifacts: normalizeVoiceProviderGeneratedArtifacts(response.body, response.providerCode || providerCode, {
          contentType: response.contentType || (command.responseFormat ? mimeTypeForExtension(command.responseFormat) : "audio/mpeg"),
          fileExtension: command.responseFormat || "mp3",
          kind: "sfx",
          mediaKind: "audio",
          operation: "sound-effect",
        }),
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
        generatedArtifacts: normalizeVoiceProviderGeneratedArtifacts(response, providerCode, {
          kind: providerCode === "volcengine" ? "video" : "music",
          mediaKind: providerCode === "volcengine" ? "video" : "audio",
          operation: "task",
        }),
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
