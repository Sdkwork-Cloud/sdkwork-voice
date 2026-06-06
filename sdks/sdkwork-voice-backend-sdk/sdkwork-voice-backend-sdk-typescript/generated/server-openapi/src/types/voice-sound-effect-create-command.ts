import type { VoiceProviderOptions } from './voice-provider-options';

export interface VoiceSoundEffectCreateCommand {
  prompt: string;
  model: string;
  durationSeconds?: number;
  loop?: boolean;
  promptInfluence?: number;
  responseFormat?: 'mp3' | 'wav';
  idempotencyKey?: string;
  callbackUrl?: string;
  provider?: VoiceProviderOptions;
  metadata?: Record<string, unknown>;
}
