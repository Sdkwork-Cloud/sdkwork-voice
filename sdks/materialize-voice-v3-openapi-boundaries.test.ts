import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { buildOpenApi, surfaces } from "./materialize-voice-v3-openapi-boundaries.mjs";

const workspaceRoot = resolve(import.meta.dirname, "..");

const routes = [
  {
    apiAuthority: "sdkwork-voice-app-api",
    domain: "voice",
    method: "post",
    operationId: "voice.tasks.create",
    owner: "sdkwork-voice",
    path: "/app/v3/api/voice/tasks",
    sdkFamily: "sdkwork-voice-app-sdk",
    sourcePath: resolve(
      workspaceRoot,
      "crates/sdkwork-routes-voice-app-api/src/manifest.rs",
    ),
    sourcePrefix: "/app/v3/api",
    sourceRouteCrate: "sdkwork-routes-voice-app-api",
    surface: "app-api",
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

  it("records Rust route crate source metadata on materialized operations", () => {
    const openApi = buildOpenApi(surfaces.app, routes);
    const operation = openApi.paths["/app/v3/api/voice/tasks"].post;

    expect(operation["x-sdkwork-source"]).toBe(
      "<sdkwork-voice>/crates/sdkwork-routes-voice-app-api/src/manifest.rs",
    );
    expect(operation["x-sdkwork-source-route-crate"]).toBe(
      "sdkwork-routes-voice-app-api",
    );
    expect(openApi["x-sdkwork-materialized-from"]).toEqual([
      expect.objectContaining({
        apiAuthority: "sdkwork-voice-app-api",
        packageName: "sdkwork-routes-voice-app-api",
        sdkFamily: "sdkwork-voice-app-sdk",
        sourceRouteCrate: "sdkwork-routes-voice-app-api",
        surface: "app-api",
      }),
    ]);
  });

  it("writes standard route manifest artifacts from app and backend route crates", () => {
    const materializerPath = resolve(
      workspaceRoot,
      "sdks/materialize-voice-v3-openapi-boundaries.mjs",
    );
    const result = spawnSync(process.execPath, [materializerPath], {
      cwd: workspaceRoot,
      encoding: "utf8",
    });

    expect(result.status, result.stderr || result.stdout).toBe(0);

    const appManifestPath = resolve(
      workspaceRoot,
      "sdks/_route-manifests/app-api/sdkwork-routes-voice-app-api.route-manifest.json",
    );
    const backendManifestPath = resolve(
      workspaceRoot,
      "sdks/_route-manifests/backend-api/sdkwork-routes-voice-backend-api.route-manifest.json",
    );
    expect(existsSync(appManifestPath)).toBe(true);
    expect(existsSync(backendManifestPath)).toBe(true);

    const appManifest = JSON.parse(readFileSync(appManifestPath, "utf8"));
    const backendManifest = JSON.parse(readFileSync(backendManifestPath, "utf8"));

    expect(appManifest.packageName).toBe("sdkwork-routes-voice-app-api");
    expect(appManifest.surface).toBe("app-api");
    expect(appManifest.source.crateRoot).toBe("crates/sdkwork-routes-voice-app-api");
    expect(appManifest.routes).toHaveLength(12);

    expect(backendManifest.packageName).toBe("sdkwork-routes-voice-backend-api");
    expect(backendManifest.surface).toBe("backend-api");
    expect(backendManifest.source.crateImport).toBe("sdkwork_routes_voice_backend_api");
    expect(backendManifest.routes).toHaveLength(21);
  });
});
