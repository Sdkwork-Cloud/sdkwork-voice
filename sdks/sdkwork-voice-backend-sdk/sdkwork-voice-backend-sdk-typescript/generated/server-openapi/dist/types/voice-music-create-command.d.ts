import type { VoiceProviderOptions } from './voice-provider-options';
export interface VoiceMusicCreateCommand {
    prompt: string;
    model: string;
    title?: string;
    tags?: string;
    negativeTags?: string;
    durationSeconds?: number;
    instrumental?: boolean;
    idempotencyKey?: string;
    callbackUrl?: string;
    provider?: VoiceProviderOptions;
    metadata?: Record<string, unknown>;
}
//# sourceMappingURL=voice-music-create-command.d.ts.map