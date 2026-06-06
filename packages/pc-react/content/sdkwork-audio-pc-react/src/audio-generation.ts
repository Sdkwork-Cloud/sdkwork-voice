import type { SdkworkVoiceMediaResource } from "@sdkwork/voice-contracts";

export type SdkworkAudioGenerationModality = "audio" | "music" | "sfx";
export type SdkworkAudioGenerationQuality = "high" | "standard";

export interface SdkworkAudioGenerationSpeechModeConfig {
  responseFormat?: "aac" | "flac" | "mp3" | "opus" | "pcm" | "wav";
  speed?: number;
  voice?: string;
}

export interface SdkworkAudioGenerationSfxModeConfig {
  loop: boolean;
  promptInfluence: number;
  responseFormat?: "mp3" | "wav";
}

export interface SdkworkAudioGenerationAssetConfig {
  durationSeconds: number;
  quality: SdkworkAudioGenerationQuality;
  sfxMode?: SdkworkAudioGenerationSfxModeConfig;
  speechMode?: SdkworkAudioGenerationSpeechModeConfig;
}

export interface SdkworkAudioGenerationSerializedAssetConfig {
  durationSeconds?: number;
  loop?: boolean;
  promptInfluence?: number;
  quality?: SdkworkAudioGenerationQuality;
  responseFormat?: SdkworkAudioGenerationSpeechModeConfig["responseFormat"] | SdkworkAudioGenerationSfxModeConfig["responseFormat"];
  sfxMode?: Partial<SdkworkAudioGenerationSfxModeConfig>;
  speechMode?: Partial<SdkworkAudioGenerationSpeechModeConfig>;
  speed?: number;
  voice?: string;
}

export type SdkworkAudioGenerationModelBucket = "audios" | "music" | "sfx";

export type SdkworkAudioGenerationModelBuckets<TModel> = {
  [Bucket in SdkworkAudioGenerationModelBucket]: readonly TModel[];
};

export interface SdkworkAudioGenerationReferencePrice {
  billingMeter: string;
  currency: string;
  unitPrice: string;
}

export interface SdkworkAudioGenerationPriceAvailability {
  status: "reference" | "unavailable";
  reason?: string | null;
}

export interface SdkworkAudioGenerationPricedModel {
  officialReferenceCurrency?: string | null;
  officialReferencePrices: readonly SdkworkAudioGenerationReferencePrice[];
  officialReferenceUnitPrice?: string | null;
  priceAvailability: SdkworkAudioGenerationPriceAvailability;
}

export interface SdkworkAudioGenerationCreditEstimate {
  points: number | null;
  detail: string;
  reference: boolean;
}

export interface EstimateSdkworkAudioGenerationCreditsInput<TModel extends SdkworkAudioGenerationPricedModel> {
  config: SdkworkAudioGenerationAssetConfig;
  modality: SdkworkAudioGenerationModality;
  model: TModel | null | undefined;
  pointsPerUsd?: number;
  unavailableDetail?: string;
}

export type SdkworkAudioGenerationHistoryType = SdkworkAudioGenerationModality;
export type SdkworkAudioGenerationPreviewKind = "audio";
export type SdkworkAudioGenerationMediaResource = SdkworkVoiceMediaResource;
export type SdkworkAudioGenerationMedia = SdkworkVoiceMediaResource;

export interface SdkworkAudioGenerationArtifact {
  asset: SdkworkAudioGenerationMediaResource;
  modality: SdkworkAudioGenerationModality;
}

export interface SdkworkAudioGenerationHistoryItem {
  createdAt?: string;
  date: string;
  durationSeconds?: number;
  generationConfig?: SdkworkAudioGenerationSerializedAssetConfig;
  id: string;
  asset?: SdkworkAudioGenerationMediaResource;
  modelCatalogKey?: string;
  modelInfo?: string;
  outputText?: string;
  prompt: string;
  status?: string;
  type: SdkworkAudioGenerationHistoryType;
  updatedAt?: string;
}

export interface CreateSdkworkAudioGenerationPendingHistoryItemInput {
  createdAt?: string;
  generationConfig?: SdkworkAudioGenerationSerializedAssetConfig;
  id: string;
  prompt: string;
  selectedModel?: string;
  status?: string;
  targetType: SdkworkAudioGenerationModality;
}

export interface MapSdkworkAudioGenerationArtifactsToHistoryMediaResult {
  asset?: SdkworkAudioGenerationMediaResource;
  durationSeconds?: number;
}

export interface AppendSdkworkAudioGenerationArtifactOptions {
  updatedAt?: string;
}

const DEFAULT_SDKWORK_AUDIO_GENERATION_POINTS_PER_USD = 10;
const DEFAULT_SDKWORK_AUDIO_GENERATION_COST_UNAVAILABLE_DETAIL = "sdkwork.audio.generation.cost.unavailable";

export const DEFAULT_SDKWORK_AUDIO_GENERATION_SPEECH_MODE_CONFIG: SdkworkAudioGenerationSpeechModeConfig = {
  responseFormat: "mp3",
  speed: 1,
};

export const DEFAULT_SDKWORK_AUDIO_GENERATION_SFX_MODE_CONFIG: SdkworkAudioGenerationSfxModeConfig = {
  loop: false,
  promptInfluence: 0.3,
  responseFormat: "mp3",
};

export function getDefaultSdkworkAudioGenerationDurationSeconds(
  modality: SdkworkAudioGenerationModality,
): number {
  switch (modality) {
    case "music":
      return 30;
    case "audio":
      return 10;
    case "sfx":
      return 5;
  }
}

export function createDefaultSdkworkAudioGenerationAssetConfig(
  modality: SdkworkAudioGenerationModality,
): SdkworkAudioGenerationAssetConfig {
  return reconcileSdkworkAudioGenerationAssetConfig({
    durationSeconds: getDefaultSdkworkAudioGenerationDurationSeconds(modality),
    quality: "standard",
    sfxMode: modality === "sfx" ? { ...DEFAULT_SDKWORK_AUDIO_GENERATION_SFX_MODE_CONFIG } : undefined,
    speechMode: modality === "audio" ? { ...DEFAULT_SDKWORK_AUDIO_GENERATION_SPEECH_MODE_CONFIG } : undefined,
  }, modality);
}

export function reconcileSdkworkAudioGenerationAssetConfig(
  config: SdkworkAudioGenerationAssetConfig,
  modality: SdkworkAudioGenerationModality,
): SdkworkAudioGenerationAssetConfig {
  const defaultConfig = {
    durationSeconds: getDefaultSdkworkAudioGenerationDurationSeconds(modality),
    quality: "standard" as const,
  };
  const next = {
    ...defaultConfig,
    ...config,
    durationSeconds: config.durationSeconds || defaultConfig.durationSeconds,
  };

  if (modality === "audio") {
    return {
      durationSeconds: next.durationSeconds,
      quality: next.quality,
      sfxMode: undefined,
      speechMode: normalizeSpeechModeConfig(next.speechMode ?? DEFAULT_SDKWORK_AUDIO_GENERATION_SPEECH_MODE_CONFIG),
    };
  }

  if (modality === "sfx") {
    return {
      durationSeconds: next.durationSeconds,
      quality: next.quality,
      sfxMode: normalizeSfxModeConfig(next.sfxMode ?? DEFAULT_SDKWORK_AUDIO_GENERATION_SFX_MODE_CONFIG),
      speechMode: undefined,
    };
  }

  return {
    durationSeconds: next.durationSeconds,
    quality: next.quality,
    sfxMode: undefined,
    speechMode: undefined,
  };
}

export function serializeSdkworkAudioGenerationAssetConfig(
  config: SdkworkAudioGenerationAssetConfig,
  modality: SdkworkAudioGenerationModality,
): SdkworkAudioGenerationSerializedAssetConfig {
  const reconciled = reconcileSdkworkAudioGenerationAssetConfig(config, modality);
  const result: SdkworkAudioGenerationSerializedAssetConfig = {
    durationSeconds: reconciled.durationSeconds,
    quality: reconciled.quality,
  };

  if (modality === "audio" && reconciled.speechMode) {
    result.speechMode = reconciled.speechMode;
    if (reconciled.speechMode.voice) {
      result.voice = reconciled.speechMode.voice;
    }
    if (reconciled.speechMode.responseFormat) {
      result.responseFormat = reconciled.speechMode.responseFormat;
    }
    if (reconciled.speechMode.speed !== undefined) {
      result.speed = reconciled.speechMode.speed;
    }
  }

  if (modality === "sfx" && reconciled.sfxMode) {
    result.sfxMode = reconciled.sfxMode;
    result.loop = reconciled.sfxMode.loop;
    result.promptInfluence = reconciled.sfxMode.promptInfluence;
    if (reconciled.sfxMode.responseFormat) {
      result.responseFormat = reconciled.sfxMode.responseFormat;
    }
  }

  return result;
}

export function createSdkworkAudioGenerationAssetConfigFromSerialized(
  serialized: SdkworkAudioGenerationSerializedAssetConfig | undefined,
  modality: SdkworkAudioGenerationModality,
): SdkworkAudioGenerationAssetConfig {
  const defaultConfig = createDefaultSdkworkAudioGenerationAssetConfig(modality);
  if (!serialized) {
    return defaultConfig;
  }

  if (modality === "audio") {
    const speechMode = normalizeSpeechModeConfig({
      ...DEFAULT_SDKWORK_AUDIO_GENERATION_SPEECH_MODE_CONFIG,
      ...serialized.speechMode,
      responseFormat: serialized.responseFormat ?? serialized.speechMode?.responseFormat ?? DEFAULT_SDKWORK_AUDIO_GENERATION_SPEECH_MODE_CONFIG.responseFormat,
      speed: serialized.speed ?? serialized.speechMode?.speed ?? DEFAULT_SDKWORK_AUDIO_GENERATION_SPEECH_MODE_CONFIG.speed,
      voice: serialized.voice ?? serialized.speechMode?.voice,
    });
    return reconcileSdkworkAudioGenerationAssetConfig({
      durationSeconds: serialized.durationSeconds ?? defaultConfig.durationSeconds,
      quality: serialized.quality ?? defaultConfig.quality,
      sfxMode: undefined,
      speechMode,
    }, modality);
  }

  if (modality === "sfx") {
    const sfxMode = normalizeSfxModeConfig({
      ...DEFAULT_SDKWORK_AUDIO_GENERATION_SFX_MODE_CONFIG,
      ...serialized.sfxMode,
      loop: serialized.loop ?? serialized.sfxMode?.loop ?? DEFAULT_SDKWORK_AUDIO_GENERATION_SFX_MODE_CONFIG.loop,
      promptInfluence: serialized.promptInfluence ?? serialized.sfxMode?.promptInfluence ?? DEFAULT_SDKWORK_AUDIO_GENERATION_SFX_MODE_CONFIG.promptInfluence,
      responseFormat: normalizeSfxResponseFormat(serialized.responseFormat)
        ?? normalizeSfxResponseFormat(serialized.sfxMode?.responseFormat)
        ?? DEFAULT_SDKWORK_AUDIO_GENERATION_SFX_MODE_CONFIG.responseFormat,
    });
    return reconcileSdkworkAudioGenerationAssetConfig({
      durationSeconds: serialized.durationSeconds ?? defaultConfig.durationSeconds,
      quality: serialized.quality ?? defaultConfig.quality,
      sfxMode,
      speechMode: undefined,
    }, modality);
  }

  return reconcileSdkworkAudioGenerationAssetConfig({
    durationSeconds: serialized.durationSeconds ?? defaultConfig.durationSeconds,
    quality: serialized.quality ?? defaultConfig.quality,
    sfxMode: undefined,
    speechMode: undefined,
  }, modality);
}

export function updateSdkworkAudioGenerationSpeechModeConfig(
  config: SdkworkAudioGenerationAssetConfig,
  speechMode: SdkworkAudioGenerationSpeechModeConfig,
): SdkworkAudioGenerationAssetConfig {
  return reconcileSdkworkAudioGenerationAssetConfig({
    ...config,
    speechMode: normalizeSpeechModeConfig(speechMode),
  }, "audio");
}

export function updateSdkworkAudioGenerationSfxModeConfig(
  config: SdkworkAudioGenerationAssetConfig,
  sfxMode: SdkworkAudioGenerationSfxModeConfig,
): SdkworkAudioGenerationAssetConfig {
  return reconcileSdkworkAudioGenerationAssetConfig({
    ...config,
    sfxMode: normalizeSfxModeConfig(sfxMode),
  }, "sfx");
}

export function getSdkworkAudioGenerationModelBucket(
  modality: SdkworkAudioGenerationModality,
): SdkworkAudioGenerationModelBucket {
  switch (modality) {
    case "audio":
      return "audios";
    case "music":
      return "music";
    case "sfx":
      return "sfx";
  }
}

export function findSdkworkAudioGenerationModelById<TModel extends { id: string }>(
  groups: readonly SdkworkAudioGenerationModelBuckets<TModel>[],
  modelId: string,
): TModel | null {
  for (const group of groups) {
    for (const bucket of ["audios", "music", "sfx"] as const) {
      const model = group[bucket].find((item) => item.id === modelId);
      if (model) {
        return model;
      }
    }
  }
  return null;
}

export function findFirstSdkworkAudioGenerationModelForModality<TModel>(
  groups: readonly SdkworkAudioGenerationModelBuckets<TModel>[],
  modality: SdkworkAudioGenerationModality,
): TModel | null {
  const bucket = getSdkworkAudioGenerationModelBucket(modality);
  for (const group of groups) {
    const model = group[bucket][0];
    if (model) {
      return model;
    }
  }
  return null;
}

export function getSdkworkAudioGenerationDurationOptions(
  modality: SdkworkAudioGenerationModality,
): number[] {
  switch (modality) {
    case "music":
      return [30, 60, 120];
    case "audio":
      return [10, 30, 60];
    case "sfx":
      return [3, 5, 10];
  }
}

export function estimateSdkworkAudioGenerationCredits<TModel extends SdkworkAudioGenerationPricedModel>({
  config,
  modality,
  model,
  pointsPerUsd = DEFAULT_SDKWORK_AUDIO_GENERATION_POINTS_PER_USD,
  unavailableDetail = DEFAULT_SDKWORK_AUDIO_GENERATION_COST_UNAVAILABLE_DETAIL,
}: EstimateSdkworkAudioGenerationCreditsInput<TModel>): SdkworkAudioGenerationCreditEstimate {
  if (!model || model.priceAvailability.status === "unavailable") {
    return createUnavailableSdkworkAudioGenerationCreditEstimate(unavailableDetail);
  }

  const price = selectSdkworkAudioGenerationReferencePrice(model.officialReferencePrices, modality)
    ?? createFallbackSdkworkAudioGenerationReferencePrice(model);
  if (!price) {
    return createUnavailableSdkworkAudioGenerationCreditEstimate(unavailableDetail);
  }

  const unitPrice = readPositiveSdkworkAudioGenerationNumber(price.unitPrice);
  if (unitPrice === null) {
    return createUnavailableSdkworkAudioGenerationCreditEstimate(unavailableDetail);
  }

  const quantity = estimateSdkworkAudioGenerationMeterQuantity(price.billingMeter, modality, config);
  const points = Math.ceil(unitPrice * quantity * pointsPerUsd);
  return {
    points,
    detail: describeSdkworkAudioGenerationCreditEstimate(price, quantity),
    reference: model.priceAvailability.status === "reference",
  };
}

export function normalizeSdkworkAudioGenerationHistoryType(
  value: unknown,
): SdkworkAudioGenerationHistoryType {
  switch (value) {
    case "audio":
    case "music":
    case "sfx":
      return value;
    default:
      throw new Error("Audio generation history type is required");
  }
}

export function mapSdkworkAudioGenerationModalityToHistoryType(
  modality: SdkworkAudioGenerationModality,
): SdkworkAudioGenerationHistoryType {
  return modality;
}

export function mapSdkworkAudioGenerationHistoryTypeToModality(
  historyType: SdkworkAudioGenerationHistoryType,
): SdkworkAudioGenerationModality {
  return normalizeSdkworkAudioGenerationHistoryType(historyType);
}

export function getSdkworkAudioGenerationPreviewKind(
  historyType: SdkworkAudioGenerationHistoryType,
): SdkworkAudioGenerationPreviewKind {
  normalizeSdkworkAudioGenerationHistoryType(historyType);
  return "audio";
}

export function createSdkworkAudioGenerationPendingHistoryItem({
  createdAt = new Date().toISOString(),
  generationConfig,
  id,
  prompt,
  selectedModel,
  status = "processing",
  targetType,
}: CreateSdkworkAudioGenerationPendingHistoryItemInput): SdkworkAudioGenerationHistoryItem {
  return {
    createdAt,
    date: createdAt.slice(0, 10),
    durationSeconds: generationConfig?.durationSeconds,
    generationConfig,
    id,
    modelCatalogKey: selectedModel,
    modelInfo: selectedModel,
    outputText: "",
    prompt,
    status,
    type: mapSdkworkAudioGenerationModalityToHistoryType(targetType),
    updatedAt: createdAt,
  };
}

export function restoreSdkworkAudioGenerationSerializedConfigFromHistoryItem(
  item: SdkworkAudioGenerationHistoryItem,
): SdkworkAudioGenerationSerializedAssetConfig {
  const targetType = mapSdkworkAudioGenerationHistoryTypeToModality(item.type);
  const fallbackSummary: SdkworkAudioGenerationSerializedAssetConfig = {
    durationSeconds: item.durationSeconds,
  };

  return serializeSdkworkAudioGenerationAssetConfig(
    createSdkworkAudioGenerationAssetConfigFromSerialized(item.generationConfig ?? fallbackSummary, targetType),
    targetType,
  );
}

export function mapSdkworkAudioGenerationArtifactsToHistoryMedia(
  artifacts: readonly SdkworkAudioGenerationArtifact[],
  targetType: SdkworkAudioGenerationModality,
): MapSdkworkAudioGenerationArtifactsToHistoryMediaResult {
  const matching = artifacts.filter((artifact) => artifact.modality === targetType);
  const first = matching[0] ?? artifacts[0];
  const asset = first ? cloneSdkworkAudioGenerationMediaResource(first.asset) : undefined;

  return {
    asset,
    durationSeconds: first?.asset.durationSeconds,
  };
}

export function appendSdkworkAudioGenerationArtifactToHistoryItem<TItem extends SdkworkAudioGenerationHistoryItem>(
  item: TItem,
  artifact: SdkworkAudioGenerationArtifact,
  options: AppendSdkworkAudioGenerationArtifactOptions = {},
): TItem {
  const updatedAt = options.updatedAt ?? new Date().toISOString();
  const nextAsset = cloneSdkworkAudioGenerationMediaResource(artifact.asset);
  return {
    ...item,
    asset: nextAsset,
    durationSeconds: artifact.asset.durationSeconds ?? item.durationSeconds,
    status: "processing",
    type: mapSdkworkAudioGenerationModalityToHistoryType(artifact.modality),
    updatedAt,
  } as TItem;
}

export function readSdkworkAudioGenerationMediaUrl(
  media: SdkworkAudioGenerationMedia | undefined,
): string | undefined {
  return media?.url
    || media?.uri
    || (media as { publicUrl?: string } | undefined)?.publicUrl
    || media?.id;
}

function normalizeSpeechModeConfig(
  speechMode: SdkworkAudioGenerationSpeechModeConfig,
): SdkworkAudioGenerationSpeechModeConfig {
  const voice = speechMode.voice?.trim();
  return {
    responseFormat: normalizeSpeechResponseFormat(speechMode.responseFormat)
      ?? DEFAULT_SDKWORK_AUDIO_GENERATION_SPEECH_MODE_CONFIG.responseFormat,
    speed: normalizeSpeechSpeed(speechMode.speed)
      ?? DEFAULT_SDKWORK_AUDIO_GENERATION_SPEECH_MODE_CONFIG.speed,
    ...(voice ? { voice } : {}),
  };
}

function normalizeSfxModeConfig(
  sfxMode: Partial<SdkworkAudioGenerationSfxModeConfig>,
): SdkworkAudioGenerationSfxModeConfig {
  return {
    loop: sfxMode.loop === true,
    promptInfluence: normalizeSfxPromptInfluence(sfxMode.promptInfluence)
      ?? DEFAULT_SDKWORK_AUDIO_GENERATION_SFX_MODE_CONFIG.promptInfluence,
    responseFormat: normalizeSfxResponseFormat(sfxMode.responseFormat)
      ?? DEFAULT_SDKWORK_AUDIO_GENERATION_SFX_MODE_CONFIG.responseFormat,
  };
}

function normalizeSpeechResponseFormat(
  responseFormat: SdkworkAudioGenerationSpeechModeConfig["responseFormat"] | string | undefined,
): SdkworkAudioGenerationSpeechModeConfig["responseFormat"] | undefined {
  const normalized = responseFormat?.trim().replace(/^\./u, "").toLowerCase();
  if (
    normalized === "aac"
    || normalized === "flac"
    || normalized === "mp3"
    || normalized === "opus"
    || normalized === "pcm"
    || normalized === "wav"
  ) {
    return normalized;
  }
  return undefined;
}

function normalizeSfxResponseFormat(
  responseFormat: SdkworkAudioGenerationSfxModeConfig["responseFormat"] | string | undefined,
): SdkworkAudioGenerationSfxModeConfig["responseFormat"] | undefined {
  const normalized = responseFormat?.trim().replace(/^\./u, "").toLowerCase();
  if (normalized === "mp3" || normalized === "wav") {
    return normalized;
  }
  return undefined;
}

function normalizeSpeechSpeed(speed: number | undefined): number | undefined {
  if (speed === undefined || !Number.isFinite(speed)) {
    return undefined;
  }
  return Math.min(4, Math.max(0.25, speed));
}

function normalizeSfxPromptInfluence(promptInfluence: number | undefined): number | undefined {
  if (promptInfluence === undefined || !Number.isFinite(promptInfluence)) {
    return undefined;
  }
  return Math.min(1, Math.max(0, promptInfluence));
}

function createUnavailableSdkworkAudioGenerationCreditEstimate(detail: string): SdkworkAudioGenerationCreditEstimate {
  return {
    detail,
    points: null,
    reference: false,
  };
}

function selectSdkworkAudioGenerationReferencePrice(
  prices: readonly SdkworkAudioGenerationReferencePrice[],
  modality: SdkworkAudioGenerationModality,
): SdkworkAudioGenerationReferencePrice | null {
  const meters = getSdkworkAudioGenerationMetersForModality(modality);
  for (const meter of meters) {
    const price = prices.find((candidate) => candidate.billingMeter === meter);
    if (price) {
      return price;
    }
  }
  return prices[0] ?? null;
}

function createFallbackSdkworkAudioGenerationReferencePrice(
  model: SdkworkAudioGenerationPricedModel,
): SdkworkAudioGenerationReferencePrice | null {
  if (!model.officialReferenceUnitPrice || readPositiveSdkworkAudioGenerationNumber(model.officialReferenceUnitPrice) === null) {
    return null;
  }
  return {
    billingMeter: "api_result",
    currency: model.officialReferenceCurrency || "USD",
    unitPrice: model.officialReferenceUnitPrice,
  };
}

function getSdkworkAudioGenerationMetersForModality(
  modality: SdkworkAudioGenerationModality,
): string[] {
  switch (modality) {
    case "music":
      return ["music_output_second", "audio_output_second", "sfx_result", "api_result"];
    case "audio":
      return ["audio_output_second", "audio_output_minute", "tts_input_character", "speech_character", "api_result"];
    case "sfx":
      return ["sfx_result", "audio_output_second", "audio_output_minute", "api_result"];
  }
}

function estimateSdkworkAudioGenerationMeterQuantity(
  billingMeter: string,
  modality: SdkworkAudioGenerationModality,
  config: SdkworkAudioGenerationAssetConfig,
): number {
  if (billingMeter.endsWith("_minute")) {
    return Math.max(1, Math.ceil(config.durationSeconds / 60));
  }
  if (billingMeter.endsWith("_second")) {
    return Math.max(1, config.durationSeconds);
  }
  if (billingMeter === "sfx_result") {
    return Math.max(1, modality === "sfx" ? 1 : Math.ceil(config.durationSeconds / 30));
  }
  return 1;
}

function describeSdkworkAudioGenerationCreditEstimate(
  price: SdkworkAudioGenerationReferencePrice,
  quantity: number,
): string {
  return `${price.currency} ${formatSdkworkAudioGenerationDecimal(price.unitPrice)} x ${formatSdkworkAudioGenerationDecimal(quantity.toString())} ${getSdkworkAudioGenerationUnitLabelForMeter(price.billingMeter)}`;
}

function getSdkworkAudioGenerationUnitLabelForMeter(billingMeter: string): string {
  if (billingMeter.endsWith("_second")) {
    return "sec";
  }
  if (billingMeter.endsWith("_minute")) {
    return "min";
  }
  if (billingMeter === "sfx_result") {
    return "effect";
  }
  return "unit";
}

function readPositiveSdkworkAudioGenerationNumber(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    return null;
  }
  return number;
}

function formatSdkworkAudioGenerationDecimal(value: string): string {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return value;
  }
  return number.toLocaleString("en-US", {
    maximumFractionDigits: 6,
  });
}

function cloneSdkworkAudioGenerationMediaResource(
  resource: SdkworkAudioGenerationMediaResource,
): SdkworkAudioGenerationMediaResource {
  return { ...resource };
}
