import type { SdkworkVoiceMediaResource } from "@sdkwork/voice-contracts";

export type SdkworkAudioJobStatus = "processing" | "queued" | "ready";

export interface SdkworkAudioAsset {
  durationLabel: string;
  format: string;
  id: string;
  resource: SdkworkVoiceMediaResource;
  status: SdkworkAudioJobStatus;
  title: string;
  updatedAt: string;
  voiceId: string;
}

export interface SdkworkAudioVoice {
  id: string;
  itemCount: number;
  title: string;
}

export interface SdkworkAudioDigest {
  activeJobs: number;
  readyAudio: number;
  totalAudio: number;
  voiceCount: number;
}

export interface SdkworkAudioWorkspaceData {
  digest: SdkworkAudioDigest;
  isAuthenticated: boolean;
  items: SdkworkAudioAsset[];
  voices: SdkworkAudioVoice[];
}

export interface SdkworkAudioRouteIntent {
  audioId?: string;
  focusWindow: boolean;
  route: string;
  source: "audio-workspace";
  type: "audio-route-intent";
  voiceId?: string;
}

export interface CreateAudioRouteIntentOptions {
  audioId?: string;
  basePath?: string;
  focusWindow?: boolean;
  voiceId?: string;
}

export interface SdkworkAudioWorkspaceManifest {
  capability: "audio";
  description: string;
  host?: string;
  id: string;
  packageNames: string[];
  routePath: string;
  theme?: string;
  title: string;
}

export interface CreateAudioWorkspaceManifestOptions extends Partial<Omit<SdkworkAudioWorkspaceManifest, "capability" | "routePath">> {
  routePath?: string;
}

export interface CreateEmptySdkworkAudioWorkspaceOptions {
  isAuthenticated?: boolean;
  items?: readonly SdkworkAudioAsset[];
  voices?: readonly SdkworkAudioVoice[];
}

export const audioPackageMeta = {
  architecture: "pc-react",
  domain: "voice",
  package: "@sdkwork/audio-pc-react",
  status: "ready",
  workspace: "sdkwork-voice",
} as const;

function normalizeBasePath(basePath: string | undefined): string {
  const normalized = (basePath ?? "/audio").trim();
  if (!normalized || normalized === "/") {
    return "/audio";
  }

  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

function toTimestamp(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortSdkworkAudio(items: readonly SdkworkAudioAsset[]): SdkworkAudioAsset[] {
  return [...items].sort(
    (left, right) => toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt) || left.title.localeCompare(right.title),
  );
}

function parseDurationSeconds(durationLabel: string): number | undefined {
  const [minutes, seconds] = durationLabel.split(":").map((part) => Number.parseInt(part, 10));
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return undefined;
  }
  return minutes * 60 + seconds;
}

function createGeneratedAudioResource(
  id: string,
  title: string,
  format: string,
  durationLabel: string,
  voiceId: string,
): SdkworkVoiceMediaResource {
  return {
    ai: {
      provenance: "generated",
    },
    durationSeconds: parseDurationSeconds(durationLabel),
    fileName: `${id}.${format}`,
    id: `media-resource-${id}`,
    kind: "audio",
    metadata: {
      voiceId,
    },
    mimeType: format === "mp3" ? "audio/mpeg" : `audio/${format}`,
    source: "generated",
    title,
  };
}

export function createDefaultSdkworkAudioVoices(): SdkworkAudioVoice[] {
  return [
    { id: "voice-brand-female", itemCount: 2, title: "Brand Female" },
    { id: "voice-brand-male", itemCount: 1, title: "Brand Male" },
    { id: "voice-narration", itemCount: 1, title: "Narration" },
  ];
}

export function createDefaultSdkworkAudioItems(): SdkworkAudioAsset[] {
  const items = [
    { durationLabel: "00:45", format: "wav", id: "audio-launch-tag", status: "ready", title: "Launch Tag", updatedAt: "2026-04-03T04:20:00.000Z", voiceId: "voice-brand-female" },
    { durationLabel: "03:20", format: "mp3", id: "audio-podcast-intro", status: "processing", title: "Podcast Intro", updatedAt: "2026-04-02T04:20:00.000Z", voiceId: "voice-brand-male" },
    { durationLabel: "00:20", format: "wav", id: "audio-onboarding-tip", status: "ready", title: "Onboarding Tip", updatedAt: "2026-04-01T04:20:00.000Z", voiceId: "voice-brand-female" },
    { durationLabel: "01:10", format: "wav", id: "audio-product-narration", status: "queued", title: "Product Narration", updatedAt: "2026-03-31T04:20:00.000Z", voiceId: "voice-narration" },
  ] as const;

  return items.map((item) => ({
    ...item,
    resource: createGeneratedAudioResource(item.id, item.title, item.format, item.durationLabel, item.voiceId),
  }));
}

export function summarizeSdkworkAudioWorkspace(
  items: readonly SdkworkAudioAsset[],
  voices: readonly SdkworkAudioVoice[],
): SdkworkAudioDigest {
  return {
    activeJobs: items.filter((item) => item.status !== "ready").length,
    readyAudio: items.filter((item) => item.status === "ready").length,
    totalAudio: items.length,
    voiceCount: voices.length,
  };
}

export function createAudioWorkspaceManifest({
  description = "Audio workspace for voice presets, processing jobs, and reusable audio result browsing.",
  host,
  id = "sdkwork-audio",
  packageNames = [
    "@sdkwork/audio-pc-react",
    "@sdkwork/voice-contracts",
  ],
  routePath = "/audio",
  theme,
  title = "Audio Workspace",
}: CreateAudioWorkspaceManifestOptions = {}): SdkworkAudioWorkspaceManifest {
  return {
    capability: "audio",
    description,
    ...(host ? { host } : {}),
    id,
    packageNames: [...packageNames],
    routePath: normalizeBasePath(routePath),
    ...(theme ? { theme } : {}),
    title,
  };
}

export function createAudioRouteIntent(options: CreateAudioRouteIntentOptions = {}): SdkworkAudioRouteIntent {
  const basePath = normalizeBasePath(options.basePath);
  const params = new URLSearchParams();

  if (options.voiceId) {
    params.set("voiceId", options.voiceId);
  }
  if (options.audioId) {
    params.set("audioId", options.audioId);
  }

  return {
    ...(options.audioId ? { audioId: options.audioId } : {}),
    focusWindow: options.focusWindow !== false,
    route: params.toString() ? `${basePath}?${params.toString()}` : basePath,
    source: "audio-workspace",
    type: "audio-route-intent",
    ...(options.voiceId ? { voiceId: options.voiceId } : {}),
  };
}

export function createEmptySdkworkAudioWorkspace(
  options: CreateEmptySdkworkAudioWorkspaceOptions = {},
): SdkworkAudioWorkspaceData {
  const voices = options.voices?.length ? [...options.voices] : createDefaultSdkworkAudioVoices();
  const items = sortSdkworkAudio(options.items?.length ? options.items : createDefaultSdkworkAudioItems());

  return {
    digest: summarizeSdkworkAudioWorkspace(items, voices),
    isAuthenticated: Boolean(options.isAuthenticated),
    items,
    voices,
  };
}
