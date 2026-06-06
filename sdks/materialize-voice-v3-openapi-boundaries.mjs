import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const voiceRoot = resolve(__dirname, "..");

export const routeSources = [
  {
    owner: "sdkwork-voice",
    domain: "voice",
    path: resolve(
      voiceRoot,
      "packages/native-rust/voice/sdkwork-voice-http-rust/src/lib.rs",
    ),
    constructors: ["VoiceHttpRoute::new"],
  },
];

export const surfaces = {
  app: {
    sdkType: "app",
    sdkOwner: "sdkwork-voice",
    familyName: "sdkwork-voice-app-sdk",
    authorityName: "sdkwork-voice-app-api",
    title: "SDKWork Voice App API",
    description: "App/client contract for SDKWork Voice speech, transcription, translation, sound-effect generation, music generation, task state, and audio asset browsing.",
    prefix: "/app/v3/api",
    audience: "App, desktop, mobile, H5, and user-facing voice clients",
  },
  backend: {
    sdkType: "backend",
    sdkOwner: "sdkwork-voice",
    familyName: "sdkwork-voice-backend-sdk",
    authorityName: "sdkwork-voice-backend-api",
    title: "SDKWork Voice Backend API",
    description: "Backend/admin contract for SDKWork Voice provider routes, generation tasks, webhook reconciliation, request logs, and audio artifacts.",
    prefix: "/backend/v3/api",
    audience: "Backend consoles, operators, control-plane integrations, and admin automation",
  },
};

const methodNames = {
  Get: "get",
  Post: "post",
  Patch: "patch",
  Put: "put",
  Delete: "delete",
};

export async function main() {
  const routes = await collectRoutes();
  const appRoutes = selectRoutes(routes, surfaces.app.prefix);
  const backendRoutes = selectRoutes(routes, surfaces.backend.prefix);

  if (appRoutes.length === 0) {
    throw new Error("No voice app-api routes were materialized from Rust route catalogs.");
  }
  if (backendRoutes.length === 0) {
    throw new Error("No voice backend-api routes were materialized from Rust route catalogs.");
  }

  await writeSurfaceOpenApi(surfaces.app, appRoutes);
  await writeSurfaceOpenApi(surfaces.backend, backendRoutes);

  console.log(`Materialized ${appRoutes.length} voice app-api operations.`);
  console.log(`Materialized ${backendRoutes.length} voice backend-api operations.`);
}

export async function collectRoutes() {
  const routes = [];
  for (const source of routeSources) {
    const content = await readFile(source.path, "utf8");
    const constructors = source.constructors.map((constructor) => escapeRegExp(constructor)).join("|");
    const routePattern = new RegExp(
      `(?:${constructors})\\s*\\(\\s*HttpMethod::(Get|Post|Patch|Put|Delete)\\s*,\\s*"([^"]+)"\\s*,\\s*"([^"]+)"\\s*,\\s*"([^"]+)"\\s*,?\\s*\\)`,
      "g",
    );

    for (const match of content.matchAll(routePattern)) {
      routes.push({
        domain: source.domain,
        owner: source.owner,
        method: methodNames[match[1]],
        path: match[2],
        tag: toLowerCamel(match[3]),
        operationId: match[4],
        sourcePath: source.path,
      });
    }
  }

  const byKey = new Map();
  for (const route of routes) {
    const key = `${route.method.toUpperCase()} ${route.path}`;
    if (!byKey.has(key)) {
      byKey.set(key, route);
      continue;
    }
    const previous = byKey.get(key);
    if (previous.operationId !== route.operationId || previous.tag !== route.tag) {
      throw new Error(
        `Conflicting route metadata for ${key}: ${previous.operationId}/${previous.tag} vs ${route.operationId}/${route.tag}`,
      );
    }
  }

  return Array.from(byKey.values()).sort(compareRoutes);
}

export function selectRoutes(routes, prefix) {
  return routes.filter((route) => route.path.startsWith(`${prefix}/`) || route.path === prefix);
}

export async function writeSurfaceOpenApi(surface, routes) {
  const authority = buildOpenApi(surface, routes);
  const familyRoot = resolve(voiceRoot, "sdks", surface.familyName);
  const openapiRoot = resolve(familyRoot, "openapi");
  await mkdir(openapiRoot, { recursive: true });

  const authorityPath = resolve(openapiRoot, `${surface.authorityName}.openapi.yaml`);
  const sdkgenPath = resolve(openapiRoot, `${surface.authorityName}.sdkgen.yaml`);
  const flutterSdkgenPath = resolve(openapiRoot, `${surface.authorityName}.flutter.sdkgen.yaml`);
  const content = `${JSON.stringify(authority, null, 2)}\n`;

  await writeFile(authorityPath, content, "utf8");
  await writeFile(sdkgenPath, content, "utf8");
  await writeFile(flutterSdkgenPath, content, "utf8");
}

export function buildOpenApi(surface, routes) {
  const paths = {};
  for (const route of routes) {
    const pathItem = paths[route.path] ?? {};
    pathItem[route.method] = buildOperation(surface, route);
    paths[route.path] = pathItem;
  }

  const tags = Array.from(new Set(routes.map((route) => route.tag)))
    .sort()
    .map((name) => ({
      name,
      description: `${toTitle(name)} API resources.`,
      "x-sdk-nested-resource-surface": true,
    }));

  return {
    openapi: "3.1.2",
    info: {
      title: surface.title,
      version: "1.0.0",
      description: surface.description,
      "x-sdkwork-api-authority": surface.authorityName,
      "x-sdkwork-sdk-family": surface.familyName,
      "x-sdkwork-audience": surface.audience,
    },
    servers: [
      {
        url: "http://localhost:8080",
        description: "Local sdkwork-voice runtime",
      },
    ],
    tags,
    security: [{ AuthToken: [], AccessToken: [] }],
    paths,
    components: {
      securitySchemes: {
        AuthToken: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "SDKWork auth token carried as Authorization: Bearer <auth_token>.",
        },
        AccessToken: {
          type: "apiKey",
          in: "header",
          name: "Access-Token",
          description: "SDKWork access isolation token.",
        },
      },
      schemas: buildSchemas(),
    },
    "x-sdkwork-materialized-from": routeSources.map((source) => ({
      owner: source.owner,
      path: relativeForOpenApi(source.path),
    })),
    "x-sdkwork-request-context": {
      contextObject: "AppRequestContext",
      serverRequestId: "server-owned",
      clientRequestIdHeader: "forbidden",
      tenantSource: "AuthToken + AccessToken",
      organizationSource: "AuthToken + AccessToken",
      userSource: "AuthToken + AccessToken",
    },
  };
}

function buildOperation(surface, route) {
  const operation = {
    tags: [route.tag],
    summary: `${toTitle(route.operationId)}.`,
    operationId: route.operationId,
    parameters: extractPathParameters(route.path),
    responses: {
      200: jsonResponse("Success", "#/components/schemas/VoiceApiResult"),
      400: problemResponse("Bad request"),
      401: problemResponse("Unauthorized"),
      403: problemResponse("Forbidden"),
      404: problemResponse("Not found"),
      409: problemResponse("Conflict"),
      500: problemResponse("Internal server error"),
    },
    security: [{ AuthToken: [], AccessToken: [] }],
    "x-sdkwork-owner": surface.sdkOwner,
    "x-sdkwork-api-authority": surface.authorityName,
    "x-sdkwork-domain": route.domain,
    "x-sdkwork-resource": route.operationId.split(".").slice(0, -1).join("."),
    "x-sdkwork-request-context": "AppRequestContext",
    "x-sdkwork-server-request-id": true,
    "x-sdkwork-source": relativeForOpenApi(route.sourcePath),
  };

  if (usesJsonBody(route.method)) {
    operation.requestBody = {
      required: route.method !== "patch",
      content: {
        "application/json": {
          schema: { $ref: requestSchemaRefForOperation(route.operationId) },
        },
      },
    };
  }

  if (isListOperation(route)) {
    operation.parameters.push(
      queryParameter("page", { type: "integer", minimum: 1, default: 1 }),
      queryParameter("page_size", { type: "integer", minimum: 1, maximum: 200, default: 20 }),
      queryParameter("cursor", { type: "string" }),
      queryParameter("sort", { type: "string" }),
      queryParameter("q", { type: "string" }),
    );
  }

  return operation;
}

function buildSchemas() {
  return {
    VoiceApiResult: {
      type: "object",
      additionalProperties: false,
      required: ["code", "message", "requestId", "data"],
      properties: {
        code: { type: "string" },
        message: { type: "string" },
        requestId: {
          type: "string",
          format: "uuid",
          description: "Server-owned request correlation id.",
        },
        data: {
          type: "object",
          additionalProperties: true,
        },
      },
    },
    VoiceOperationCommand: {
      type: "object",
      additionalProperties: true,
      description: "Operation-specific command payload for SDKWork Voice administrative operations and provider extension commands.",
      properties: {
        mediaResource: { $ref: "#/components/schemas/MediaResource" },
      },
    },
    VoiceOperationType: {
      type: "string",
      enum: [
        "speech",
        "transcription",
        "translation",
        "sound_effect",
        "music",
        "realtime_transcription",
        "realtime_translation",
      ],
    },
    VoiceTaskStatus: {
      type: "string",
      enum: [
        "queued",
        "routing",
        "submitted",
        "running",
        "succeeded",
        "failed",
        "cancelled",
        "expired",
        "needs_review",
      ],
    },
    VoiceProviderOptions: {
      type: "object",
      additionalProperties: true,
      properties: {
        providerCode: { type: "string", maxLength: 64 },
        providerRouteId: { type: "string" },
        providerOptions: {
          type: "object",
          additionalProperties: true,
        },
      },
    },
    VoiceSpeechCreateCommand: {
      type: "object",
      additionalProperties: false,
      required: ["input", "model", "voice"],
      properties: {
        input: {
          oneOf: [
            { type: "string", minLength: 1 },
            { type: "array", minItems: 1, items: { type: "string" } },
          ],
        },
        model: { type: "string", maxLength: 128 },
        voice: { type: "string", maxLength: 128 },
        responseFormat: { type: "string", enum: ["aac", "flac", "mp3", "opus", "pcm", "wav"] },
        speed: { type: "number", minimum: 0.25, maximum: 4 },
        instructions: { type: "string" },
        idempotencyKey: { type: "string", maxLength: 128 },
        callbackUrl: { type: "string", format: "uri" },
        provider: { $ref: "#/components/schemas/VoiceProviderOptions" },
        metadata: { type: "object", additionalProperties: true },
      },
    },
    VoiceTranscriptionCreateCommand: {
      type: "object",
      additionalProperties: false,
      required: ["file", "model"],
      properties: {
        file: { $ref: "#/components/schemas/MediaResource" },
        model: { type: "string", maxLength: 128 },
        language: { type: "string", maxLength: 32 },
        prompt: { type: "string" },
        responseFormat: { type: "string", enum: ["json", "text", "srt", "verbose_json", "vtt"] },
        timestampGranularities: {
          type: "array",
          items: { type: "string", enum: ["word", "segment"] },
        },
        idempotencyKey: { type: "string", maxLength: 128 },
        callbackUrl: { type: "string", format: "uri" },
        provider: { $ref: "#/components/schemas/VoiceProviderOptions" },
        metadata: { type: "object", additionalProperties: true },
      },
    },
    VoiceTranslationCreateCommand: {
      type: "object",
      additionalProperties: false,
      required: ["file", "model"],
      properties: {
        file: { $ref: "#/components/schemas/MediaResource" },
        model: { type: "string", maxLength: 128 },
        sourceLanguage: { type: "string", maxLength: 32 },
        targetLanguage: { type: "string", maxLength: 32 },
        prompt: { type: "string" },
        responseFormat: { type: "string", enum: ["json", "text", "srt", "verbose_json", "vtt"] },
        idempotencyKey: { type: "string", maxLength: 128 },
        callbackUrl: { type: "string", format: "uri" },
        provider: { $ref: "#/components/schemas/VoiceProviderOptions" },
        metadata: { type: "object", additionalProperties: true },
      },
    },
    VoiceSoundEffectCreateCommand: {
      type: "object",
      additionalProperties: false,
      required: ["prompt", "model"],
      properties: {
        prompt: { type: "string", minLength: 1 },
        model: { type: "string", maxLength: 128 },
        durationSeconds: { type: "number", minimum: 0.1, maximum: 120 },
        loop: { type: "boolean" },
        promptInfluence: { type: "number", minimum: 0, maximum: 1 },
        responseFormat: { type: "string", enum: ["mp3", "wav"] },
        idempotencyKey: { type: "string", maxLength: 128 },
        callbackUrl: { type: "string", format: "uri" },
        provider: { $ref: "#/components/schemas/VoiceProviderOptions" },
        metadata: { type: "object", additionalProperties: true },
      },
    },
    VoiceMusicCreateCommand: {
      type: "object",
      additionalProperties: false,
      required: ["prompt", "model"],
      properties: {
        prompt: { type: "string", minLength: 1 },
        model: { type: "string", maxLength: 128 },
        title: { type: "string", maxLength: 256 },
        tags: { type: "string", maxLength: 512 },
        negativeTags: { type: "string", maxLength: 512 },
        durationSeconds: { type: "number", minimum: 1, maximum: 600 },
        instrumental: { type: "boolean" },
        idempotencyKey: { type: "string", maxLength: 128 },
        callbackUrl: { type: "string", format: "uri" },
        provider: { $ref: "#/components/schemas/VoiceProviderOptions" },
        metadata: { type: "object", additionalProperties: true },
      },
    },
    VoiceProviderWebhookEventCommand: {
      type: "object",
      additionalProperties: true,
      required: ["payload"],
      properties: {
        eventId: { type: "string", maxLength: 128 },
        providerTaskId: { type: "string", maxLength: 128 },
        signature: { type: "string" },
        payload: { type: "object", additionalProperties: true },
      },
    },
    VoiceTask: {
      type: "object",
      additionalProperties: false,
      required: ["id", "operationType", "status", "createdAt", "updatedAt"],
      properties: {
        id: { type: "string" },
        operationType: { $ref: "#/components/schemas/VoiceOperationType" },
        status: { $ref: "#/components/schemas/VoiceTaskStatus" },
        progress: { type: "integer", minimum: 0, maximum: 100 },
        providerCode: { type: "string" },
        providerTaskId: { type: "string" },
        model: { type: "string" },
        artifacts: {
          type: "array",
          items: { $ref: "#/components/schemas/VoiceArtifact" },
        },
        errorCode: { type: "string" },
        errorMessage: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
        completedAt: { type: "string", format: "date-time" },
      },
    },
    VoiceTaskEvent: {
      type: "object",
      additionalProperties: false,
      required: ["id", "taskId", "eventType", "createdAt"],
      properties: {
        id: { type: "string" },
        taskId: { type: "string" },
        eventType: { type: "string" },
        fromStatus: { $ref: "#/components/schemas/VoiceTaskStatus" },
        toStatus: { $ref: "#/components/schemas/VoiceTaskStatus" },
        providerEventId: { type: "string" },
        providerTaskId: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
      },
    },
    VoiceArtifact: {
      type: "object",
      additionalProperties: false,
      required: ["id", "taskId", "kind", "mediaResource"],
      properties: {
        id: { type: "string" },
        taskId: { type: "string" },
        kind: { type: "string", enum: ["audio", "transcript", "translation", "sfx", "music", "image", "video"] },
        artifactIndex: { type: "integer", minimum: 0 },
        providerCode: { type: "string" },
        providerAssetId: { type: "string" },
        durationSeconds: { type: "number", minimum: 0 },
        transcriptText: { type: "string" },
        translationText: { type: "string" },
        mediaResource: { $ref: "#/components/schemas/MediaResource" },
        driveSync: { $ref: "#/components/schemas/VoiceArtifactDriveSync" },
      },
    },
    VoiceArtifactDriveSyncStatus: {
      type: "string",
      enum: ["pending_upload", "uploading", "uploaded", "failed", "skipped", "deleted"],
    },
    VoiceArtifactDriveSync: {
      type: "object",
      additionalProperties: false,
      required: ["syncNo", "taskId", "artifactId", "artifactIndex", "actorType", "driveSpaceType", "status"],
      properties: {
        syncNo: { type: "string" },
        taskId: { type: "string" },
        artifactId: { type: "string" },
        artifactIndex: { type: "integer", minimum: 0 },
        actorType: { type: "string", enum: ["anonymous", "system", "user"] },
        userId: { type: "string" },
        anonymousId: { type: "string" },
        driveSpaceType: {
          type: "string",
          enum: ["ai_generated", "app_upload", "app", "personal", "team", "knowledge_base"],
        },
        driveSpaceId: { type: "string" },
        driveNodeId: { type: "string" },
        driveUploadItemId: { type: "string" },
        driveUploadSessionId: { type: "string" },
        driveResource: { type: "object", additionalProperties: true },
        status: { $ref: "#/components/schemas/VoiceArtifactDriveSyncStatus" },
        errorCode: { type: "string" },
        errorMessage: { type: "string" },
      },
    },
    MediaResource: {
      type: "object",
      additionalProperties: false,
      required: ["id", "kind", "mimeType", "uri"],
      properties: {
        id: { type: "string" },
        kind: { type: "string", enum: ["audio", "voice", "image", "video"] },
        mimeType: { type: "string" },
        uri: { type: "string" },
        title: { type: "string" },
        durationMs: { type: "integer", minimum: 0 },
        sizeBytes: {
          type: "string",
          pattern: "^[0-9]+$",
          description: "Int64-compatible byte size serialized as a string.",
          "x-sdkwork-int64-string": true,
        },
        metadata: {
          type: "object",
          additionalProperties: true,
        },
      },
    },
    ProblemDetail: {
      type: "object",
      additionalProperties: true,
      required: ["type", "title", "status"],
      properties: {
        type: { type: "string", format: "uri-reference" },
        title: { type: "string" },
        status: { type: "integer", minimum: 100, maximum: 599 },
        detail: { type: "string" },
        instance: { type: "string" },
        code: { type: "string" },
        traceId: { type: "string" },
        requestId: {
          type: "string",
          format: "uuid",
          description: "Server-owned request correlation id.",
        },
        errors: {
          type: "array",
          items: { $ref: "#/components/schemas/FieldError" },
        },
      },
    },
    FieldError: {
      type: "object",
      additionalProperties: false,
      required: ["field", "message"],
      properties: {
        field: { type: "string" },
        message: { type: "string" },
        code: { type: "string" },
      },
    },
  };
}

function jsonResponse(description, schemaRef) {
  return {
    description,
    content: {
      "application/json": {
        schema: { $ref: schemaRef },
      },
    },
  };
}

function problemResponse(description) {
  return {
    description,
    content: {
      "application/problem+json": {
        schema: { $ref: "#/components/schemas/ProblemDetail" },
      },
    },
  };
}

function extractPathParameters(path) {
  const parameters = [];
  for (const match of path.matchAll(/\{([^}]+)\}/g)) {
    parameters.push({
      name: match[1],
      in: "path",
      required: true,
      schema: { type: "string" },
    });
  }
  return parameters;
}

function queryParameter(name, schema) {
  return {
    name,
    in: "query",
    required: false,
    schema,
  };
}

function usesJsonBody(method) {
  return method === "post" || method === "put" || method === "patch";
}

function requestSchemaRefForOperation(operationId) {
  switch (operationId) {
    case "speech.create":
      return "#/components/schemas/VoiceSpeechCreateCommand";
    case "transcriptions.create":
      return "#/components/schemas/VoiceTranscriptionCreateCommand";
    case "translations.create":
      return "#/components/schemas/VoiceTranslationCreateCommand";
    case "soundEffects.create":
      return "#/components/schemas/VoiceSoundEffectCreateCommand";
    case "music.create":
      return "#/components/schemas/VoiceMusicCreateCommand";
    case "providerWebhooks.accept":
      return "#/components/schemas/VoiceProviderWebhookEventCommand";
    default:
      return "#/components/schemas/VoiceOperationCommand";
  }
}

function isListOperation(route) {
  return route.method === "get" && route.operationId.endsWith(".list");
}

function compareRoutes(left, right) {
  return left.path.localeCompare(right.path) || left.method.localeCompare(right.method);
}

function toLowerCamel(value) {
  const parts = String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return "api";
  }
  const [first, ...rest] = parts;
  return [
    first.charAt(0).toLowerCase() + first.slice(1),
    ...rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1)),
  ].join("");
}

function toTitle(value) {
  return String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

function relativeForOpenApi(path) {
  return path.replace(voiceRoot, "<sdkwork-voice>").replace(/\\/g, "/");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
