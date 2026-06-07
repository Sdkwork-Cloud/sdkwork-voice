import { describe, expect, it } from "vitest";
import { buildOpenApi, surfaces } from "./materialize-voice-v3-openapi-boundaries.mjs";

const routes = [
  {
    domain: "voice",
    method: "post",
    operationId: "voice.tasks.create",
    owner: "sdkwork-voice",
    path: "/app/v3/api/voice/tasks",
    sourcePath: "packages/native-rust/voice/sdkwork-voice-http-rust/src/lib.rs",
    tag: "voice",
  },
] as const;

describe("voice v3 OpenAPI materializer", () => {
  it("materializes the canonical SDKWork media resource schema", () => {
    const openApi = buildOpenApi(surfaces.app, routes);
    const schemas = openApi.components.schemas as Record<string, Record<string, unknown>>;
    const mediaResource = schemas.MediaResource as {
      properties: Record<string, unknown>;
      required: string[];
    };
    const mediaKind = schemas.MediaKind as { enum: string[] };
    const mediaSource = schemas.MediaSource as { enum: string[] };
    const mediaAccess = schemas.MediaAccess as { properties: { visibility: { enum: string[] } } };
    const mediaChecksum = schemas.MediaChecksum as { properties: { algorithm: { enum: string[] } } };

    expect(mediaResource.required).toEqual(["kind", "source"]);
    expect(mediaResource.properties.id).toEqual({ type: "string" });
    expect(mediaResource.properties.kind).toEqual({ $ref: "#/components/schemas/MediaKind" });
    expect(mediaResource.properties.source).toEqual({ $ref: "#/components/schemas/MediaSource" });
    expect(mediaResource.properties.sizeBytes).toMatchObject({
      pattern: "^[0-9]+$",
      type: ["string", "null"],
    });
    expect(mediaResource.properties.durationSeconds).toMatchObject({
      minimum: 0,
      type: ["number", "null"],
    });
    expect(mediaResource.properties).not.toHaveProperty("durationMs");
    expect(mediaResource.properties.checksum).toEqual({ $ref: "#/components/schemas/MediaChecksum" });
    expect(mediaResource.properties.access).toEqual({ $ref: "#/components/schemas/MediaAccess" });
    expect(mediaResource.properties.ai).toEqual({ $ref: "#/components/schemas/MediaAiProvenance" });

    expect(mediaKind.enum).toEqual(["image", "video", "audio", "voice", "document", "archive", "model", "other"]);
    expect(mediaSource.enum).toEqual(["drive", "external_url", "data_url", "provider_asset", "generated"]);
    expect(mediaAccess.properties.visibility.enum).toEqual(["private", "tenant", "organization", "public", "signed"]);
    expect(mediaChecksum.properties.algorithm.enum).toEqual(["sha256", "md5", "etag"]);
  });

  it("keeps generated SDK operation types aligned with voice contracts", () => {
    const openApi = buildOpenApi(surfaces.app, routes);
    const schemas = openApi.components.schemas as Record<string, Record<string, unknown>>;
    const voiceOperationType = schemas.VoiceOperationType as { enum: string[] };

    expect(voiceOperationType.enum).toEqual([
      "speech",
      "transcription",
      "translation",
      "sound_effect",
      "music",
      "realtime_session",
      "realtime_client_secret",
      "realtime_call",
      "realtime_transcription",
      "realtime_translation",
    ]);
  });
});
