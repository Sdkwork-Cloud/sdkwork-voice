export function isVoiceMarketPilotEnabled(): boolean {
  const configured =
    import.meta.env.VITE_SDKWORK_VOICE_MARKET_PILOT
    ?? import.meta.env.VITE_SDKWORK_IM_VOICE_MARKET_PILOT;
  if (configured === 'true' || configured === '1') {
    return true;
  }
  if (configured === 'false' || configured === '0') {
    return false;
  }
  return import.meta.env.DEV;
}

export function voiceMarketUnavailableMessage(): string {
  return 'Voice market is unavailable. Configure sdkwork-voice-pc runtime ports and sdkwork-voice-app-sdk, or enable VITE_SDKWORK_VOICE_MARKET_PILOT=true for local pilot preview.';
}

export function voiceMarketPilotBannerMessage(): string {
  return 'Pilot preview — catalog and clone flows use local mock data. Disable VITE_SDKWORK_VOICE_MARKET_PILOT to consume sdkwork-voice-app-sdk audio assets in production builds.';
}
