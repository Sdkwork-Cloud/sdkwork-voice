import { describe, expect, expectTypeOf, it } from "vitest";
import type {
  VoiceLocalApiCapability,
  VoiceLocalApiProxyConfig,
  VoiceLocalApiProxyMode,
  VoiceLocalApiProxyModelBinding,
  VoiceProxyUpstreamIdentity,
  VoiceRouteCapabilityBinding,
} from "../src/index.ts";
import {
  VOICE_LOCAL_API_PROXY_DEFAULT_POSTGRES_SCHEMA,
  VOICE_LOCAL_API_PROXY_DEFAULT_SQLITE_FILENAME,
  VOICE_LOCAL_API_PROXY_TABLE_PREFIX,
  buildVoiceLocalApiProxyPostgresqlSchema,
  buildVoiceLocalApiProxySqliteSchema,
  createDefaultVoiceLocalApiProxyConfig,
  createVoiceLocalApiProxyOperationCatalog,
  createVoiceLocalApiProxyRouteGroups,
  createVoiceLocalApiProxySchemaTableNames,
  findVoiceLocalApiProxyOperation,
  listVoiceLocalApiProxyOperationsByCapability,
  normalizeVoiceLocalApiProxyConfig,
  voiceLocalApiProxyPackageMeta,
} from "../src/index.ts";

describe("@sdkwork/voice-local-api-proxy", () => {
  it("is owned by sdkwork-voice and exposes only voice/audio proxy capabilities", () => {
    expect(voiceLocalApiProxyPackageMeta).toMatchObject({
      domain: "voice",
      package: "@sdkwork/voice-local-api-proxy",
      workspace: "sdkwork-voice",
    });

    expectTypeOf<VoiceLocalApiProxyMode>().toEqualTypeOf<"desktop-local" | "server-managed">();
    expectTypeOf<VoiceLocalApiCapability>().toEqualTypeOf<
      | "audio-speech"
      | "audio-transcription"
      | "audio-translation"
      | "audio-sound-effect"
      | "audio-music"
      | "audio-realtime-transcription"
      | "audio-realtime-translation"
    >();
    expectTypeOf<VoiceRouteCapabilityBinding["capability"]>().toEqualTypeOf<VoiceLocalApiCapability>();
    expectTypeOf<VoiceLocalApiProxyModelBinding["role"]>().toEqualTypeOf<
      "speech" | "transcription" | "translation" | "sound-effect" | "music" | "realtime" | "custom"
    >();
    expectTypeOf<VoiceProxyUpstreamIdentity["protocolKind"]>().toEqualTypeOf<
      "openai-compatible" | "azure-openai" | "claw-router" | "custom-http"
    >();
  });

  it("normalizes voice proxy route config with voice defaults", () => {
    const config = createDefaultVoiceLocalApiProxyConfig({
      storage: {
        dialect: "sqlite",
        sqlitePath: "C:/sdkwork/data/voice-local-api-proxy.db",
      },
      routes: [
        {
          capabilities: [
            {
              capability: "audio-speech",
              operationSet: [" openai.v1.audio.speech.create ", "openai.v1.audio.speech.create", ""],
            },
          ],
          clientProtocol: "openai-compatible",
          exposures: [
            { consumerId: " SDKWork Voice ", enabled: true, label: " SDKWork Voice ", target: "custom" },
            { consumerId: "sdkwork-voice", enabled: true, target: "custom" },
          ],
          id: " Voice Runtime / Primary ",
          modelBindings: [{ capability: "audio-speech", modelId: "tts-1", role: "speech" }],
          providerId: "openai",
          tags: [" voice ", "openai", "voice"],
          upstream: {
            baseUrl: "https://api.openai.com/v1/ ",
            credentialRef: " keychain:openai/default ",
            protocolKind: "openai-compatible",
            providerId: "openai",
          },
          upstreamProtocol: "openai-compatible",
        },
      ],
    });

    expect(VOICE_LOCAL_API_PROXY_TABLE_PREFIX).toBe("vlap_");
    expect(VOICE_LOCAL_API_PROXY_DEFAULT_SQLITE_FILENAME).toBe("voice-local-api-proxy.db");
    expect(config.bind).toEqual({
      host: "127.0.0.1",
      port: 21381,
      publicBaseUrl: "http://127.0.0.1:21381",
    });
    expect(config.routes[0]).toMatchObject({
      id: "voice-runtime-primary",
      modelBindings: [{ capability: "audio-speech", modelId: "tts-1", role: "speech" }],
      tags: ["voice", "openai"],
      upstream: {
        baseUrl: "https://api.openai.com/v1",
        credentialRef: "keychain:openai/default",
      },
    });
    expect(config.routes[0]?.capabilities).toEqual([
      {
        capability: "audio-speech",
        enabled: true,
        operationSet: ["openai.v1.audio.speech.create"],
        streaming: false,
      },
    ]);
  });

  it("registers speech, transcription, translation, sound-effect, music, realtime, and provider task operations", () => {
    expect(createVoiceLocalApiProxyOperationCatalog().map((operation) => operation.id)).toEqual([
      "openai.v1.audio.speech.create",
      "openai.v1.audio.transcriptions.create",
      "openai.v1.audio.translations.create",
      "openai.v1.realtime.transcription_sessions.create",
      "openai.v1.realtime.translations.create",
      "suno.v1.music.generations.create",
      "suno.v1.music.generations.retrieve",
      "elevenlabs.v1.sound_generation.create",
      "volcengine.api.v3.contents.generations.tasks.create",
      "volcengine.api.v3.contents.generations.tasks.retrieve",
    ]);
    expect(findVoiceLocalApiProxyOperation("openai.v1.audio.transcriptions.create")).toMatchObject({
      capability: "audio-transcription",
      groupId: "voice-audio",
      pathPattern: "/v1/audio/transcriptions",
    });
    expect(listVoiceLocalApiProxyOperationsByCapability("audio-translation")).toEqual([
      {
        capability: "audio-translation",
        consumerProtocol: "openai-compatible",
        groupId: "voice-audio",
        id: "openai.v1.audio.translations.create",
        method: "POST",
        pathPattern: "/v1/audio/translations",
        probeSupport: true,
        streaming: false,
      },
    ]);
    expect(createVoiceLocalApiProxyRouteGroups()).toEqual([
      {
        capabilityFamilies: [
          "audio-speech",
          "audio-transcription",
          "audio-translation",
          "audio-sound-effect",
          "audio-music",
          "audio-realtime-transcription",
          "audio-realtime-translation",
        ],
        id: "voice-audio",
        operationIds: [
          "openai.v1.audio.speech.create",
          "openai.v1.audio.transcriptions.create",
          "openai.v1.audio.translations.create",
          "openai.v1.realtime.transcription_sessions.create",
          "openai.v1.realtime.translations.create",
          "suno.v1.music.generations.create",
          "suno.v1.music.generations.retrieve",
          "elevenlabs.v1.sound_generation.create",
          "volcengine.api.v3.contents.generations.tasks.create",
          "volcengine.api.v3.contents.generations.tasks.retrieve",
        ],
      },
    ]);
  });

  it("builds voice-specific sqlite and postgresql schema", () => {
    expect(createVoiceLocalApiProxySchemaTableNames()).toEqual([
      "vlap_schema_migrations",
      "vlap_config",
      "vlap_routes",
      "vlap_route_capabilities",
      "vlap_request_logs",
      "vlap_generation_tasks",
      "vlap_task_events",
      "vlap_audio_artifacts",
      "vlap_provider_webhook_events",
    ]);

    const sqlite = buildVoiceLocalApiProxySqliteSchema({
      dialect: "sqlite",
      sqlitePath: "C:/sdkwork/data/voice-local-api-proxy.db",
    });
    const sqliteDdl = sqlite.statements.join("\n");
    expect(sqlite.databasePath).toBe("C:/sdkwork/data/voice-local-api-proxy.db");
    expect(sqliteDdl).toContain("CREATE TABLE IF NOT EXISTS vlap_audio_artifacts");
    expect(sqliteDdl).toContain("CREATE TABLE IF NOT EXISTS vlap_generation_tasks");
    expect(sqliteDdl).toContain("provider_task_id TEXT");
    expect(sqliteDdl).toContain("CREATE INDEX IF NOT EXISTS idx_vlap_generation_tasks_status");
    expect(sqliteDdl).toContain("media_resource_json TEXT NOT NULL");

    const postgresql = buildVoiceLocalApiProxyPostgresqlSchema({
      dialect: "postgresql",
      postgresUrl: "postgres://localhost:5432/voice_local_api_proxy",
    });
    const pgDdl = postgresql.statements.join("\n");
    expect(VOICE_LOCAL_API_PROXY_DEFAULT_POSTGRES_SCHEMA).toBe("voice_local_api_proxy");
    expect(postgresql.schemaName).toBe("voice_local_api_proxy");
    expect(pgDdl).toContain("CREATE SCHEMA IF NOT EXISTS voice_local_api_proxy;");
    expect(pgDdl).toContain("CREATE TABLE IF NOT EXISTS voice_local_api_proxy.vlap_audio_artifacts");
    expect(pgDdl).toContain("CREATE TABLE IF NOT EXISTS voice_local_api_proxy.vlap_generation_tasks");
    expect(pgDdl).toContain("provider_task_id TEXT");
    expect(pgDdl).toContain("media_resource_json JSONB NOT NULL");
  });

  it("keeps VoiceLocalApiProxyConfig assignable with a canonical audio route", () => {
    const config: VoiceLocalApiProxyConfig = normalizeVoiceLocalApiProxyConfig({
      mode: "desktop-local",
      routes: [
        {
          capabilities: [
            {
              capability: "audio-transcription",
              operationSet: ["openai.v1.audio.transcriptions.create"],
            },
          ],
          clientProtocol: "openai-compatible",
          id: "transcription",
          modelBindings: [{ capability: "audio-transcription", modelId: "whisper-1", role: "transcription" }],
          providerId: "openai",
          upstream: {
            baseUrl: "https://api.openai.com/v1",
            protocolKind: "openai-compatible",
            providerId: "openai",
          },
          upstreamProtocol: "openai-compatible",
        },
      ],
      storage: {
        dialect: "sqlite",
        sqlitePath: `C:/sdkwork/data/${VOICE_LOCAL_API_PROXY_DEFAULT_SQLITE_FILENAME}`,
      },
    });

    expect(config.routes[0]?.capabilities[0]?.capability).toBe("audio-transcription");
    expect(config.routes[0]?.modelBindings[0]?.role).toBe("transcription");
  });

  it("keeps sound-effect and music route capabilities normalized", () => {
    const config = normalizeVoiceLocalApiProxyConfig({
      routes: [
        {
          capabilities: [
            {
              capability: "audio-sound-effect",
              operationSet: ["elevenlabs.v1.sound_generation.create"],
            },
            {
              capability: "audio-music",
              operationSet: ["suno.v1.music.generations.create", "suno.v1.music.generations.retrieve"],
            },
          ],
          clientProtocol: "custom-http",
          id: "voice-generation-provider",
          modelBindings: [
            { capability: "audio-sound-effect", modelId: "eleven_text_to_sound_v2", role: "sound-effect" },
            { capability: "audio-music", modelId: "suno-v5", role: "music" },
          ],
          providerId: "claw-router",
          upstream: {
            baseUrl: "http://localhost:8080",
            protocolKind: "custom-http",
            providerId: "claw-router",
          },
          upstreamProtocol: "custom-http",
        },
      ],
      storage: {
        dialect: "sqlite",
        sqlitePath: `C:/sdkwork/data/${VOICE_LOCAL_API_PROXY_DEFAULT_SQLITE_FILENAME}`,
      },
    });

    expect(config.routes[0]?.capabilities.map((capability) => capability.capability)).toEqual([
      "audio-sound-effect",
      "audio-music",
    ]);
    expect(config.routes[0]?.modelBindings.map((binding) => binding.role)).toEqual(["sound-effect", "music"]);
  });
});
