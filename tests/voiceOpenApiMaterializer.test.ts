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
      "audioAssets.list",
      "audioAssets.retrieve",
      "speech.create",
      "transcriptions.create",
      "translations.create",
    ]);
    expect(backendRoutes.map((route) => route.operationId)).toEqual([
      "audioArtifacts.list",
      "audioArtifacts.delete",
      "audioArtifacts.retrieve",
      "providerRoutes.list",
      "providerRoutes.create",
      "providerRoutes.delete",
      "providerRoutes.retrieve",
      "providerRoutes.update",
      "requestLogs.list",
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
    expect(appOpenApi.components.schemas.MediaResource.properties.kind.enum).toEqual(["audio", "voice"]);
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
