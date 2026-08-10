import type { MediaResource } from './media-resource';

export interface VoiceVoiceProfileCreateCommand {
  name: string;
  description?: string;
  kind?: 'cloned' | 'uploaded' | 'preset';
  status?: 'training' | 'ready' | 'failed' | 'disabled';
  voiceId?: string;
  providerCode?: string;
  sampleMedia?: MediaResource;
  durationSeconds?: number;
}
