/**
 * My voice library domain types.
 *
 * The wire representation of a voice profile comes from the generated
 * `@sdkwork/voice-app-sdk` (`voice.voiceProfiles.*`). These mapped types are
 * the UI-facing DTOs owned by this package.
 */

export interface MyVoiceMediaSample {
  id?: string;
  kind?: string;
  source?: string;
  url?: string;
  publicUrl?: string;
  uri?: string;
  spaceId?: string;
  nodeId?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: string;
  durationSeconds?: number;
  [key: string]: unknown;
}

export type MyVoiceKind = 'cloned' | 'uploaded' | 'preset';

export type MyVoiceStatus = 'training' | 'ready' | 'failed' | 'disabled';

export interface MyVoiceProfile {
  id: string;
  profileNo: string;
  name: string;
  description: string | null;
  kind: MyVoiceKind | string;
  status: MyVoiceStatus | string;
  voiceId: string | null;
  providerCode: string | null;
  sampleMedia: MyVoiceMediaSample | null;
  durationSeconds: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MyVoiceListPage {
  items: MyVoiceProfile[];
  hasMore: boolean;
  page: number;
  pageSize: number;
}

export interface MyVoiceCreateInput {
  name: string;
  description?: string;
  kind?: MyVoiceKind;
  voiceId?: string;
  providerCode?: string;
  sampleMedia: MyVoiceMediaSample;
  durationSeconds?: number;
}

export interface MyVoiceUpdateInput {
  name?: string;
  description?: string;
  voiceId?: string;
}

export function formatVoiceDuration(totalSeconds: number | null | undefined): string {
  if (!totalSeconds || totalSeconds <= 0) {
    return '00:00';
  }
  const seconds = Math.floor(totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainder
    .toString()
    .padStart(2, '0')}`;
}
