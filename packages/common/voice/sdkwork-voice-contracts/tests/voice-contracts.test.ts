import { describe, expect, expectTypeOf, it } from "vitest";
import {
  voiceContractsPackageMeta,
  type SdkworkVoiceMediaResource,
} from "../src/index.ts";

describe("@sdkwork/voice-contracts", () => {
  it("owns the voice media resource contract without appbase package ownership", () => {
    expect(voiceContractsPackageMeta).toMatchObject({
      domain: "voice",
      package: "@sdkwork/voice-contracts",
      workspace: "sdkwork-voice",
    });

    expectTypeOf<SdkworkVoiceMediaResource["kind"]>().toEqualTypeOf<"audio" | "voice">();

    const resource: SdkworkVoiceMediaResource = {
      ai: { provenance: "generated", provider: "openai" },
      id: "media-resource-audio-launch-tag",
      kind: "audio",
      mimeType: "audio/wav",
      source: "generated",
      title: "Launch Tag",
    };

    expect(resource.source).toBe("generated");
  });
});
