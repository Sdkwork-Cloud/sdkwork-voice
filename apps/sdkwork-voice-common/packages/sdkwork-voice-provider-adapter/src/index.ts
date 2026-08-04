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

export interface VoiceRealtimeTranscriptionSessionCreateCommand {
  inputAudioFormat?: string;
  inputAudioTranscription?: unknown;
  metadata?: Record<string, unknown>;
  model?: string;
  provider?: VoiceProviderOptions;
  turnDetection?: unknown;
}

export interface VoiceRealtimeTranslationSessionCreateCommand {
  metadata?: Record<string, unknown>;
  model?: string;
  provider?: VoiceProviderOptions;
  sourceLanguage?: string;
  targetLanguage?: string;
}

export interface VoiceRealtimeSessionCreateCommand {
  instructions?: string;
  metadata?: Record<string, unknown>;
  modalities?: string[];
  model?: string;
  provider?: VoiceProviderOptions;
  voice?: string;
}

export interface VoiceRealtimeClientSecretCreateCommand extends VoiceRealtimeSessionCreateCommand {}

export interface VoiceRealtimeCallCreateCommand {
  metadata?: Record<string, unknown>;
  provider?: VoiceProviderOptions;
  sdp?: string;
  session?: unknown;
}

export interface VoiceRealtimeCallActionCommand {
  callId: string;
  metadata?: Record<string, unknown>;
  provider?: VoiceProviderOptions;
}

export interface VoiceRealtimeCallReferCommand extends VoiceRealtimeCallActionCommand {
  target?: string;
}

export interface VoiceListCommand {
  after?: string;
  before?: string;
  limit?: number;
  order?: "asc" | "desc";
  provider?: VoiceProviderOptions;
}

export interface VoiceCreateCommand {
  description?: string;
  metadata?: Record<string, unknown>;
  name?: string;
  provider?: VoiceProviderOptions;
}

export interface VoiceRetrieveCommand {
  provider?: VoiceProviderOptions;
  voiceId: string;
}

export interface VoiceConsentListCommand {
  after?: string;
  before?: string;
  limit?: number;
  order?: "asc" | "desc";
  provider?: VoiceProviderOptions;
}

export interface VoiceConsentCreateCommand {
  consentDocument?: unknown;
  metadata?: Record<string, unknown>;
  name?: string;
  provider?: VoiceProviderOptions;
}

export interface VoiceConsentRetrieveCommand {
  consentId: string;
  provider?: VoiceProviderOptions;
}

export interface VoiceConsentUpdateCommand {
  consentId: string;
  metadata?: Record<string, unknown>;
  name?: string;
  provider?: VoiceProviderOptions;
}

export interface VoiceConsentDeleteCommand {
  consentId: string;
  provider?: VoiceProviderOptions;
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
  acceptRealtimeCall(command: VoiceRealtimeCallActionCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  cancelTask(command: VoiceProviderTaskCommand): Promise<VoiceProviderTaskSnapshot>;
  createRealtimeClientSecret(
    command: VoiceRealtimeClientSecretCreateCommand,
  ): Promise<SdkworkVoiceProviderInvocationResult>;
  createVoice(command: VoiceCreateCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  createVoiceConsent(command: VoiceConsentCreateCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  deleteVoiceConsent(command: VoiceConsentDeleteCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  hangupRealtimeCall(command: VoiceRealtimeCallActionCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  listVoiceConsents(command: VoiceConsentListCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  listVoices(command: VoiceListCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  queryTask(command: VoiceProviderTaskCommand): Promise<VoiceProviderTaskSnapshot>;
  referRealtimeCall(command: VoiceRealtimeCallReferCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  rejectRealtimeCall(command: VoiceRealtimeCallActionCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  retrieveVoice(command: VoiceRetrieveCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  retrieveVoiceConsent(command: VoiceConsentRetrieveCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  startRealtimeCall(command: VoiceRealtimeCallCreateCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  startRealtimeSession(command: VoiceRealtimeSessionCreateCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  startMusic(command: VoiceMusicCreateCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  startRealtimeTranscriptionSession(
    command: VoiceRealtimeTranscriptionSessionCreateCommand,
  ): Promise<SdkworkVoiceProviderInvocationResult>;
  startRealtimeTranslationSession(
    command: VoiceRealtimeTranslationSessionCreateCommand,
  ): Promise<SdkworkVoiceProviderInvocationResult>;
  startSoundEffect(command: VoiceSoundEffectCreateCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  startSpeech(command: VoiceSpeechCreateCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  startTranscription(command: VoiceTranscriptionCreateCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  startTranslation(command: VoiceTranslationCreateCommand): Promise<SdkworkVoiceProviderInvocationResult>;
  updateVoiceConsent(command: VoiceConsentUpdateCommand): Promise<SdkworkVoiceProviderInvocationResult>;
}

export interface CloudRouterVoiceProviderClient {
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
    voiceConsents?: {
      create(body: unknown): Promise<unknown>;
      delete(consentId: string): Promise<unknown>;
      list(params?: unknown): Promise<unknown>;
      retrieve(consentId: string): Promise<unknown>;
      update(consentId: string, body: unknown): Promise<unknown>;
    };
    voices?: {
      create(body: unknown): Promise<unknown>;
      list(params?: unknown): Promise<unknown>;
      retrieve(voiceId: string): Promise<unknown>;
    };
  };
  realtime?: {
    calls?: {
      accept?: {
        create?(callId: string, body: unknown): Promise<unknown>;
      };
      create?(body: unknown): Promise<unknown>;
      hangup?: {
        create?(callId: string, body: unknown): Promise<unknown>;
      };
      refer?: {
        create?(callId: string, body: unknown): Promise<unknown>;
      };
      reject?: {
        create?(callId: string, body: unknown): Promise<unknown>;
      };
    };
    clientSecrets?: {
      create?(body: unknown): Promise<unknown>;
    };
    sessions?: {
      create?(body: unknown): Promise<unknown>;
    };
    transcriptionSessions?: {
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
  imagesMidjourney?: {
    v1?: {
      images?: {
        generations?: {
          create?(body: unknown): Promise<unknown>;
          retrieve?(taskId: string): Promise<unknown>;
        };
      };
    };
  };
  imagesNanoBanana?: {
    v1?: {
      images?: {
        generations?: {
          create?(body: unknown): Promise<unknown>;
          retrieve?(taskId: string): Promise<unknown>;
        };
      };
    };
  };
  imagesVidu?: {
    ent?: {
      v2?: {
        reference2image?: {
          create?(body: unknown): Promise<unknown>;
        };
      };
    };
  };
  videosKling?: {
    v1?: {
      videos?: {
        generations?: {
          create?(body: unknown): Promise<unknown>;
          retrieve?(taskId: string): Promise<unknown>;
        };
      };
    };
  };
  videosVidu?: {
    ent?: {
      v2?: {
        img2video?: {
          create?(body: unknown): Promise<unknown>;
        };
        reference2video?: {
          create?(body: unknown): Promise<unknown>;
        };
        startEnd2video?: {
          create?(body: unknown): Promise<unknown>;
        };
        tasks?: {
          creations?: {
            list?(taskId: string): Promise<unknown>;
          };
        };
        text2video?: {
          create?(body: unknown): Promise<unknown>;
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

type VoiceTextResponseFormat = VoiceTranscriptionCreateCommand["responseFormat"];

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

export interface CloudRouterVoiceProviderAdapterOptions {
  client: CloudRouterVoiceProviderClient;
  defaultProviderCode?: string;
  invokeProviderRoute?: (invocation: ProviderRouteInvocation) => Promise<ProviderRouteInvocationResult>;
}

function providerCodeFrom(command: { provider?: VoiceProviderOptions }, fallback: string) {
  return command.provider?.providerCode || fallback;
}

function requireClientMethod<T>(value: T | undefined, name: string): T {
  if (!value) {
    throw new Error(`Missing cloud-router SDK method: ${name}`);
  }
  return value;
}

function callClientMethod(
  resource: object | undefined,
  methodName: string,
  name: string,
  ...args: unknown[]
): Promise<unknown> {
  const target = requireClientMethod(resource, name);
  const method = requireClientMethod(
    (target as Record<string, unknown>)[methodName] as ((...methodArgs: unknown[]) => Promise<unknown>) | undefined,
    name,
  );
  return method.apply(target, args);
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

function buildRealtimeTranscriptionSessionBody(command: VoiceRealtimeTranscriptionSessionCreateCommand) {
  return {
    input_audio_format: command.inputAudioFormat,
    input_audio_transcription: command.inputAudioTranscription,
    metadata: command.metadata,
    model: command.model,
    turn_detection: command.turnDetection,
  };
}

function buildRealtimeTranslationSessionBody(command: VoiceRealtimeTranslationSessionCreateCommand) {
  return {
    metadata: command.metadata,
    model: command.model,
    source_language: command.sourceLanguage,
    target_language: command.targetLanguage,
  };
}

function buildRealtimeSessionBody(command: VoiceRealtimeSessionCreateCommand) {
  return buildProviderGenerationBody(command, {
    instructions: command.instructions,
    metadata: command.metadata,
    modalities: command.modalities,
    model: command.model,
    voice: command.voice,
  });
}

function buildRealtimeCallBody(command: VoiceRealtimeCallCreateCommand) {
  return buildProviderGenerationBody(command, {
    metadata: command.metadata,
    sdp: command.sdp,
    session: command.session,
  });
}

function buildRealtimeCallActionBody(command: VoiceRealtimeCallActionCommand) {
  return buildProviderGenerationBody(command, {
    metadata: command.metadata,
  });
}

function buildRealtimeCallReferBody(command: VoiceRealtimeCallReferCommand) {
  return buildProviderGenerationBody(command, {
    metadata: command.metadata,
    target: command.target,
  });
}

function buildVoiceListParams(command: VoiceListCommand) {
  return {
    after: command.after,
    before: command.before,
    limit: command.limit,
    order: command.order,
  };
}

function buildVoiceCreateBody(command: VoiceCreateCommand) {
  return {
    description: command.description,
    metadata: command.metadata,
    name: command.name,
  };
}

function buildVoiceConsentListParams(command: VoiceConsentListCommand) {
  return {
    after: command.after,
    before: command.before,
    limit: command.limit,
    order: command.order,
  };
}

function buildVoiceConsentCreateBody(command: VoiceConsentCreateCommand) {
  return {
    consent_document: command.consentDocument,
    metadata: command.metadata,
    name: command.name,
  };
}

function buildVoiceConsentUpdateBody(command: VoiceConsentUpdateCommand) {
  return {
    metadata: command.metadata,
    name: command.name,
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

function buildProviderGenerationBody(
  command: { provider?: VoiceProviderOptions },
  fields: Record<string, unknown> = {},
) {
  return withDefinedValues({
    ...(command.provider?.providerOptions || {}),
    ...withDefinedValues(fields),
  });
}

function buildPromptedMediaGenerationBody(command: VoiceMusicCreateCommand, fields: Record<string, unknown> = {}) {
  return buildProviderGenerationBody(command, {
    callback_url: command.callbackUrl,
    duration: command.durationSeconds,
    model: command.model,
    prompt: command.prompt,
    ...fields,
  });
}

function buildKlingVideoGenerationBody(command: VoiceMusicCreateCommand) {
  return buildPromptedMediaGenerationBody(command, {
    negative_prompt: command.negativeTags,
  });
}

function buildImageGenerationBody(command: VoiceMusicCreateCommand) {
  return buildPromptedMediaGenerationBody(command);
}

function buildViduGenerationBody(command: VoiceMusicCreateCommand) {
  return buildPromptedMediaGenerationBody(command);
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

function mimeTypeForTextResponseFormat(responseFormat: VoiceTextResponseFormat) {
  switch (responseFormat) {
    case "json":
    case "verbose_json":
      return "application/json";
    case "srt":
      return "application/x-subrip";
    case "vtt":
      return "text/vtt";
    case "text":
    case undefined:
      return "text/plain";
  }
}

function fileExtensionForTextResponseFormat(responseFormat: VoiceTextResponseFormat) {
  switch (responseFormat) {
    case "json":
    case "verbose_json":
      return "json";
    case "srt":
      return "srt";
    case "vtt":
      return "vtt";
    case "text":
    case undefined:
      return "txt";
  }
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

  const textCandidate = textCandidateFromProviderResponse(providerResponse, defaults);
  if (textCandidate) {
    return [textCandidate];
  }

  if (!providerResponse || typeof providerResponse !== "object") {
    return [];
  }

  const object = providerResponse as Record<string, unknown>;
  const candidates: VoiceProviderArtifactCandidate[] = [];

  collectSunoTrackCandidates(object, candidates);
  collectViduCreationCandidates(object, candidates);
  collectProviderGeneratedMediaArray(object.videos, "video", candidates);
  collectProviderGeneratedMediaArray(object.images, "image", candidates);
  collectProviderGeneratedMediaArray(object.audios, defaults.kind || "audio", candidates);
  if (isRecord(object.result)) {
    collectViduCreationCandidates(object.result, candidates);
    collectProviderGeneratedMediaArray(object.result.videos, "video", candidates);
    collectProviderGeneratedMediaArray(object.result.images, "image", candidates);
    collectProviderGeneratedMediaArray(object.result.audios, defaults.kind || "audio", candidates);
    collectTextCandidateFromRecord(object.result, defaults, candidates);
  }
  collectTextCandidateFromRecord(object, defaults, candidates);
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

function collectViduCreationCandidates(object: Record<string, unknown>, candidates: VoiceProviderArtifactCandidate[]) {
  if (!Array.isArray(object.creations)) {
    return;
  }

  for (const entry of object.creations) {
    if (!isRecord(entry)) {
      continue;
    }
    const providerAssetId = firstString(entry.id);
    const base = providerAssetId || "vidu-creation";
    const durationSeconds = optionalNumber(entry.duration);
    const metadata = viduCreationMetadata(entry);
    const seenSourceUris = new Set<string>();
    appendUniqueViduCreationCandidate(candidates, seenSourceUris, {
      durationSeconds,
      fileNameBase: `${base}-video`,
      kind: "video",
      metadata,
      providerAssetId,
      sourceUri: firstString(entry.video_url),
    });
    appendUniqueViduCreationCandidate(candidates, seenSourceUris, {
      fileNameBase: `${base}-image`,
      kind: "image",
      metadata,
      providerAssetId,
      sourceUri: firstString(entry.image_url),
    });
    appendUniqueViduCreationCandidate(candidates, seenSourceUris, {
      fileNameBase: `${base}-cover`,
      kind: "image",
      metadata,
      providerAssetId,
      sourceUri: firstString(entry.cover_url),
    });
    appendUniqueViduCreationCandidate(candidates, seenSourceUris, {
      durationSeconds,
      fileNameBase: `${base}-audio`,
      kind: "audio",
      metadata,
      providerAssetId,
      sourceUri: firstString(entry.audio_url),
    });

    const fallbackSourceUri = firstString(entry.url, entry.uri);
    appendUniqueViduCreationCandidate(candidates, seenSourceUris, {
      durationSeconds,
      fileNameBase: base,
      kind: fallbackSourceUri ? kindFromUri(fallbackSourceUri) : "video",
      metadata,
      providerAssetId,
      sourceUri: fallbackSourceUri,
    });
  }
}

function appendUniqueViduCreationCandidate(
  candidates: VoiceProviderArtifactCandidate[],
  seenSourceUris: Set<string>,
  input: {
    durationSeconds?: number;
    fileNameBase: string;
    kind: SdkworkVoiceArtifactKind;
    metadata?: Record<string, unknown>;
    providerAssetId?: string;
    sourceUri?: string;
  },
) {
  if (!input.sourceUri || seenSourceUris.has(input.sourceUri)) {
    return;
  }
  seenSourceUris.add(input.sourceUri);
  candidates.push(candidateFromUri({
    durationSeconds: input.durationSeconds,
    fileNameBase: input.fileNameBase,
    kind: input.kind,
    metadata: input.metadata,
    providerAssetId: input.providerAssetId,
    sourceUri: input.sourceUri,
  }));
}

function viduCreationMetadata(entry: Record<string, unknown>) {
  const metadata: Record<string, unknown> = {};
  const type = firstString(entry.type);
  if (type) {
    metadata.type = type;
  }
  const width = optionalNumber(entry.width);
  if (width !== undefined) {
    metadata.width = width;
  }
  const height = optionalNumber(entry.height);
  if (height !== undefined) {
    metadata.height = height;
  }
  if (isRecord(entry.metadata)) {
    metadata.providerMetadata = entry.metadata;
  }
  return Object.keys(metadata).length > 0 ? metadata : undefined;
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

function collectTextCandidateFromRecord(
  object: Record<string, unknown>,
  defaults: VoiceGeneratedArtifactDefaults,
  candidates: VoiceProviderArtifactCandidate[],
) {
  const textCandidate = textCandidateFromProviderResponse(object, defaults);
  if (textCandidate) {
    candidates.push(textCandidate);
  }
}

function textCandidateFromProviderResponse(
  providerResponse: unknown,
  defaults: VoiceGeneratedArtifactDefaults,
): VoiceProviderArtifactCandidate | undefined {
  const kind = textArtifactKind(defaults.kind);
  if (!kind) {
    return undefined;
  }

  if (typeof providerResponse === "string") {
    return textCandidateFromContent(providerResponse, defaults, kind);
  }

  if (!isRecord(providerResponse) || typeof providerResponse.text !== "string") {
    return undefined;
  }

  const mimeType = textArtifactMimeType(defaults);
  const content = isJsonMimeType(mimeType) ? JSON.stringify(providerResponse) : providerResponse.text;
  return textCandidateFromContent(content, defaults, kind, {
    durationSeconds: optionalNumber(providerResponse.duration, providerResponse.duration_seconds),
    metadata: textArtifactMetadata(providerResponse),
    mimeType,
  });
}

function textCandidateFromContent(
  content: string,
  defaults: VoiceGeneratedArtifactDefaults,
  kind: "transcript" | "translation",
  overrides: {
    durationSeconds?: number;
    metadata?: Record<string, unknown>;
    mimeType?: string;
  } = {},
): VoiceProviderArtifactCandidate {
  const mimeType = overrides.mimeType || textArtifactMimeType(defaults);
  return {
    contentLength: utf8ByteLength(content),
    durationSeconds: overrides.durationSeconds,
    fileNameBase: defaults.operation || kind,
    kind,
    mediaKind: defaults.mediaKind || mediaKindForArtifactKind(kind),
    metadata: overrides.metadata,
    mimeType,
    source: "data_url",
    sourceUri: textDataUrl(content, mimeType),
    title: defaults.title,
  };
}

function textArtifactKind(kind: SdkworkVoiceArtifactKind | undefined): "transcript" | "translation" | undefined {
  return kind === "transcript" || kind === "translation" ? kind : undefined;
}

function textArtifactMimeType(defaults: VoiceGeneratedArtifactDefaults) {
  if (defaults.contentType?.includes("/")) {
    return defaults.contentType.toLowerCase();
  }
  if (defaults.fileExtension) {
    const mimeType = mimeTypeForExtension(defaults.fileExtension);
    if (mimeType) {
      return mimeType;
    }
  }
  return "text/plain";
}

function textArtifactMetadata(object: Record<string, unknown>) {
  const metadata: Record<string, unknown> = {};
  const language = firstString(object.language);
  if (language) {
    metadata.language = language;
  }
  if (Array.isArray(object.segments)) {
    metadata.segments = object.segments;
  }
  if (Array.isArray(object.words)) {
    metadata.words = object.words;
  }
  if (isRecord(object.metadata)) {
    metadata.providerMetadata = object.metadata;
  }
  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

function textDataUrl(content: string, mimeType: string) {
  return `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
}

function isJsonMimeType(mimeType: string) {
  return mimeType.toLowerCase().split(";", 1)[0] === "application/json";
}

function utf8ByteLength(value: string) {
  return new TextEncoder().encode(value).length;
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
    case "application/json":
      return "json";
    case "application/x-subrip":
      return "srt";
    case "text/plain":
      return "txt";
    case "text/vtt":
      return "vtt";
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
    case "json":
      return "application/json";
    case "srt":
      return "application/x-subrip";
    case "txt":
      return "text/plain";
    case "vtt":
      return "text/vtt";
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

function taskRetrieveForProvider(client: CloudRouterVoiceProviderClient, providerCode: string) {
  switch (providerCode) {
    case "volcengine":
      return {
        name: "videosVolcengine.api.v3.contents.generations.tasks.retrieve",
        resource: client.videosVolcengine?.api?.v3?.contents?.generations?.tasks,
      };
    case "kling":
      return {
        name: "videosKling.v1.videos.generations.retrieve",
        resource: client.videosKling?.v1?.videos?.generations,
      };
    case "nano-banana":
      return {
        name: "imagesNanoBanana.v1.images.generations.retrieve",
        resource: client.imagesNanoBanana?.v1?.images?.generations,
      };
    case "midjourney":
      return {
        name: "imagesMidjourney.v1.images.generations.retrieve",
        resource: client.imagesMidjourney?.v1?.images?.generations,
      };
    case "vidu":
    case "vidu-image":
    case "vidu-video":
      return {
        methodName: "list",
        name: "videosVidu.ent.v2.tasks.creations.list",
        resource: client.videosVidu?.ent?.v2?.tasks?.creations,
      };
    case "suno":
    default:
      return {
        name: "audioSuno.v1.music.generations.retrieve",
        resource: client.audioSuno?.v1?.music?.generations,
      };
  }
}

function taskArtifactDefaultsForProvider(providerCode: string): VoiceGeneratedArtifactDefaults {
  switch (providerCode) {
    case "kling":
    case "vidu":
    case "vidu-video":
    case "volcengine":
      return {
        kind: "video",
        mediaKind: "video",
        operation: "task",
      };
    case "midjourney":
    case "nano-banana":
    case "vidu-image":
      return {
        kind: "image",
        mediaKind: "image",
        operation: "task",
      };
    case "suno":
    default:
      return {
        kind: "music",
        mediaKind: "audio",
        operation: "task",
      };
  }
}

function normalizedProviderRouteId(command: VoiceMusicCreateCommand) {
  return command.provider?.providerRouteId?.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isProviderRoute(command: VoiceMusicCreateCommand, routeId: string) {
  const normalized = normalizedProviderRouteId(command);
  return normalized ? normalized.endsWith(routeId.toLowerCase()) : false;
}

async function startViduGenerationTask(
  client: CloudRouterVoiceProviderClient,
  command: VoiceMusicCreateCommand,
  providerCode: string,
) {
  const body = buildViduGenerationBody(command);
  if (providerCode === "vidu-image" || isProviderRoute(command, "reference2image")) {
    return callClientMethod(
      client.imagesVidu?.ent?.v2?.reference2image,
      "create",
      "imagesVidu.ent.v2.reference2image.create",
      body,
    );
  }
  if (isProviderRoute(command, "img2video") || isProviderRoute(command, "image2video")) {
    return callClientMethod(
      client.videosVidu?.ent?.v2?.img2video,
      "create",
      "videosVidu.ent.v2.img2video.create",
      body,
    );
  }
  if (isProviderRoute(command, "reference2video")) {
    return callClientMethod(
      client.videosVidu?.ent?.v2?.reference2video,
      "create",
      "videosVidu.ent.v2.reference2video.create",
      body,
    );
  }
  if (isProviderRoute(command, "startend2video")) {
    return callClientMethod(
      client.videosVidu?.ent?.v2?.startEnd2video,
      "create",
      "videosVidu.ent.v2.startEnd2video.create",
      body,
    );
  }

  return callClientMethod(
    client.videosVidu?.ent?.v2?.text2video,
    "create",
    "videosVidu.ent.v2.text2video.create",
    body,
  );
}

export function createCloudRouterVoiceProviderAdapter(
  options: CloudRouterVoiceProviderAdapterOptions,
): VoiceProviderAdapter {
  const defaultProviderCode = options.defaultProviderCode || "openai";

  return {
    async startSpeech(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const response = await callClientMethod(
        options.client.audio?.speech,
        "create",
        "audio.speech.create",
        withDefinedValues(buildSpeechBody(command)),
      );
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
      const response = await callClientMethod(
        options.client.audio?.transcriptions,
        "create",
        "audio.transcriptions.create",
        withDefinedValues(buildTranscriptionBody(command)),
      );
      return completed(providerCode, response, {
        contentType: mimeTypeForTextResponseFormat(command.responseFormat),
        fileExtension: fileExtensionForTextResponseFormat(command.responseFormat),
        kind: "transcript",
        mediaKind: "voice",
        operation: "transcription",
      });
    },

    async startTranslation(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const response = await callClientMethod(
        options.client.audio?.translations,
        "create",
        "audio.translations.create",
        withDefinedValues(buildTranslationBody(command)),
      );
      return completed(providerCode, response, {
        contentType: mimeTypeForTextResponseFormat(command.responseFormat),
        fileExtension: fileExtensionForTextResponseFormat(command.responseFormat),
        kind: "translation",
        mediaKind: "voice",
        operation: "translation",
      });
    },

    async startRealtimeTranscriptionSession(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const response = await callClientMethod(
        options.client.realtime?.transcriptionSessions,
        "create",
        "realtime.transcriptionSessions.create",
        withDefinedValues(buildRealtimeTranscriptionSessionBody(command)),
      );
      return completed(providerCode, response);
    },

    async startRealtimeTranslationSession(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const response = await callClientMethod(
        options.client.realtime?.translations,
        "create",
        "realtime.translations.create",
        withDefinedValues(buildRealtimeTranslationSessionBody(command)),
      );
      return completed(providerCode, response);
    },

    async startRealtimeSession(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const response = await callClientMethod(
        options.client.realtime?.sessions,
        "create",
        "realtime.sessions.create",
        buildRealtimeSessionBody(command),
      );
      return completed(providerCode, response);
    },

    async createRealtimeClientSecret(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const response = await callClientMethod(
        options.client.realtime?.clientSecrets,
        "create",
        "realtime.clientSecrets.create",
        buildRealtimeSessionBody(command),
      );
      return completed(providerCode, response);
    },

    async startRealtimeCall(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const response = await callClientMethod(
        options.client.realtime?.calls,
        "create",
        "realtime.calls.create",
        buildRealtimeCallBody(command),
      );
      return completed(providerCode, response);
    },

    async acceptRealtimeCall(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const response = await callClientMethod(
        options.client.realtime?.calls?.accept,
        "create",
        "realtime.calls.accept.create",
        command.callId,
        buildRealtimeCallActionBody(command),
      );
      return completed(providerCode, response);
    },

    async hangupRealtimeCall(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const response = await callClientMethod(
        options.client.realtime?.calls?.hangup,
        "create",
        "realtime.calls.hangup.create",
        command.callId,
        buildRealtimeCallActionBody(command),
      );
      return completed(providerCode, response);
    },

    async referRealtimeCall(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const response = await callClientMethod(
        options.client.realtime?.calls?.refer,
        "create",
        "realtime.calls.refer.create",
        command.callId,
        buildRealtimeCallReferBody(command),
      );
      return completed(providerCode, response);
    },

    async rejectRealtimeCall(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const response = await callClientMethod(
        options.client.realtime?.calls?.reject,
        "create",
        "realtime.calls.reject.create",
        command.callId,
        buildRealtimeCallActionBody(command),
      );
      return completed(providerCode, response);
    },

    async listVoices(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const response = await callClientMethod(
        options.client.audio?.voices,
        "list",
        "audio.voices.list",
        withDefinedValues(buildVoiceListParams(command)),
      );
      return completed(providerCode, response);
    },

    async createVoice(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const response = await callClientMethod(
        options.client.audio?.voices,
        "create",
        "audio.voices.create",
        withDefinedValues(buildVoiceCreateBody(command)),
      );
      return completed(providerCode, response);
    },

    async retrieveVoice(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const response = await callClientMethod(
        options.client.audio?.voices,
        "retrieve",
        "audio.voices.retrieve",
        command.voiceId,
      );
      return completed(providerCode, response);
    },

    async listVoiceConsents(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const response = await callClientMethod(
        options.client.audio?.voiceConsents,
        "list",
        "audio.voiceConsents.list",
        withDefinedValues(buildVoiceConsentListParams(command)),
      );
      return completed(providerCode, response);
    },

    async createVoiceConsent(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const response = await callClientMethod(
        options.client.audio?.voiceConsents,
        "create",
        "audio.voiceConsents.create",
        withDefinedValues(buildVoiceConsentCreateBody(command)),
      );
      return completed(providerCode, response);
    },

    async retrieveVoiceConsent(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const response = await callClientMethod(
        options.client.audio?.voiceConsents,
        "retrieve",
        "audio.voiceConsents.retrieve",
        command.consentId,
      );
      return completed(providerCode, response);
    },

    async updateVoiceConsent(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const response = await callClientMethod(
        options.client.audio?.voiceConsents,
        "update",
        "audio.voiceConsents.update",
        command.consentId,
        withDefinedValues(buildVoiceConsentUpdateBody(command)),
      );
      return completed(providerCode, response);
    },

    async deleteVoiceConsent(command) {
      const providerCode = providerCodeFrom(command, defaultProviderCode);
      const response = await callClientMethod(
        options.client.audio?.voiceConsents,
        "delete",
        "audio.voiceConsents.delete",
        command.consentId,
      );
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
        const response = await callClientMethod(
          options.client.videosVolcengine?.api?.v3?.contents?.generations?.tasks,
          "create",
          "videosVolcengine.api.v3.contents.generations.tasks.create",
          withDefinedValues(buildVolcengineContentTaskBody(command)),
        );
        return taskStarted(providerCode, response);
      }
      if (providerCode === "kling") {
        const response = await callClientMethod(
          options.client.videosKling?.v1?.videos?.generations,
          "create",
          "videosKling.v1.videos.generations.create",
          buildKlingVideoGenerationBody(command),
        );
        return taskStarted(providerCode, response);
      }
      if (providerCode === "nano-banana") {
        const response = await callClientMethod(
          options.client.imagesNanoBanana?.v1?.images?.generations,
          "create",
          "imagesNanoBanana.v1.images.generations.create",
          buildImageGenerationBody(command),
        );
        return taskStarted(providerCode, response);
      }
      if (providerCode === "midjourney") {
        const response = await callClientMethod(
          options.client.imagesMidjourney?.v1?.images?.generations,
          "create",
          "imagesMidjourney.v1.images.generations.create",
          buildImageGenerationBody(command),
        );
        return taskStarted(providerCode, response);
      }
      if (providerCode === "vidu" || providerCode === "vidu-image" || providerCode === "vidu-video") {
        const response = await startViduGenerationTask(options.client, command, providerCode);
        return taskStarted(providerCode, response);
      }

      const response = await callClientMethod(
        options.client.audioSuno?.v1?.music?.generations,
        "create",
        "audioSuno.v1.music.generations.create",
        withDefinedValues(buildSunoMusicBody(command)),
      );
      return taskStarted(providerCode, response);
    },

    async queryTask(command) {
      const providerCode = command.providerCode || defaultProviderCode;
      const retrieve = taskRetrieveForProvider(options.client, providerCode);
      const response = await callClientMethod(
        retrieve.resource,
        retrieve.methodName || "retrieve",
        retrieve.name,
        command.providerTaskId,
      );
      return {
        generatedArtifacts: normalizeVoiceProviderGeneratedArtifacts(
          response,
          providerCode,
          taskArtifactDefaultsForProvider(providerCode),
        ),
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
