import { describe, expect, it } from "vitest";
import {
  appendSdkworkAudioGenerationArtifactToHistoryItem,
  createDefaultSdkworkAudioGenerationAssetConfig,
  estimateSdkworkAudioGenerationCredits,
  getSdkworkAudioGenerationDurationOptions,
  getSdkworkAudioGenerationModelBucket,
  mapSdkworkAudioGenerationArtifactsToHistoryMedia,
  serializeSdkworkAudioGenerationAssetConfig,
  updateSdkworkAudioGenerationSpeechModeConfig,
  updateSdkworkAudioGenerationSfxModeConfig,
  type SdkworkAudioGenerationArtifact,
  type SdkworkAudioGenerationAssetConfig,
  type SdkworkAudioGenerationPricedModel,
} from "../src/index.ts";

interface TestModel extends SdkworkAudioGenerationPricedModel {
  id: string;
}

function createModel(input: Partial<TestModel> & Pick<TestModel, "id">): TestModel {
  return {
    id: input.id,
    officialReferenceCurrency: input.officialReferenceCurrency ?? "USD",
    officialReferencePrices: input.officialReferencePrices ?? [],
    officialReferenceUnitPrice: input.officialReferenceUnitPrice ?? null,
    priceAvailability: input.priceAvailability ?? { status: "reference" },
  };
}

describe("sdkwork-audio-pc-react generation helpers", () => {
  it("owns speech, music, and sound-effect generation defaults in sdkwork-voice", () => {
    expect(createDefaultSdkworkAudioGenerationAssetConfig("audio")).toEqual({
      durationSeconds: 10,
      quality: "standard",
      sfxMode: undefined,
      speechMode: {
        responseFormat: "mp3",
        speed: 1,
      },
    });
    expect(createDefaultSdkworkAudioGenerationAssetConfig("music")).toEqual({
      durationSeconds: 30,
      quality: "standard",
      sfxMode: undefined,
      speechMode: undefined,
    });
    expect(createDefaultSdkworkAudioGenerationAssetConfig("sfx")).toEqual({
      durationSeconds: 5,
      quality: "standard",
      sfxMode: {
        loop: false,
        promptInfluence: 0.3,
        responseFormat: "mp3",
      },
      speechMode: undefined,
    });

    expect(getSdkworkAudioGenerationModelBucket("audio")).toBe("audios");
    expect(getSdkworkAudioGenerationModelBucket("music")).toBe("music");
    expect(getSdkworkAudioGenerationModelBucket("sfx")).toBe("sfx");
    expect(getSdkworkAudioGenerationDurationOptions("audio")).toEqual([10, 30, 60]);
  });

  it("serializes provider-specific audio request config", () => {
    const speechConfig = updateSdkworkAudioGenerationSpeechModeConfig(
      createDefaultSdkworkAudioGenerationAssetConfig("audio"),
      {
        responseFormat: "wav",
        speed: 1.25,
        voice: "nova",
      },
    );

    expect(serializeSdkworkAudioGenerationAssetConfig(speechConfig, "audio")).toEqual({
      durationSeconds: 10,
      quality: "standard",
      responseFormat: "wav",
      speechMode: {
        responseFormat: "wav",
        speed: 1.25,
        voice: "nova",
      },
      speed: 1.25,
      voice: "nova",
    });

    const sfxConfig = updateSdkworkAudioGenerationSfxModeConfig(
      createDefaultSdkworkAudioGenerationAssetConfig("sfx"),
      {
        loop: true,
        promptInfluence: 0.85,
        responseFormat: "wav",
      },
    );

    expect(serializeSdkworkAudioGenerationAssetConfig(sfxConfig, "sfx")).toMatchObject({
      loop: true,
      promptInfluence: 0.85,
      responseFormat: "wav",
    });
  });

  it("estimates audio generation credits from audio meters", () => {
    const model = createModel({
      id: "music-priced",
      officialReferencePrices: [
        { billingMeter: "api_result", currency: "USD", unitPrice: "1" },
        { billingMeter: "audio_output_second", currency: "USD", unitPrice: "0.02" },
      ],
    });
    const config: SdkworkAudioGenerationAssetConfig = {
      durationSeconds: 60,
      quality: "standard",
    };

    expect(estimateSdkworkAudioGenerationCredits({
      config,
      modality: "music",
      model,
    })).toEqual({
      detail: "USD 0.02 x 60 sec",
      points: 12,
      reference: true,
    });
  });

  it("maps streamed audio artifacts into voice-owned history items", () => {
    const artifacts: SdkworkAudioGenerationArtifact[] = [
      {
        asset: {
          durationSeconds: 4,
          kind: "audio",
          source: "external_url",
          url: "https://cdn.example/sfx.wav",
        },
        modality: "sfx",
      },
    ];

    expect(mapSdkworkAudioGenerationArtifactsToHistoryMedia(artifacts, "sfx")).toEqual({
      asset: artifacts[0]?.asset,
      durationSeconds: 4,
    });

    expect(appendSdkworkAudioGenerationArtifactToHistoryItem({
      createdAt: "2026-05-22T00:00:00Z",
      date: "2026-05-22",
      id: "pending",
      prompt: "Generate sfx",
      type: "audio",
      updatedAt: "2026-05-22T00:00:00Z",
    }, artifacts[0]!, {
      updatedAt: "2026-05-22T00:00:03Z",
    })).toMatchObject({
      asset: artifacts[0]?.asset,
      durationSeconds: 4,
      status: "processing",
      type: "sfx",
      updatedAt: "2026-05-22T00:00:03Z",
    });
  });
});
