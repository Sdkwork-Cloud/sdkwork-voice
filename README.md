# sdkwork-voice

`sdkwork-voice` owns SDKWork voice and audio capabilities. It contains the voice frontend packages, shared contracts, local API proxy contracts, Rust route/storage/native runtime catalogs, OpenAPI authorities, and generated SDK outputs that belong to the voice system.

This repository was split out so `sdkwork-appbase` no longer carries voice-specific API, storage, provider routing, generation, or SDK responsibilities. Appbase remains a dependency boundary for generic foundations such as IAM, request context, Drive/media infrastructure, UI primitives, and non-voice communication features.

## Application Capabilities

### Audio Workspace

Package: `@sdkwork/audio-pc-react`

Provides the PC React audio capability surface:

- audio workspace contracts and package metadata
- audio generation, speech synthesis, music, and sound-effect generation helpers
- audio controller and service contracts
- audio gallery and summary UI components
- audio page composition exports
- history item mapping and voice-owned media resource integration

The package depends on `@sdkwork/voice-contracts` for media resource contracts and keeps React runtime dependencies as host-provided peer dependencies.

### Voice Shared Contracts

Package: `@sdkwork/voice-contracts`

Defines common voice and audio DTOs shared across frontend, local proxy, API, and SDK code:

- `SdkworkVoiceMediaResource`
- `SdkworkVoiceMediaKind`
- voice media source, access, checksum, and AI provenance fields
- package ownership metadata for the `sdkwork-voice` workspace

These contracts intentionally live outside `sdkwork-appbase` so voice-specific media semantics do not leak back into appbase runtime types.

### Voice Local API Proxy

Package: `@sdkwork/voice-local-api-proxy`

Owns voice-specific local API proxy contracts:

- speech route capability
- transcription route capability
- translation route capability
- OpenAI-compatible `/v1/audio/*` operation catalog
- voice route grouping and model-binding contracts
- SQLite and PostgreSQL schema builders for voice local proxy state
- proxy config normalization and defaults

This package is the voice counterpart to generic local API proxy functionality. Generic chat, responses, embeddings, moderation, rerank, file transfer, and vector-store proxy work remains outside this repository.

### Voice App API

Authority: `sdkwork-voice-app-api`

OpenAPI file:

- `sdks/sdkwork-voice-app-sdk/openapi/sdkwork-voice-app-api.openapi.yaml`

App/client operations:

| Operation | Method | Path |
| --- | --- | --- |
| `speech.create` | `POST` | `/app/v3/api/voice/speech` |
| `transcriptions.create` | `POST` | `/app/v3/api/voice/transcriptions` |
| `translations.create` | `POST` | `/app/v3/api/voice/translations` |
| `audioAssets.list` | `GET` | `/app/v3/api/voice/audio_assets` |
| `audioAssets.retrieve` | `GET` | `/app/v3/api/voice/audio_assets/{audioAssetId}` |

The generated TypeScript SDK package is under:

- `sdks/sdkwork-voice-app-sdk/sdkwork-voice-app-sdk-typescript/generated/server-openapi`

Generated SDK package name:

- `@sdkwork/voice-app-sdk`

### Voice Backend API

Authority: `sdkwork-voice-backend-api`

OpenAPI file:

- `sdks/sdkwork-voice-backend-sdk/openapi/sdkwork-voice-backend-api.openapi.yaml`

Backend/admin operations:

| Operation | Method | Path |
| --- | --- | --- |
| `providerRoutes.list` | `GET` | `/backend/v3/api/voice/provider_routes` |
| `providerRoutes.create` | `POST` | `/backend/v3/api/voice/provider_routes` |
| `providerRoutes.retrieve` | `GET` | `/backend/v3/api/voice/provider_routes/{providerRouteId}` |
| `providerRoutes.update` | `PATCH` | `/backend/v3/api/voice/provider_routes/{providerRouteId}` |
| `providerRoutes.delete` | `DELETE` | `/backend/v3/api/voice/provider_routes/{providerRouteId}` |
| `requestLogs.list` | `GET` | `/backend/v3/api/voice/request_logs` |
| `audioArtifacts.list` | `GET` | `/backend/v3/api/voice/audio_artifacts` |
| `audioArtifacts.retrieve` | `GET` | `/backend/v3/api/voice/audio_artifacts/{audioArtifactId}` |
| `audioArtifacts.delete` | `DELETE` | `/backend/v3/api/voice/audio_artifacts/{audioArtifactId}` |

The generated TypeScript SDK package is under:

- `sdks/sdkwork-voice-backend-sdk/sdkwork-voice-backend-sdk-typescript/generated/server-openapi`

Generated SDK package name:

- `@sdkwork/voice-backend-sdk`

### Rust HTTP Route Catalog

Crate: `sdkwork-voice-http-rust`

Path:

- `packages/native-rust/voice/sdkwork-voice-http-rust`

Owns the canonical Rust route catalog used to materialize voice app/backend OpenAPI boundaries:

- app route catalog
- backend route catalog
- operation IDs
- HTTP methods
- dual-token header requirement: `Authorization` and `Access-Token`

The OpenAPI materializer reads this crate as the route source of truth.

### Rust Storage Schema Catalog

Crate: `sdkwork-voice-storage-sqlx-rust`

Path:

- `packages/native-rust/voice/sdkwork-voice-storage-sqlx-rust`

Owns voice database schema contracts and migration catalog:

- schema version: `2026-06-06`
- migration: `0001_voice_core.sql`
- route tables:
  - `voice_provider_route`
  - `voice_provider_route_capability`
- artifact table:
  - `voice_audio_artifact`
- request table:
  - `voice_request_log`
- repository binding manifest:
  - `VoiceProviderRouteRepository`
  - `VoiceAudioArtifactRepository`
  - `VoiceRequestLogRepository`

### Rust Local API Proxy Native Runtime

Crate: `sdkwork-voice-local-api-proxy-native`

Path:

- `packages/native-rust/voice/sdkwork-voice-local-api-proxy-native`

Provides native runtime support for the voice local API proxy:

- default native boundary metadata
- voice local proxy config
- upstream URL construction
- auth/header propagation behavior
- native tests for voice proxy boundary behavior

## Repository Layout

```text
packages/
  common/voice/
    sdkwork-voice-contracts/
  pc-react/content/
    sdkwork-audio-pc-react/
  pc-react/voice/
    sdkwork-voice-local-api-proxy/
  native-rust/voice/
    sdkwork-voice-http-rust/
    sdkwork-voice-storage-sqlx-rust/
    sdkwork-voice-local-api-proxy-native/
sdks/
  materialize-voice-v3-openapi-boundaries.mjs
  sdkwork-voice-app-sdk/
  sdkwork-voice-backend-sdk/
scripts/
  audit-appbase-voice-migration.mjs
tests/
  appbaseVoiceMigrationAudit.test.ts
  voiceOpenApiMaterializer.test.ts
```

## SDK Generation

Materialize OpenAPI from the Rust route catalog:

```powershell
pnpm materialize:openapi
```

Generate the TypeScript app SDK:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\sdks\sdkwork-voice-app-sdk\bin\generate-sdk.ps1 -Languages typescript
```

Generate the TypeScript backend SDK:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\sdks\sdkwork-voice-backend-sdk\bin\generate-sdk.ps1 -Languages typescript
```

Validate generated SDK output:

```powershell
node .\bin\publish-core.mjs --language typescript --project-dir . --action check
node .\bin\publish-core.mjs --language typescript --project-dir . --action build
```

Run those validation commands from the generated SDK output directory:

- `sdks/sdkwork-voice-app-sdk/sdkwork-voice-app-sdk-typescript/generated/server-openapi`
- `sdks/sdkwork-voice-backend-sdk/sdkwork-voice-backend-sdk-typescript/generated/server-openapi`

## Development Commands

Install dependencies:

```powershell
pnpm install
```

Run TypeScript tests:

```powershell
pnpm test -- --run
```

Run TypeScript typecheck:

```powershell
pnpm typecheck
```

Run Rust tests:

```powershell
pnpm test:rust
```

Run the appbase migration audit:

```powershell
pnpm audit:appbase
```

Run OpenAPI materialization:

```powershell
pnpm materialize:openapi
```

## Migration Guardrails

The repository includes an appbase audit script:

- `scripts/audit-appbase-voice-migration.mjs`

It checks that `sdkwork-appbase` does not reintroduce voice-owned code or semantics such as:

- old audio PC/mobile packages
- `@sdkwork/audio-pc-react` path aliases
- `/v1/audio/*` proxy operations
- `openai.v1.audio.*` operations
- speech/transcription/translation proxy capability types
- audio/music/SFX generation config and history ownership
- TTS/music/SFX billing meters
- voice-specific model catalog capability or provider wording
- voice-specific runtime media kind

The corresponding test is:

- `tests/appbaseVoiceMigrationAudit.test.ts`

Use this guardrail before moving additional voice code out of appbase or before changing generic proxy/model/media code.

## Ownership Boundary

This repository owns voice/audio business capability. Do not add these capabilities back to `sdkwork-appbase`:

- speech generation
- transcription
- translation
- voice/audio provider routes
- voice request logs
- audio artifacts
- voice local API proxy config/schema
- voice-specific media resource semantics
- voice app/backend SDKs

`sdkwork-appbase` should continue to own only generic platform foundations and non-voice application capabilities.
