export const voicePcModules = ["speech", "market"] as const;

export type VoicePcModuleId = (typeof voicePcModules)[number];
