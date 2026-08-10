/**
 * My voice SDK ports.
 *
 * The host application injects the generated voice app SDK client and the
 * host-owned media capabilities (Drive upload + playback URL grants) here.
 * UI components and services MUST NOT construct SDK clients or raw HTTP.
 */

import type { MyVoiceMediaSample } from '../types/myVoice';

/**
 * Structural client surface consumed by this package. Matches the generated
 * `@sdkwork/voice-app-sdk` `voice.voiceProfiles.*` operations (SdkWork v3
 * envelope unwrapped by the SDK client).
 */
export interface MyVoiceProfilesClient {
  voice: {
    voiceProfiles: {
      list: (params?: {
        page?: number;
        pageSize?: number;
        q?: string;
      }) => Promise<{
        items?: Record<string, unknown>[];
        pageInfo?: { hasMore?: boolean; page?: number; pageSize?: number };
      }>;
      retrieve: (profileId: string) => Promise<Record<string, unknown>>;
      create: (body: Record<string, unknown>) => Promise<Record<string, unknown>>;
      update: (profileId: string, body?: Record<string, unknown>) => Promise<Record<string, unknown>>;
      delete: (profileId: string) => Promise<Record<string, unknown>>;
    };
  };
}

export interface MyVoiceUploadOptions {
  fileName?: string;
  mimeType?: string;
  durationSeconds?: number;
}

export interface MyVoiceSdkPorts {
  getVoiceClient: () => MyVoiceProfilesClient;
  /** Uploads an audio sample to host file storage (e.g. SDKWork Drive). */
  uploadAudioSample: (
    file: Blob,
    options?: MyVoiceUploadOptions,
  ) => Promise<MyVoiceMediaSample>;
  /** Resolves a playable (signed) URL for a stored sample, or null. */
  resolveMediaPlaybackUrl: (sample: MyVoiceMediaSample) => Promise<string | null>;
}

let sdkPorts: MyVoiceSdkPorts | null = null;

export function configureMyVoiceSdkPorts(ports: MyVoiceSdkPorts): void {
  sdkPorts = ports;
}

export function getMyVoiceSdkPorts(): MyVoiceSdkPorts {
  if (!sdkPorts) {
    throw new Error(
      'My Voice SDK ports are not configured. Call configureMyVoiceSdkPorts first.',
    );
  }
  return sdkPorts;
}

export function tryGetMyVoiceSdkPorts(): MyVoiceSdkPorts | null {
  return sdkPorts;
}

export function resetMyVoiceSdkPorts(): void {
  sdkPorts = null;
}

export function getConfiguredVoiceAppSdkClient(): unknown {
  return getMyVoiceSdkPorts().getVoiceClient();
}
