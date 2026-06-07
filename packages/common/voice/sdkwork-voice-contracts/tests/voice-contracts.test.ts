import { describe, expect, expectTypeOf, it } from "vitest";
import {
  voiceContractsPackageMeta,
  type SdkworkVoiceArtifact,
  type SdkworkVoiceArtifactDriveSync,
  type SdkworkVoiceMediaResource,
  type SdkworkVoiceProviderGeneratedArtifact,
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

    expectTypeOf<SdkworkVoiceMediaResource["kind"]>().toEqualTypeOf<
      "image" | "video" | "audio" | "voice" | "document" | "archive" | "model" | "other"
    >();

    expectTypeOf<SdkworkVoiceMediaResource["sizeBytes"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<NonNullable<SdkworkVoiceMediaResource["access"]>["visibility"]>().toEqualTypeOf<
      "private" | "tenant" | "organization" | "public" | "signed"
    >();
    expectTypeOf<NonNullable<SdkworkVoiceMediaResource["checksum"]>["algorithm"]>().toEqualTypeOf<
      "md5" | "sha256" | "etag"
    >();
    expectTypeOf<NonNullable<SdkworkVoiceMediaResource["ai"]>["provenance"]>().toEqualTypeOf<
      "uploaded" | "generated" | "edited" | "imported" | "recorded"
    >();

    const resource: SdkworkVoiceMediaResource = {
      access: { visibility: "tenant" },
      ai: { provenance: "generated", provider: "openai" },
      altText: "Launch tag waveform",
      checksum: { algorithm: "sha256", value: "sha256:launch-tag" },
      durationSeconds: 1.2,
      height: 512,
      id: "media-resource-audio-launch-tag",
      kind: "audio",
      mimeType: "audio/wav",
      objectBlobId: "object-blob-audio-launch-tag",
      poster: {
        kind: "image",
        source: "generated",
        uri: "provider://openai/image/poster-launch-tag",
      },
      publicUrl: "https://cdn.example.test/launch-tag.wav",
      sizeBytes: "128",
      source: "generated",
      thumbnails: [
        {
          kind: "image",
          source: "generated",
          uri: "provider://openai/image/thumb-launch-tag",
        },
      ],
      title: "Launch Tag",
      variants: [
        {
          kind: "audio",
          source: "generated",
          uri: "provider://openai/audio/variant-launch-tag",
        },
      ],
      width: 512,
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
      | "realtime_session"
      | "realtime_client_secret"
      | "realtime_call"
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
      | "generated_image"
      | "generated_video"
      | "realtime_session"
      | "realtime_client_secret"
      | "realtime_call"
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

  it("models generated image, video, audio, and music artifact persistence into Drive AI space", () => {
    expectTypeOf<SdkworkVoiceMediaResource["kind"]>().toEqualTypeOf<
      "image" | "video" | "audio" | "voice" | "document" | "archive" | "model" | "other"
    >();
    expectTypeOf<SdkworkVoiceArtifact["kind"]>().toEqualTypeOf<
      "audio" | "transcript" | "translation" | "sfx" | "music" | "image" | "video"
    >();

    const driveSync: SdkworkVoiceArtifactDriveSync = {
      actorType: "anonymous",
      anonymousId: "anon-browser-1",
      artifactId: "artifact-image-1",
      artifactIndex: 0,
      driveNodeId: "drive-node-image-1",
      driveSpaceId: "drive-space-ai-generated",
      driveSpaceType: "ai_generated",
      driveUploadItemId: "drive-upload-image-1",
      status: "uploaded",
      syncNo: "sync-image-1",
      taskId: "task-image-batch",
    };
    const artifact: SdkworkVoiceArtifact = {
      driveSync,
      id: "artifact-image-1",
      kind: "image",
      mediaResource: {
        ai: {
          generationTaskId: "task-image-batch",
          provenance: "generated",
          provider: "volcengine",
        },
        kind: "image",
        mimeType: "image/png",
        source: "drive",
        uri: "drive://drive-space-ai-generated/drive-node-image-1",
      },
      taskId: "task-image-batch",
    };

    expect(artifact.driveSync?.driveSpaceType).toBe("ai_generated");
    expect(artifact.driveSync?.actorType).toBe("anonymous");
    expect(artifact.mediaResource.kind).toBe("image");
  });

  it("models provider generated artifacts before task artifacts are imported into Drive", () => {
    const generatedArtifacts: SdkworkVoiceProviderGeneratedArtifact[] = [
      {
        artifactIndex: 0,
        contentLength: 128,
        fileName: "speech-0000.mp3",
        kind: "audio",
        mediaKind: "audio",
        mimeType: "audio/mpeg",
        providerCode: "openai",
        source: "generated",
        sourceUri: "provider://openai/speech/0000",
      },
      {
        artifactIndex: 1,
        durationSeconds: 8,
        fileName: "video-0001.mp4",
        kind: "video",
        mediaKind: "video",
        mimeType: "video/mp4",
        providerAssetId: "provider-video-1",
        providerCode: "volcengine",
        source: "external_url",
        sourceUri: "https://provider.example/video.mp4",
      },
    ];
    const result: SdkworkVoiceProviderInvocationResult = {
      generatedArtifacts,
      providerCode: "volcengine",
      status: "completed",
    };

    expect(result.generatedArtifacts?.map((artifact) => artifact.artifactIndex)).toEqual([0, 1]);
    expect(result.generatedArtifacts?.[1]?.source).toBe("external_url");
    expect(result.generatedArtifacts?.[1]?.providerAssetId).toBe("provider-video-1");
  });
});
