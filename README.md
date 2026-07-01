# sdkwork-voice
repository-kind: application

`sdkwork-voice` owns SDKWork voice and audio capabilities end to end. It contains the voice frontend packages, shared contracts, provider adapter boundary, local API proxy contracts, Rust route and storage catalogs, OpenAPI authorities, and generated SDK outputs that belong to the voice system.

This repository was split out so `sdkwork-appbase` no longer carries voice-specific API, storage, provider routing, generation, task orchestration, webhook, or SDK responsibilities. Appbase remains a dependency boundary for generic foundations such as IAM, request context, Drive/media infrastructure, UI primitives, and non-voice communication features.

## Application Capabilities

### Professional Voice Generation

The current voice domain supports the common professional audio generation surface:

- speech synthesis / text-to-speech
- audio transcription / speech-to-text
- audio translation
- voice catalog listing/creation/retrieval
- voice consent listing/creation/retrieval/update/deletion
- sound-effect generation
- music generation
- generated image and video artifact registration for provider routes that return visual media
- generated media persistence into SDKWork Drive AI-generated space
- realtime session creation
- realtime client secret creation
- realtime call creation, accept, hangup, refer, and reject actions
- realtime transcription session creation
- realtime translation session creation
- provider task lifecycle tracking
- provider webhook ingestion and replay
- generated app/backend SDK consumption

The canonical operation model is shared across app API, backend API, provider adapter, local proxy, SDKs, and Rust storage metadata.

Operation types:

- `speech`
- `transcription`
- `translation`
- `sound_effect`
- `music`
- `realtime_session`
- `realtime_client_secret`
- `realtime_call`
- `realtime_transcription`
- `realtime_translation`

Task statuses:

- `queued`
- `routing`
- `submitted`
- `running`
- `succeeded`
- `failed`
- `cancelled`
- `expired`
- `needs_review`

### Voice PC Embed (IM Host Integration)

Application root: `apps/sdkwork-voice-pc/`

Embed packages consumed by IM PC shell (Drive/Knowledgebase pattern):

- `@sdkwork/voice-pc-market` — voice market catalog and clone UI
- `@sdkwork/voice-pc-speech` — TTS / speech synthesis UI
- `sdkwork-voice-pc-core` — host session and `@sdkwork/voice-app-sdk` port wiring
- `sdkwork-voice-pc-commons` — shared UI utilities

Legacy `packages/pc-react/content/sdkwork-audio-pc-react` (`@sdkwork/audio-pc-react`) is retired; do not add new capability work under repository-root `packages/pc-react/**`.

### Voice Shared Contracts

Package: `@sdkwork/voice-contracts`

Defines common voice and audio DTOs shared across frontend, local proxy, provider adapter, API, storage, and SDK code:

- `SdkworkVoiceMediaResource`
- `SdkworkVoiceMediaKind`
- `SdkworkVoiceOperationType`
- `SdkworkVoiceTaskStatus`
- `SdkworkVoiceProviderRouteCapability`
- `SdkworkVoiceArtifactKind`
- `SdkworkVoiceTask`
- `SdkworkVoiceArtifact`
- `SdkworkVoiceTaskEvent`
- `SdkworkVoiceProviderInvocationResult`
- `SdkworkVoiceProviderGeneratedArtifact`
- voice media source, access, checksum, and AI provenance fields
- package ownership metadata for the `sdkwork-voice` workspace

These contracts intentionally live outside `sdkwork-appbase` so voice-specific media semantics do not leak back into appbase runtime types.

### Voice Generation Worker

Package: `@sdkwork/voice-generation-worker`

Polls backend `tasks.list` for `queued` tasks, invokes `@sdkwork/voice-provider-adapter`, and applies provider output through backend `tasks.reconcile` with a typed `providerResult` payload. Artifact rows and Drive sync rows are created server-side during reconcile.

### Voice Drive Sync Worker

Package: `@sdkwork/voice-drive-sync-worker`

Polls backend `artifactDriveSync.list` for `pending_upload` / `failed` rows and invokes `artifactDriveSync.retry` so the Rust service can re-queue Drive import work against `sdkwork-voice-artifact-drive-service`.

### Voice Provider Adapter

Package: `@sdkwork/voice-provider-adapter`

Owns the common provider-routing boundary used by voice orchestration code. It is designed around `sdkwork-clawrouter` provider capabilities and avoids product-local raw provider HTTP clients.

The adapter currently supports:

- OpenAI-compatible speech through `client.audio.speech.create`
- OpenAI-compatible transcription through `client.audio.transcriptions.create`
- OpenAI-compatible translation through `client.audio.translations.create`
- OpenAI-compatible voice catalog operations through `client.audio.voices.list`, `client.audio.voices.create`, and `client.audio.voices.retrieve`
- OpenAI-compatible voice consent operations through `client.audio.voiceConsents.list`, `client.audio.voiceConsents.create`, `client.audio.voiceConsents.retrieve`, `client.audio.voiceConsents.update`, and `client.audio.voiceConsents.delete`
- OpenAI-compatible realtime session creation through `client.realtime.sessions.create`
- OpenAI-compatible realtime client secret creation through `client.realtime.clientSecrets.create`
- OpenAI-compatible realtime calls through `client.realtime.calls.create`, `client.realtime.calls.accept.create`, `client.realtime.calls.hangup.create`, `client.realtime.calls.refer.create`, and `client.realtime.calls.reject.create`
- OpenAI-compatible realtime transcription session creation through `client.realtime.transcriptionSessions.create`
- OpenAI-compatible realtime translation session creation through `client.realtime.translations.create`
- Suno-style music task creation and lookup through `client.audioSuno.v1.music.generations`
- Volcengine content generation task creation and lookup through `client.videosVolcengine.api.v3.contents.generations.tasks`
- Kling video task creation and lookup through `client.videosKling.v1.videos.generations.create` and `client.videosKling.v1.videos.generations.retrieve`
- Nano Banana and Midjourney image task creation and lookup through `client.imagesNanoBanana.v1.images.generations`, and `client.imagesMidjourney.v1.images.generations`
- Vidu image/video task creation through `client.imagesVidu.ent.v2.reference2image.create`, `client.videosVidu.ent.v2.text2video.create`, `client.videosVidu.ent.v2.img2video.create`, `client.videosVidu.ent.v2.reference2video.create`, and `client.videosVidu.ent.v2.startEnd2video.create`
- Vidu task creations lookup through `client.videosVidu.ent.v2.tasks.creations.list`
- ElevenLabs sound generation through an injected provider-route invoker, matching claw-router provider passthrough behavior

The adapter returns a normalized `SdkworkVoiceProviderInvocationResult` so the application can persist the same task and artifact state regardless of whether the provider responds synchronously, starts an async task, or later sends a webhook.

When a provider response already contains finished media, the adapter also returns `generatedArtifacts`. This is the pre-Drive import descriptor used by orchestration workers:

- synchronous generated bytes, such as OpenAI-compatible speech or ElevenLabs sound effects, are represented with stable `artifactIndex`, `sourceUri`, `mimeType`, `contentLength`, `kind`, and `mediaKind`
- hosted provider output, such as Suno track URLs or Volcengine/Kling/Nano Banana/Midjourney/Vidu generated media arrays, is represented as `external_url` or `provider_asset`
- multi-output responses preserve provider order across music, image, video, and audio artifacts so the worker creates one `voice_audio_artifact` row and one `voice_artifact_drive_sync` row per output
- final user-facing artifacts remain `SdkworkVoiceArtifact` records after task persistence assigns a task/artifact id and the Drive import updates the resource to `source = drive`

### Voice Local API Proxy

Package: `@sdkwork/voice-local-api-proxy`

Owns voice-specific local API proxy contracts:

- speech route capability
- transcription route capability
- translation route capability
- voice catalog route capability
- voice consent route capability
- sound-effect route capability
- music route capability
- generated image route capability for provider task lookup
- generated video route capability for provider task lookup
- realtime session route capability
- realtime client secret route capability
- realtime call route capability
- realtime transcription route capability
- realtime translation route capability
- OpenAI-compatible `/v1/audio/*` and `/v1/realtime/*` operation catalog
- claw-router/custom provider operation catalog
- voice route grouping and model-binding contracts
- SQLite and PostgreSQL schema builders for voice local proxy state
- local task/event/webhook tables for provider-state consistency
- proxy config normalization and defaults

Local proxy operation catalog:

| Operation | Method | Path Pattern |
| --- | --- | --- |
| `openai.v1.audio.speech.create` | `POST` | `/v1/audio/speech` |
| `openai.v1.audio.transcriptions.create` | `POST` | `/v1/audio/transcriptions` |
| `openai.v1.audio.translations.create` | `POST` | `/v1/audio/translations` |
| `openai.v1.audio.voices.list` | `GET` | `/v1/audio/voices` |
| `openai.v1.audio.voices.create` | `POST` | `/v1/audio/voices` |
| `openai.v1.audio.voices.retrieve` | `GET` | `/v1/audio/voices/{voice_id}` |
| `openai.v1.audio.voice_consents.list` | `GET` | `/v1/audio/voice_consents` |
| `openai.v1.audio.voice_consents.create` | `POST` | `/v1/audio/voice_consents` |
| `openai.v1.audio.voice_consents.retrieve` | `GET` | `/v1/audio/voice_consents/{consent_id}` |
| `openai.v1.audio.voice_consents.update` | `POST` | `/v1/audio/voice_consents/{consent_id}` |
| `openai.v1.audio.voice_consents.delete` | `DELETE` | `/v1/audio/voice_consents/{consent_id}` |
| `openai.v1.realtime.sessions.create` | `POST` | `/v1/realtime/sessions` |
| `openai.v1.realtime.client_secrets.create` | `POST` | `/v1/realtime/client_secrets` |
| `openai.v1.realtime.calls.create` | `POST` | `/v1/realtime/calls` |
| `openai.v1.realtime.calls.accept.create` | `POST` | `/v1/realtime/calls/{call_id}/accept` |
| `openai.v1.realtime.calls.hangup.create` | `POST` | `/v1/realtime/calls/{call_id}/hangup` |
| `openai.v1.realtime.calls.refer.create` | `POST` | `/v1/realtime/calls/{call_id}/refer` |
| `openai.v1.realtime.calls.reject.create` | `POST` | `/v1/realtime/calls/{call_id}/reject` |
| `openai.v1.realtime.transcription_sessions.create` | `POST` | `/v1/realtime/transcription_sessions` |
| `openai.v1.realtime.translations.create` | `POST` | `/v1/realtime/translations` |
| `suno.v1.music.generations.create` | `POST` | `/suno/v1/music/generations` |
| `suno.v1.music.generations.retrieve` | `GET` | `/suno/v1/music/generations/{task_id}` |
| `elevenlabs.v1.sound_generation.create` | `POST` | `/provider/elevenlabs/v1/sound-generation` |
| `volcengine.api.v3.contents.generations.tasks.create` | `POST` | `/volcengine/api/v3/contents/generations/tasks` |
| `volcengine.api.v3.contents.generations.tasks.retrieve` | `GET` | `/volcengine/api/v3/contents/generations/tasks/{task_id}` |
| `kling.v1.videos.generations.create` | `POST` | `/kling/v1/videos/generations` |
| `kling.v1.videos.generations.retrieve` | `GET` | `/kling/v1/videos/generations/{task_id}` |
| `nano-banana.v1.images.generations.create` | `POST` | `/nano-banana/v1/images/generations` |
| `nano-banana.v1.images.generations.retrieve` | `GET` | `/nano-banana/v1/images/generations/{task_id}` |
| `midjourney.v1.images.generations.create` | `POST` | `/midjourney/v1/images/generations` |
| `midjourney.v1.images.generations.retrieve` | `GET` | `/midjourney/v1/images/generations/{task_id}` |
| `vidu.ent.v2.reference2image.create` | `POST` | `/vidu/ent/v2/reference2image` |
| `vidu.ent.v2.text2video.create` | `POST` | `/vidu/ent/v2/text2video` |
| `vidu.ent.v2.img2video.create` | `POST` | `/vidu/ent/v2/img2video` |
| `vidu.ent.v2.reference2video.create` | `POST` | `/vidu/ent/v2/reference2video` |
| `vidu.ent.v2.start_end2video.create` | `POST` | `/vidu/ent/v2/start-end2video` |
| `vidu.ent.v2.tasks.creations.list` | `GET` | `/vidu/ent/v2/tasks/{task_id}/creations` |

This package is the voice counterpart to generic local API proxy functionality. Generic chat, responses, embeddings, moderation, rerank, file transfer, and vector-store proxy work remains outside this repository.

## API Authorities

The OpenAPI authorities are materialized from the Rust HTTP route catalog and are the source for SDK generation.

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
| `soundEffects.create` | `POST` | `/app/v3/api/voice/sound_effects` |
| `music.create` | `POST` | `/app/v3/api/voice/music` |
| `tasks.list` | `GET` | `/app/v3/api/voice/tasks` |
| `tasks.retrieve` | `GET` | `/app/v3/api/voice/tasks/{taskId}` |
| `tasks.cancel` | `POST` | `/app/v3/api/voice/tasks/{taskId}/cancel` |
| `taskEvents.list` | `GET` | `/app/v3/api/voice/task_events` |
| `audioAssets.list` | `GET` | `/app/v3/api/voice/audio_assets` |
| `audioAssets.retrieve` | `GET` | `/app/v3/api/voice/audio_assets/{audioAssetId}` |
| `artifactDriveSync.list` | `GET` | `/app/v3/api/voice/artifact_drive_sync` |

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
| `providerRoutes.create` | `POST` | `/backend/v3/api/voice/provider_routes` |
| `providerRoutes.list` | `GET` | `/backend/v3/api/voice/provider_routes` |
| `providerRoutes.retrieve` | `GET` | `/backend/v3/api/voice/provider_routes/{providerRouteId}` |
| `providerRoutes.update` | `PATCH` | `/backend/v3/api/voice/provider_routes/{providerRouteId}` |
| `providerRoutes.delete` | `DELETE` | `/backend/v3/api/voice/provider_routes/{providerRouteId}` |
| `tasks.list` | `GET` | `/backend/v3/api/voice/tasks` |
| `tasks.retrieve` | `GET` | `/backend/v3/api/voice/tasks/{taskId}` |
| `tasks.cancel` | `POST` | `/backend/v3/api/voice/tasks/{taskId}/cancel` |
| `tasks.retry` | `POST` | `/backend/v3/api/voice/tasks/{taskId}/retry` |
| `tasks.reconcile` | `POST` | `/backend/v3/api/voice/tasks/{taskId}/reconcile` |
| `taskEvents.list` | `GET` | `/backend/v3/api/voice/task_events` |
| `providerWebhooks.accept` | `POST` | `/backend/v3/api/voice/provider_webhooks/{providerCode}` |
| `providerWebhookEvents.list` | `GET` | `/backend/v3/api/voice/provider_webhook_events` |
| `providerWebhookEvents.replay` | `POST` | `/backend/v3/api/voice/provider_webhook_events/{eventId}/replay` |
| `webhookDeliveries.list` | `GET` | `/backend/v3/api/voice/webhook_deliveries` |
| `requestLogs.list` | `GET` | `/backend/v3/api/voice/request_logs` |
| `audioArtifacts.list` | `GET` | `/backend/v3/api/voice/audio_artifacts` |
| `audioArtifacts.retrieve` | `GET` | `/backend/v3/api/voice/audio_artifacts/{audioArtifactId}` |
| `audioArtifacts.delete` | `DELETE` | `/backend/v3/api/voice/audio_artifacts/{audioArtifactId}` |
| `artifactDriveSync.list` | `GET` | `/backend/v3/api/voice/artifact_drive_sync` |
| `artifactDriveSync.retry` | `POST` | `/backend/v3/api/voice/artifact_drive_sync/{syncId}/retry` |

The generated TypeScript SDK package is under:

- `sdks/sdkwork-voice-backend-sdk/sdkwork-voice-backend-sdk-typescript/generated/server-openapi`

Generated SDK package name:

- `@sdkwork/voice-backend-sdk`

## Task, Webhook, and Consistency Model

Providers do not all behave the same way. Some return generated audio synchronously, some return a provider task ID, and some complete through a webhook. `sdkwork-voice` normalizes those paths into the same persistence model:

- A create request records a `voice_generation_task` with idempotency metadata and normalized operation/status fields.
- Provider submission records the provider route, provider request ID, provider task ID, and provider status fields when available.
- Task status changes append `voice_task_event` rows so app clients and backend operators can query progress consistently.
- Provider callbacks are accepted through backend webhook endpoints and persisted in `voice_provider_webhook_event`.
- Downstream callback delivery attempts are tracked through `voice_webhook_delivery`.
- Generated files and textual outputs are linked through `voice_audio_artifact`; `artifact_index` preserves provider order for multi-output tasks.
- Generated binary artifacts are synchronized into Drive through `voice_artifact_drive_sync`.
- Provider calls and failures remain auditable through `voice_request_log`.

This model supports synchronous completion, async polling, cancel/retry/reconcile operations, idempotent retries, and webhook replay without moving provider-specific state back into `sdkwork-appbase`.

## Drive AI-Generated Persistence

All successfully generated binary artifacts are designed to be persisted into SDKWork Drive, including:

- speech synthesis audio
- generated sound effects
- generated music
- generated images
- generated videos

The Drive integration depends on the Rust libraries in:

- `../sdkwork-drive`

Voice owns a dedicated Rust bridge crate:

- `crates/sdkwork-voice-artifact-drive-service`

The bridge provides two persistence levels:

- upload preparation through `DriveUploaderService`, used when a provider result needs a Drive upload item/session contract
- direct byte persistence through `DriveObjectStore` plus `DriveWorkspaceService`, used when the generation worker already has the generated bytes

AI-generated content is stored in Drive spaces with `space_type = ai_generated`. The bridge supports three actor modes:

- authenticated user: `GeneratedArtifactActor::User`, stored in a user-owned AI-generated space
- anonymous user/session: `GeneratedArtifactActor::Anonymous`, stored in the app-owned anonymous AI-generated space
- system worker: `GeneratedArtifactActor::System`, stored in an app/system AI-generated space

Multi-output provider responses are modeled as one task with many artifacts. Each artifact receives a stable `artifact_index`, deterministic sync number, deterministic Drive upload item id, logical Drive path, and one row in `voice_artifact_drive_sync`. This keeps batch outputs such as "generate four images" or "generate multiple clips" queryable and retryable without losing ordering.

Runtime synchronization flow:

1. The provider adapter invokes `sdkwork-clawrouter` through generated SDK surfaces or the approved route invoker.
2. Successful provider responses are normalized into `generatedArtifacts` without leaking provider DTOs into application APIs.
3. The voice task worker creates `voice_audio_artifact` rows using the normalized `artifactIndex`, kind, provider asset id, source URI, MIME type, and media provenance.
4. The worker creates or updates matching `voice_artifact_drive_sync` rows with `pending_upload` or `uploading` status.
5. The Rust Drive bridge downloads/decodes provider bytes when needed and calls `DriveWorkspaceVoiceBytesPersister` or `DriveWorkspaceVoiceUploadExecutor`.
6. After Drive writes succeed, the sync row is updated to `uploaded`, and the business artifact media resource points at `drive://spaces/{spaceId}/nodes/{nodeId}`.

Drive sync statuses:

- `pending_upload`
- `uploading`
- `uploaded`
- `failed`
- `skipped`
- `deleted`

The app API exposes sync lookup for client progress and Drive resource rendering. The backend API adds retry support so failed Drive sync rows can be reconciled without re-running the provider generation task.

## Rust Catalogs

### Rust HTTP Service Plane

Crates: `sdkwork-voice-service`, `sdkwork-routes-voice-http-auth`, `sdkwork-voice-embedded-bootstrap`, `sdkwork-voice-drive-sync-processor`, `sdkwork-voice-standalone-gateway`

The voice HTTP plane integrates `sdkwork-web-framework` for dual-token auth, request context, and SdkWork v3 response mapping. Handlers dispatch through `sdkwork-voice-service` into SQL repositories and Drive artifact services.

Standalone server:

```powershell
cargo run -p sdkwork-voice-standalone-gateway
```

Default bind: `0.0.0.0:18096` (`VOICE_API_BIND`).

### Rust App API Route Catalog

Crate: `sdkwork-routes-voice-app-api`

Path:

- `crates/sdkwork-routes-voice-app-api`

Owns the canonical Rust route catalog used to materialize the voice app-api OpenAPI boundary:

- app route catalog
- operation IDs
- HTTP methods
- dual-token header requirement: `Authorization` and `Access-Token`

The OpenAPI materializer reads this crate as the `sdkwork-voice-app-api` route source of truth and writes a normalized route manifest under `sdks/_route-manifests/app-api/`.

### Rust Backend API Route Catalog

Crate: `sdkwork-routes-voice-backend-api`

Path:

- `crates/sdkwork-routes-voice-backend-api`

Owns the canonical Rust route catalog used to materialize the voice backend-api OpenAPI boundary:

- backend route catalog
- operation IDs
- HTTP methods
- dual-token header requirement for protected backend routes (`Authorization` and `Access-Token`)
- public provider webhook ingress with HMAC signature verification (`X-Voice-Webhook-Signature`, `VOICE_WEBHOOK_SECRET`, `VOICE_WEBHOOK_DEV_MODE`)

The OpenAPI materializer reads this crate as the `sdkwork-voice-backend-api` route source of truth and writes a normalized route manifest under `sdks/_route-manifests/backend-api/`.

### Rust Storage Schema Catalog

Crate: `sdkwork-voice-generation-repository-sqlx`

Path:

- `crates/sdkwork-voice-generation-repository-sqlx`

Owns voice database schema contracts and migration catalog:

- schema version: `2026-06-06`
- migration: `0001_voice_core.sql`
- route tables:
  - `voice_provider_route`
  - `voice_provider_route_capability`
- task tables:
  - `voice_generation_task`
  - `voice_task_event`
- artifact table:
  - `voice_audio_artifact`
- artifact Drive sync table:
  - `voice_artifact_drive_sync`
- webhook tables:
  - `voice_provider_webhook_event`
  - `voice_webhook_delivery`
- request table:
  - `voice_request_log`
- repository binding manifest:
  - `VoiceProviderRouteRepository`
  - `VoiceAudioArtifactRepository`
  - `VoiceArtifactDriveSyncRepository`
  - `VoiceGenerationTaskRepository`
  - `VoiceTaskEventRepository`
  - `VoiceProviderWebhookEventRepository`
  - `VoiceWebhookDeliveryRepository`
  - `VoiceRequestLogRepository`

The crate also exposes `SqlVoiceArtifactDriveSyncRepository` for the generated artifact import workflow:

- `insert_pending` creates one sync row per normalized provider artifact
- `mark_uploading` records Drive upload item/session state
- `mark_uploaded` records Drive space/node/resource identity after Drive persistence succeeds
- `mark_failed` stores retryable provider download or Drive persistence errors
- `list_by_task` returns sync rows in `artifact_index` order for task status queries and reconciliation

### Rust Local API Proxy Native Runtime

Crate: `sdkwork-voice-local-api-proxy-native-host`

Path:

- `crates/sdkwork-voice-local-api-proxy-native-host`

Provides native runtime support for the voice local API proxy:

- default native boundary metadata
- voice local proxy config
- upstream URL construction
- auth/header propagation behavior
- native tests for voice proxy boundary behavior

## Repository Layout

```text
apps/
  sdkwork-voice-common/
    packages/
      sdkwork-voice-contracts/
      sdkwork-voice-provider-adapter/
      sdkwork-voice-generation-worker/
      sdkwork-voice-drive-sync-worker/
  sdkwork-voice-pc/
    packages/
      sdkwork-voice-pc-market/
      sdkwork-voice-pc-speech/
      sdkwork-voice-pc-core/
      sdkwork-voice-pc-commons/
      sdkwork-voice-local-api-proxy/
crates/
  sdkwork-routes-voice-app-api/
  sdkwork-routes-voice-backend-api/
  sdkwork-routes-voice-http-auth/
  sdkwork-voice-artifact-drive-service/
  sdkwork-voice-drive-sync-processor/
  sdkwork-voice-embedded-bootstrap/
  sdkwork-voice-generation-repository-sqlx/
  sdkwork-voice-local-api-proxy-native-host/
  sdkwork-voice-service/
  sdkwork-voice-standalone-gateway/
sdks/
  materialize-voice-v3-openapi-boundaries.mjs
  _route-manifests/
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
- sound-effect generation
- music generation
- realtime transcription and realtime translation session contracts
- voice/audio provider routes
- provider task orchestration
- provider webhook ingestion and replay
- webhook delivery tracking
- voice request logs
- audio artifacts
- generated media persistence into SDKWork Drive AI-generated spaces
- Drive sync state and retry semantics for generated artifacts
- voice local API proxy config/schema
- voice-specific media resource semantics
- voice app/backend SDKs

`sdkwork-appbase` should continue to own only generic platform foundations and non-voice application capabilities.

## SDKWork Documentation Contract

Domain: communication
Capability: voice-workspace
Package type: react-package
Status: standard

### Public API

Public exports are declared in `specs/component.spec.json` under `contracts.publicExports`.

### Required SDK Surface

- None declared in `specs/component.spec.json`.

### Configuration

Configuration keys and runtime entrypoints are declared in `specs/component.spec.json`.

### SaaS/Private/Local Behavior

This module follows the canonical standards linked from `specs/component.spec.json`, including deployment and runtime configuration rules where applicable.

### Security

Do not add secrets, live tokens, manual auth headers, or app-local credential handling to this module.

### Extension Points

Extension points are limited to declared public exports, runtime entrypoints, SDK clients, events, and config keys.

### Verification

- `pnpm typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.

## Documentation Canon

- [docs/README.md](docs/README.md)
- [docs/product/prd/PRD.md](docs/product/prd/PRD.md)
- [docs/architecture/tech/TECH_ARCHITECTURE.md](docs/architecture/tech/TECH_ARCHITECTURE.md)

## Application Roots

- [apps directory index](apps/README.md)
