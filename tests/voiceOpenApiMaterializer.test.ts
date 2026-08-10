import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildOpenApi,
  collectRoutes,
  selectRoutes,
  surfaces,
} from "../sdks/materialize-voice-v3-openapi-boundaries.mjs";

describe("sdkwork-voice OpenAPI materializer", () => {
  it("collects voice routes from Rust and keeps app/backend API boundaries canonical", async () => {
    const routes = await collectRoutes();
    const appRoutes = selectRoutes(routes, surfaces.app.prefix);
    const backendRoutes = selectRoutes(routes, surfaces.backend.prefix);

    expect(appRoutes.map((route) => route.operationId)).toEqual([
      "artifactDriveSync.list",
      "audioAssets.list",
      "audioAssets.retrieve",
      "music.create",
      "soundEffects.create",
      "speech.create",
      "taskEvents.list",
      "tasks.list",
      "tasks.retrieve",
      "tasks.cancel",
      "transcriptions.create",
      "translations.create",
      "voiceProfiles.list",
      "voiceProfiles.create",
      "voiceProfiles.delete",
      "voiceProfiles.retrieve",
      "voiceProfiles.update",
    ]);
    expect(backendRoutes.map((route) => route.operationId)).toEqual([
      "artifactDriveSync.list",
      "artifactDriveSync.retry",
      "audioArtifacts.list",
      "audioArtifacts.delete",
      "audioArtifacts.retrieve",
      "providerRoutes.list",
      "providerRoutes.create",
      "providerRoutes.delete",
      "providerRoutes.retrieve",
      "providerRoutes.update",
      "providerWebhookEvents.list",
      "providerWebhookEvents.replay",
      "providerWebhooks.accept",
      "requestLogs.list",
      "taskEvents.list",
      "tasks.list",
      "tasks.retrieve",
      "tasks.cancel",
      "tasks.reconcile",
      "tasks.retry",
      "webhookDeliveries.list",
    ]);
    expect(appRoutes.every((route) => route.path.startsWith("/app/v3/api/voice"))).toBe(true);
    expect(backendRoutes.every((route) => route.path.startsWith("/backend/v3/api/voice"))).toBe(true);
  });

  it("materializes owner-only SDKWork v3 OpenAPI for app and backend SDK generation", async () => {
    const routes = await collectRoutes();
    const appOpenApi = buildOpenApi(surfaces.app, selectRoutes(routes, surfaces.app.prefix));
    const backendOpenApi = buildOpenApi(surfaces.backend, selectRoutes(routes, surfaces.backend.prefix));

    expect(appOpenApi.openapi).toBe("3.1.2");
    expect(backendOpenApi.openapi).toBe("3.1.2");
    expect(appOpenApi.info["x-sdkwork-api-authority"]).toBe("sdkwork-voice-app-api");
    expect(backendOpenApi.info["x-sdkwork-api-authority"]).toBe("sdkwork-voice-backend-api");
    expect(appOpenApi.info["x-sdkwork-sdk-family"]).toBe("sdkwork-voice-app-sdk");
    expect(backendOpenApi.info["x-sdkwork-sdk-family"]).toBe("sdkwork-voice-backend-sdk");

    const allOperations = [
      ...Object.values(appOpenApi.paths).flatMap((pathItem) => Object.values(pathItem)),
      ...Object.values(backendOpenApi.paths).flatMap((pathItem) => Object.values(pathItem)),
    ];
    expect(allOperations.map((operation) => operation["x-sdkwork-owner"])).toEqual(
      Array.from({ length: allOperations.length }, () => "sdkwork-voice"),
    );
    expect(allOperations.map((operation) => operation["x-sdkwork-domain"])).toEqual(
      Array.from({ length: allOperations.length }, () => "voice"),
    );
    expect(JSON.stringify({ appOpenApi, backendOpenApi })).not.toContain("sdkwork-appbase");
    expect(appOpenApi.paths["/app/v3/api/voice/speech"]?.post?.operationId).toBe("speech.create");
    expect(appOpenApi.paths["/app/v3/api/voice/transcriptions"]?.post?.operationId).toBe("transcriptions.create");
    expect(appOpenApi.paths["/app/v3/api/voice/translations"]?.post?.operationId).toBe("translations.create");
    expect(appOpenApi.paths["/app/v3/api/voice/sound_effects"]?.post?.operationId).toBe("soundEffects.create");
    expect(appOpenApi.paths["/app/v3/api/voice/music"]?.post?.operationId).toBe("music.create");
    expect(appOpenApi.paths["/app/v3/api/voice/tasks/{taskId}"]?.get?.operationId).toBe("tasks.retrieve");
    expect(backendOpenApi.paths["/backend/v3/api/voice/provider_webhooks/{providerCode}"]?.post?.operationId).toBe("providerWebhooks.accept");
    expect(backendOpenApi.paths["/backend/v3/api/voice/tasks/{taskId}/reconcile"]?.post?.operationId).toBe("tasks.reconcile");
    expect(requestBodySchemaRef(appOpenApi.paths["/app/v3/api/voice/speech"]?.post)).toBe("#/components/schemas/VoiceSpeechCreateCommand");
    expect(requestBodySchemaRef(appOpenApi.paths["/app/v3/api/voice/sound_effects"]?.post)).toBe("#/components/schemas/VoiceSoundEffectCreateCommand");
    expect(requestBodySchemaRef(appOpenApi.paths["/app/v3/api/voice/music"]?.post)).toBe("#/components/schemas/VoiceMusicCreateCommand");
    expect(schemaObject(appOpenApi.components.schemas.MediaResource).required).toEqual(["kind", "source"]);
    expect(schemaObject(schemaObject(appOpenApi.components.schemas.MediaResource).properties).kind.$ref).toBe("#/components/schemas/MediaKind");
    expect(schemaObject(schemaObject(appOpenApi.components.schemas.MediaResource).properties).source.$ref).toBe("#/components/schemas/MediaSource");
    expect(schemaObject(appOpenApi.components.schemas.MediaKind).enum).toEqual([
      "image",
      "video",
      "audio",
      "voice",
      "document",
      "archive",
      "model",
      "other",
    ]);
    expect(schemaObject(appOpenApi.components.schemas.MediaSource).enum).toEqual([
      "drive",
      "external_url",
      "data_url",
      "provider_asset",
      "generated",
    ]);
    expect(schemaObject(appOpenApi.components.schemas.VoiceOperationType).enum).toEqual([
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
    expect(schemaObject(appOpenApi.components.schemas.VoiceTaskStatus).enum).toEqual([
      "queued",
      "routing",
      "submitted",
      "running",
      "succeeded",
      "failed",
      "cancelled",
      "expired",
      "needs_review",
    ]);
    expect(schemaObject(appOpenApi.components.schemas.VoiceTask).required).toEqual(
      expect.arrayContaining(["id", "operationType", "status", "createdAt", "updatedAt"]),
    );
    expect(schemaObject(schemaObject(appOpenApi.components.schemas.VoiceArtifact).properties).mediaResource.$ref).toBe("#/components/schemas/MediaResource");
    expect(schemaObject(schemaObject(appOpenApi.components.schemas.VoiceArtifact).properties).driveSync.$ref).toBe("#/components/schemas/VoiceArtifactDriveSync");
    expect(schemaObject(schemaObject(appOpenApi.components.schemas.VoiceArtifactDriveSync).properties).driveSpaceType.enum).toEqual([
      "ai_generated",
      "app_upload",
      "app",
      "personal",
      "team",
      "knowledge_base",
    ]);
    expect(appOpenApi.components.schemas.VoiceApiResult).toBeUndefined();
    expect(appOpenApi.components.schemas.SdkWorkApiResponse).toBeDefined();
    const problemDetail = schemaObject(appOpenApi.components.schemas.ProblemDetail);
    expect(problemDetail.required).toEqual(expect.arrayContaining(["code", "traceId"]));
    expect(problemDetail.properties.code.$ref).toBe("#/components/schemas/SdkWorkPlatformErrorCode");
  });

  it("writes deterministic JSON-compatible OpenAPI documents to sdkgen paths", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "sdkwork-voice-openapi-"));
    try {
      const openapi = buildOpenApi(surfaces.app, selectRoutes(await collectRoutes(), surfaces.app.prefix));
      const output = join(tempRoot, "sdkwork-voice-app-api.openapi.yaml");
      await import("node:fs/promises").then(({ writeFile }) => writeFile(output, `${JSON.stringify(openapi, null, 2)}\n`, "utf8"));
      const parsed = JSON.parse(await readFile(output, "utf8"));

      expect(parsed.openapi).toBe("3.1.2");
      expect(Object.keys(parsed.paths).every((path) => path.startsWith("/app/v3/api/voice"))).toBe(true);
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });
});

function schemaObject(value: unknown) {
  return value as Record<string, any>;
}

function requestBodySchemaRef(operation: unknown) {
  return schemaObject(
    schemaObject(schemaObject(operation).requestBody).content,
  )["application/json"].schema.$ref;
}
