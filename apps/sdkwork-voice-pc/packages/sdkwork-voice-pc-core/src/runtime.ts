import type { VoicePcSdkPorts } from './sdkPorts';
import { configureVoicePcSdkPorts } from './sdkPorts';

export interface ConfigureVoicePcRuntimeOptions {
  sdkPorts: VoicePcSdkPorts;
}

export function configureVoicePcRuntime(options: ConfigureVoicePcRuntimeOptions): void {
  configureVoicePcSdkPorts(options.sdkPorts);
}
