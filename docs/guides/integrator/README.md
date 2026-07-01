# Integrator Guide

Voice integration must use generated SDK families under `sdks/` — not raw HTTP or manual auth header wiring.

## SDK Families

| Family | Authority | Consumer |
| --- | --- | --- |
| App API | `sdks/sdkwork-voice-app-sdk/` | Client apps, PC embed surfaces |
| Backend API | `sdks/sdkwork-voice-backend-sdk/` | Workers, admin tools, platform services |

Materializer: `sdks/materialize-voice-v3-openapi-boundaries.mjs` (SdkWork v3 envelope).

## Response Contract

- Success: `{ "code": 0, "data": <payload>, "traceId": "<uuid>" }`
- Errors: HTTP 4xx/5xx `application/problem+json` with numeric `code` and `traceId`
- Lists: `data.items` + `data.pageInfo`
- Commands: `data.accepted`

Generated SDKs unwrap `data` by default; use `.raw` when the full envelope is required.

## Auth

- App/backend protected routes: dual-token (`Authorization` + `Access-Token`)
- Provider webhooks: public ingress with `X-Voice-Webhook-Signature` HMAC

## Async Integration

1. App API create → task `queued`
2. Generation worker → `tasks.reconcile` with `providerResult`
3. Drive sync worker → `artifactDriveSync.retry` when `sync_status=pending_upload`

See [TECH_ARCHITECTURE.md](../../architecture/tech/TECH_ARCHITECTURE.md), `../../../sdkwork-specs/API_SPEC.md` sections 14–16, and `SDK_SPEC.md`.
