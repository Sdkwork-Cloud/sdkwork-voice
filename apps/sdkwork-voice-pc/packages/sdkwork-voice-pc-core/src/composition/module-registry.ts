import type { VoicePcModuleId } from "../modules/index.js";

export interface VoicePcModuleDescriptor {
  id: VoicePcModuleId;
  packageName: string;
}

export const voicePcModuleRegistry: VoicePcModuleDescriptor[] = [
  { id: "speech", packageName: "@sdkwork/voice-pc-speech" },
  { id: "market", packageName: "@sdkwork/voice-pc-market" },
];
