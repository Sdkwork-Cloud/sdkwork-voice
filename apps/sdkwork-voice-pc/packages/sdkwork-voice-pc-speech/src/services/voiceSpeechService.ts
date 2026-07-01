import type { SdkworkAppClient } from '@sdkwork/voice-app-sdk';
import {
  getConfiguredVoiceAppSdkClient,
  listVoiceAudioAssetOptions,
  type VoiceAudioAssetOption,
} from 'sdkwork-voice-pc-core';

import {
  resolveDefaultSpeechModel,
  resolveDefaultSpeechVoiceId,
} from './voiceSpeechRuntime';

export const PC_VOICE_SPEECH_CONTRACT_UNAVAILABLE =
  'Voice speech synthesis requires text, model, and voice selection through sdkwork-voice-app-sdk.';

export interface VoiceSpeechGenerateInput {
  text: string;
  model?: string;
  voice?: string;
}

function resolveVoiceAppClient(): SdkworkAppClient {
  return getConfiguredVoiceAppSdkClient() as SdkworkAppClient;
}

function buildSpeechCommand(input: VoiceSpeechGenerateInput) {
  const normalizedText = input.text.trim();
  const model = input.model?.trim() || resolveDefaultSpeechModel();
  const voice = input.voice?.trim() || resolveDefaultSpeechVoiceId();

  if (!normalizedText || !model || !voice) {
    throw new Error(PC_VOICE_SPEECH_CONTRACT_UNAVAILABLE);
  }

  return {
    input: normalizedText,
    model,
    voice,
  };
}

class VoiceSpeechService {
  async listVoiceOptions(): Promise<VoiceAudioAssetOption[]> {
    return listVoiceAudioAssetOptions(resolveVoiceAppClient());
  }

  async generate(input: VoiceSpeechGenerateInput): Promise<Record<string, unknown>> {
    const command = buildSpeechCommand(input);
    return resolveVoiceAppClient().voice.speech.create(command);
  }
}

export const voiceSpeechService = new VoiceSpeechService();
