import type { MediaResource } from './media-resource';
import type { VoiceProviderOptions } from './voice-provider-options';

export interface VoiceTranscriptionCreateCommand {
  file: MediaResource;
  model: string;
  language?: string;
  prompt?: string;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  timestampGranularities?: ('word' | 'segment')[];
  idempotencyKey?: string;
  callbackUrl?: string;
  provider?: VoiceProviderOptions;
  metadata?: Record<string, unknown>;
}
