import type { VoiceProviderOptions } from './voice-provider-options';

export interface VoiceSpeechCreateCommand {
  input: string | string[];
  model: string;
  voice: string;
  responseFormat?: 'aac' | 'flac' | 'mp3' | 'opus' | 'pcm' | 'wav';
  speed?: number;
  instructions?: string;
  idempotencyKey?: string;
  callbackUrl?: string;
  provider?: VoiceProviderOptions;
  metadata?: Record<string, unknown>;
}
