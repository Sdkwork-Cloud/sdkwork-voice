export interface VoiceRouteSource {
  owner: "sdkwork-voice";
  domain: "voice";
  packageName: "sdkwork-routes-voice-app-api" | "sdkwork-routes-voice-backend-api";
  surface: "app-api" | "backend-api";
  apiAuthority: "sdkwork-voice-app-api" | "sdkwork-voice-backend-api";
  sdkFamily: "sdkwork-voice-app-sdk" | "sdkwork-voice-backend-sdk";
  prefix: "/app/v3/api" | "/backend/v3/api";
  routeCrate: "sdkwork-routes-voice-app-api" | "sdkwork-routes-voice-backend-api";
  path: string;
  constructors: readonly string[];
}

export interface VoiceOpenApiSurface {
  routeSurface: "app-api" | "backend-api";
  sdkType: "app" | "backend";
  sdkOwner: "sdkwork-voice";
  familyName: "sdkwork-voice-app-sdk" | "sdkwork-voice-backend-sdk";
  authorityName: "sdkwork-voice-app-api" | "sdkwork-voice-backend-api";
  title: string;
  description: string;
  prefix: "/app/v3/api" | "/backend/v3/api";
  audience: string;
  authMode: "dual-token";
}

export interface VoiceMaterializedRoute {
  apiAuthority: "sdkwork-voice-app-api" | "sdkwork-voice-backend-api";
  domain: "voice";
  owner: "sdkwork-voice";
  sdkFamily: "sdkwork-voice-app-sdk" | "sdkwork-voice-backend-sdk";
  sourcePrefix: "/app/v3/api" | "/backend/v3/api";
  sourceRouteCrate: "sdkwork-routes-voice-app-api" | "sdkwork-routes-voice-backend-api";
  surface: "app-api" | "backend-api";
  method: "get" | "post" | "patch" | "put" | "delete";
  path: string;
  tag: "voice" | string;
  operationId: string;
  sourcePath: string;
}

export interface VoiceOpenApiOperation {
  tags: string[];
  summary: string;
  operationId: string;
  parameters: unknown[];
  responses: Record<string, unknown>;
  security: Array<Record<string, unknown[]>>;
  requestBody?: unknown;
  "x-sdkwork-owner": "sdkwork-voice";
  "x-sdkwork-api-authority": "sdkwork-voice-app-api" | "sdkwork-voice-backend-api";
  "x-sdkwork-domain": "voice";
  "x-sdkwork-resource": string;
  "x-sdkwork-request-context": "AppRequestContext";
  "x-sdkwork-server-request-id": true;
  "x-sdkwork-source": string;
  "x-sdkwork-source-route-crate": "sdkwork-routes-voice-app-api" | "sdkwork-routes-voice-backend-api";
}

export interface VoiceOpenApiDocument {
  openapi: "3.1.2";
  info: {
    title: string;
    version: string;
    description: string;
    "x-sdkwork-api-authority": string;
    "x-sdkwork-sdk-family": string;
    "x-sdkwork-audience": string;
  };
  servers: unknown[];
  tags: unknown[];
  security: Array<Record<string, unknown[]>>;
  paths: Record<string, Record<string, VoiceOpenApiOperation>>;
  components: {
    securitySchemes: Record<string, unknown>;
    schemas: {
      MediaResource: {
        type: "object";
        additionalProperties: false;
        required: string[];
        properties: Record<string, unknown>;
      };
      MediaKind: {
        type: "string";
        enum: string[];
      };
      MediaSource: {
        type: "string";
        enum: string[];
      };
      MediaAccess: {
        type: "object";
        additionalProperties: false;
        required: string[];
        properties: Record<string, unknown>;
      };
      MediaChecksum: {
        type: "object";
        additionalProperties: false;
        required: string[];
        properties: Record<string, unknown>;
      };
      MediaAiProvenance: {
        type: "object";
        additionalProperties: false;
        properties: Record<string, unknown>;
      };
      [schemaName: string]: unknown;
    };
  };
  "x-sdkwork-materialized-from": unknown[];
  "x-sdkwork-request-context": unknown;
}

export const routeSources: readonly VoiceRouteSource[];
export const surfaces: {
  app: VoiceOpenApiSurface;
  backend: VoiceOpenApiSurface;
};

export function main(): Promise<void>;
export function collectRoutes(): Promise<VoiceMaterializedRoute[]>;
export function selectRoutes(routes: readonly VoiceMaterializedRoute[], prefix: string): VoiceMaterializedRoute[];
export function writeSurfaceOpenApi(surface: VoiceOpenApiSurface, routes: readonly VoiceMaterializedRoute[]): Promise<void>;
export function writeRouteManifest(surface: VoiceOpenApiSurface, routes: readonly VoiceMaterializedRoute[]): Promise<void>;
export function buildOpenApi(surface: VoiceOpenApiSurface, routes: readonly VoiceMaterializedRoute[]): VoiceOpenApiDocument;
