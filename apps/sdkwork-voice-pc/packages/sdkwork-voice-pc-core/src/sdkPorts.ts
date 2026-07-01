import type { SessionSnapshot } from './session';

export interface VoicePcSdkPorts {
  getVoiceClient: () => unknown;
  readHostSession: () => SessionSnapshot | null;
  subscribeHostSession?: (listener: () => void) => () => void;
  resolveHostLanguage?: () => string;
  subscribeHostLanguage?: (listener: (language: string) => void) => () => void;
}

let sdkPorts: VoicePcSdkPorts | null = null;

export function configureVoicePcSdkPorts(ports: VoicePcSdkPorts): void {
  sdkPorts = ports;
}

export function getVoicePcSdkPorts(): VoicePcSdkPorts {
  if (!sdkPorts) {
    throw new Error('Voice PC SDK ports are not configured. Call configureVoicePcSdkPorts first.');
  }
  return sdkPorts;
}

export function tryGetVoicePcSdkPorts(): VoicePcSdkPorts | null {
  return sdkPorts;
}

export function getConfiguredVoiceAppSdkClient(): unknown {
  return getVoicePcSdkPorts().getVoiceClient();
}
