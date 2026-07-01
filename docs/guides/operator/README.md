# Operator Guide

Deployment, monitoring, and incident response for SDKWork Voice.

## Deployment Profiles

| Profile | Entry | Config |
| --- | --- | --- |
| Standalone server | `cargo run -p sdkwork-voice-standalone-gateway` | `deployments/deploy.yaml`, `sdkwork.app.config.json` |
| Embedded | `sdkwork-voice-embedded-bootstrap` router merge | Platform consumer wires IAM + database pools |
| Workers | `@sdkwork/voice-generation-worker`, `@sdkwork/voice-drive-sync-worker` | Backend SDK credentials, poll intervals |

## Required Environment

| Variable | Purpose |
| --- | --- |
| `VOICE_DATABASE_URL` | Voice PostgreSQL |
| `VOICE_API_BIND` | HTTP bind (default `0.0.0.0:18096`) |
| `VOICE_API_CORS_ORIGINS` | CORS allowlist |
| `VOICE_WEBHOOK_SECRET` | Provider webhook HMAC |
| `DRIVE_DATABASE_URL` | Drive DB (enables artifact byte persistence) |
| `VOICE_DRIVE_OBJECT_STORE_ROOT` | Local object store for Drive sync processor |

## Health And Readiness

- Liveness: `GET /health` on the standalone gateway
- Database: `pnpm db:status` / `pnpm db:drift:check`
- Full gate: `pnpm verify`

## Runbooks

- [Voice production operations](../../runbooks/voice-production-operations.md)

See `../../../sdkwork-specs/DOCUMENTATION_SPEC.md` section 2.
