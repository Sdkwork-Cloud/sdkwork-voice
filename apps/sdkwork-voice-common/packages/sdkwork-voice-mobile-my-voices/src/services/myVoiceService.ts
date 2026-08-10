/**
 * My voice library domain service.
 *
 * Owns all `voice.voiceProfiles.*` SDK calls through the injected client port
 * and normalizes wire records into UI-facing DTOs. Services must never
 * construct SDK clients or issue raw HTTP.
 */

import {
  getMyVoiceSdkPorts,
  type MyVoiceProfilesClient,
} from '../runtime/myVoiceSdkPorts';
import type {
  MyVoiceCreateInput,
  MyVoiceListPage,
  MyVoiceMediaSample,
  MyVoiceProfile,
  MyVoiceUpdateInput,
} from '../types/myVoice';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 200;

export class MyVoiceCapabilityUnavailableError extends Error {
  constructor() {
    super('My voice library is unavailable because the Voice SDK ports are not composed.');
    this.name = 'MyVoiceCapabilityUnavailableError';
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function mapMyVoiceProfile(item: Record<string, unknown>): MyVoiceProfile | null {
  const id = asString(item.id);
  if (!id) {
    return null;
  }
  const sampleMedia = asRecord(item.sampleMedia);
  return {
    id,
    profileNo: asString(item.profileNo) ?? '',
    name: asString(item.name) ?? id,
    description: asString(item.description),
    kind: asString(item.kind) ?? 'cloned',
    status: asString(item.status) ?? 'ready',
    voiceId: asString(item.voiceId),
    providerCode: asString(item.providerCode),
    sampleMedia,
    durationSeconds: asNumber(item.durationSeconds),
    createdAt: asString(item.createdAt) ?? '',
    updatedAt: asString(item.updatedAt) ?? '',
  };
}

function unwrapItem(raw: Record<string, unknown>): Record<string, unknown> {
  const nested = asRecord(raw.item);
  return nested ?? raw;
}

function resolveClient(): MyVoiceProfilesClient {
  try {
    return getMyVoiceSdkPorts().getVoiceClient();
  } catch {
    throw new MyVoiceCapabilityUnavailableError();
  }
}

export async function listMyVoices(options?: {
  page?: number;
  pageSize?: number;
}): Promise<MyVoiceListPage> {
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, options?.pageSize ?? DEFAULT_PAGE_SIZE),
  );
  const result = await resolveClient().voice.voiceProfiles.list({ page, pageSize });
  const items = (result.items ?? [])
    .map((item) => mapMyVoiceProfile(item))
    .filter((item): item is MyVoiceProfile => item !== null);
  return {
    items,
    hasMore: result.pageInfo?.hasMore ?? items.length >= pageSize,
    page,
    pageSize,
  };
}

export async function retrieveMyVoice(profileId: string): Promise<MyVoiceProfile | null> {
  const raw = await resolveClient().voice.voiceProfiles.retrieve(profileId);
  return mapMyVoiceProfile(unwrapItem(raw));
}

export async function createMyVoice(input: MyVoiceCreateInput): Promise<MyVoiceProfile> {
  const body: Record<string, unknown> = {
    name: input.name,
    sampleMedia: input.sampleMedia,
  };
  if (input.description !== undefined) body.description = input.description;
  if (input.kind !== undefined) body.kind = input.kind;
  if (input.voiceId !== undefined) body.voiceId = input.voiceId;
  if (input.providerCode !== undefined) body.providerCode = input.providerCode;
  if (input.durationSeconds !== undefined) body.durationSeconds = input.durationSeconds;
  const raw = await resolveClient().voice.voiceProfiles.create(body);
  const profile = mapMyVoiceProfile(unwrapItem(raw));
  if (!profile) {
    throw new Error('Voice profile create returned an invalid profile.');
  }
  return profile;
}

export async function updateMyVoice(
  profileId: string,
  input: MyVoiceUpdateInput,
): Promise<MyVoiceProfile> {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.name = input.name;
  if (input.description !== undefined) body.description = input.description;
  if (input.voiceId !== undefined) body.voiceId = input.voiceId;
  const raw = await resolveClient().voice.voiceProfiles.update(profileId, body);
  const profile = mapMyVoiceProfile(unwrapItem(raw));
  if (!profile) {
    throw new Error('Voice profile update returned an invalid profile.');
  }
  return profile;
}

export async function deleteMyVoice(profileId: string): Promise<void> {
  await resolveClient().voice.voiceProfiles.delete(profileId);
}

/** Uploads an audio sample through the host media port (Drive). */
export async function uploadMyVoiceSample(
  file: Blob,
  options?: { fileName?: string; mimeType?: string; durationSeconds?: number },
): Promise<MyVoiceMediaSample> {
  try {
    return await getMyVoiceSdkPorts().uploadAudioSample(file, options);
  } catch {
    throw new MyVoiceCapabilityUnavailableError();
  }
}

/** Resolves a playable URL for a profile sample through the host media port. */
export async function resolveMyVoicePlaybackUrl(
  profile: MyVoiceProfile,
): Promise<string | null> {
  if (!profile.sampleMedia) {
    return null;
  }
  if (typeof profile.sampleMedia.url === 'string' && profile.sampleMedia.url) {
    return profile.sampleMedia.url;
  }
  if (typeof profile.sampleMedia.publicUrl === 'string' && profile.sampleMedia.publicUrl) {
    return profile.sampleMedia.publicUrl;
  }
  try {
    return await getMyVoiceSdkPorts().resolveMediaPlaybackUrl(profile.sampleMedia);
  } catch {
    return null;
  }
}
