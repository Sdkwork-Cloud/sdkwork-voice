import { describe, expect, expectTypeOf, it } from "vitest";
import {
  voiceContractsPackageMeta,
  type SdkworkVoiceArtifact,
  type SdkworkVoiceMediaResource,
  type SdkworkVoiceOperationType,
  type SdkworkVoiceProviderInvocationResult,
  type SdkworkVoiceProviderRouteCapability,
  type SdkworkVoiceTask,
  type SdkworkVoiceTaskStatus,
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

  it("defines professional voice task, artifact, provider, and status contracts", () => {
    expectTypeOf<SdkworkVoiceOperationType>().toEqualTypeOf<
      | "speech"
      | "transcription"
      | "translation"
      | "sound_effect"
      | "music"
      | "realtime_transcription"
      | "realtime_translation"
    >();
    expectTypeOf<SdkworkVoiceTaskStatus>().toEqualTypeOf<
      | "queued"
      | "routing"
      | "submitted"
      | "running"
      | "succeeded"
      | "failed"
      | "cancelled"
      | "expired"
      | "needs_review"
    >();
    expectTypeOf<SdkworkVoiceProviderRouteCapability>().toEqualTypeOf<
      | "speech"
      | "transcription"
      | "translation"
      | "sound_effect"
      | "music"
      | "voice_catalog"
      | "voice_consent"
      | "realtime_transcription"
      | "realtime_translation"
    >();

    const task: SdkworkVoiceTask = {
      createdAt: "2026-06-06T00:00:00.000Z",
      id: "voice-task-1",
      operationType: "sound_effect",
      providerCode: "elevenlabs",
      status: "submitted",
      updatedAt: "2026-06-06T00:00:01.000Z",
    };
    const artifact: SdkworkVoiceArtifact = {
      id: "voice-artifact-1",
      kind: "sfx",
      mediaResource: {
        ai: {
          generationTaskId: task.id,
          model: "eleven_text_to_sound_v2",
          provenance: "generated",
          provider: "elevenlabs",
        },
        kind: "audio",
        mimeType: "audio/wav",
        source: "provider_asset",
        uri: "provider://elevenlabs/sfx/provider-asset-1",
      },
      taskId: task.id,
    };
    const result: SdkworkVoiceProviderInvocationResult = {
      providerCode: "suno",
      providerTaskId: "suno-task-1",
      status: "task_started",
    };

    expect(task.operationType).toBe("sound_effect");
    expect(artifact.kind).toBe("sfx");
    expect(result.status).toBe("task_started");
  });
});
