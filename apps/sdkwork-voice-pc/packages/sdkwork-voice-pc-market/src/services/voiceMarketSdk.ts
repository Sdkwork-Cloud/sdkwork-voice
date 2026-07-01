import type { SdkworkAppClient } from '@sdkwork/voice-app-sdk';
import {
  getConfiguredVoiceAppSdkClient,
  listVoiceAudioAssetOptions,
} from 'sdkwork-voice-pc-core';

import type { VoiceConfig } from './voiceMarketService';
import {
  isVoiceMarketPilotEnabled,
  voiceMarketUnavailableMessage,
} from './voicePilot';

function resolveVoiceAppClient(): SdkworkAppClient {
  return getConfiguredVoiceAppSdkClient() as SdkworkAppClient;
}

function mapOptionToVoiceConfig(
  option: { id: string; name: string; description: string; previewUrl?: string },
  categoryId: string,
): VoiceConfig {
  return {
    id: option.id,
    name: option.name,
    description: option.description,
    categoryId,
    iconName: 'Mic',
    color: 'bg-indigo-500',
    author: 'Sdkwork Voice',
    audioPreview: option.previewUrl,
  };
}

export async function listMarketVoicesFromSdk(query?: string): Promise<VoiceConfig[]> {
  const options = await listVoiceAudioAssetOptions(resolveVoiceAppClient(), { q: query });
  return options.map((option) => mapOptionToVoiceConfig(option, 'market'));
}

export async function listMyVoicesFromSdk(): Promise<VoiceConfig[]> {
  const options = await listVoiceAudioAssetOptions(resolveVoiceAppClient(), { q: 'scope:mine' });
  return options.map((option) => mapOptionToVoiceConfig(option, 'custom'));
}

export function ensureVoiceMarketAccessMode(): 'pilot' | 'sdk' {
  if (isVoiceMarketPilotEnabled()) {
    return 'pilot';
  }
  try {
    resolveVoiceAppClient();
    return 'sdk';
  } catch {
    throw new Error(voiceMarketUnavailableMessage());
  }
}
