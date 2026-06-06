import type { MediaResource } from './media-resource';
import type { VoiceProviderOptions } from './voice-provider-options';

export interface VoiceTranslationCreateCommand {
  file: MediaResource;
  model: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  prompt?: string;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  idempotencyKey?: string;
  callbackUrl?: string;
  provider?: VoiceProviderOptions;
  metadata?: Record<string, unknown>;
}
