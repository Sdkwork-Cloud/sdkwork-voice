import type { VoicePcSdkPorts } from "../sdkPorts.js";

export interface VoicePcHostRegistry {
  configureSdkPorts(ports: VoicePcSdkPorts): void;
}

export function createVoicePcHostRegistry(configure: (ports: VoicePcSdkPorts) => void): VoicePcHostRegistry {
  return {
    configureSdkPorts: configure,
  };
}
