export function resolveDefaultSpeechModel(): string {
  const configured =
    import.meta.env.VITE_SDKWORK_VOICE_SPEECH_DEFAULT_MODEL
    ?? import.meta.env.VITE_SDKWORK_IM_VOICE_SPEECH_DEFAULT_MODEL;
  const normalized = typeof configured === 'string' ? configured.trim() : '';
  return normalized || 'tts-1';
}

export function resolveDefaultSpeechVoiceId(): string {
  const configured =
    import.meta.env.VITE_SDKWORK_VOICE_SPEECH_DEFAULT_VOICE
    ?? import.meta.env.VITE_SDKWORK_IM_VOICE_SPEECH_DEFAULT_VOICE;
  const normalized = typeof configured === 'string' ? configured.trim() : '';
  return normalized || 'alloy';
}
