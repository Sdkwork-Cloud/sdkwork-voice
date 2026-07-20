# Voice Production Operations

Status: active
Owner: voice-platform
Updated: 2026-07-04

## Startup Order

1. Bootstrap voice database: `pnpm db:bootstrap`
2. Start API gateway: `cargo run -p sdkwork-api-voice-standalone-gateway`
3. Start generation worker (`@sdkwork/voice-generation-worker`)
4. Start drive sync worker (`@sdkwork/voice-drive-sync-worker`) when Drive DB is configured

## Health & Metrics

| Probe | Path | Expected |
| --- | --- | --- |
| Liveness | `/healthz` | HTTP 200 while process is running |
| Readiness | `/readyz` | HTTP 200 when voice DB pool answers `SELECT 1` |
| Metrics | `/metrics` | Prometheus text from sdkwork-web-bootstrap |

Kubernetes / deploy.yaml: use `/healthz` for liveness and `/readyz` for readiness. Do not use legacy `/health`.

## Monitoring Checklist

- `/readyz` returns 200 after DB bootstrap
- `/metrics` scraped by observability stack (request counts, latency)
- `voice_generation_task` queue depth (`status=queued`) stable under load; alert if > 100 for 10m
- `voice_artifact_drive_sync` rows not stuck in `uploading` (> 30m) or `failed` (> 50 rows)
- Provider webhook events processed (`processing_status` not permanently `failed`)
- Request logs: `insert_request_log` on app/backend operations; `trace_id` matches HTTP envelope `traceId`

## Backup & DR

- **Database:** PostgreSQL PITR / daily snapshots via platform DB ops; RPO ≤ 15m, RTO ≤ 60m for voice API + workers
- **Object store:** `VOICE_DRIVE_OBJECT_STORE_ROOT` backed up with Drive platform policy
- **Secrets:** `VOICE_WEBHOOK_SECRET`, DB URLs in secret manager only
- **Rollback:** redeploy previous gateway binary; migrations are forward-only — do not drop production tables

## Common Incidents

| Symptom | Likely cause | Action |
| --- | --- | --- |
| `/readyz` 503 | DB down or not migrated | Run `pnpm db:bootstrap`; verify `VOICE_DATABASE_URL` |
| Tasks stay `queued` | Generation worker down or provider unavailable | Restart worker; check provider routes and claw-router |
| Drive sync `failed` | Missing `source_uri`, Drive DB down, or object store path | Inspect sync row error; verify `DRIVE_DATABASE_URL` and `VOICE_DRIVE_OBJECT_STORE_ROOT` |
| Webhook 401/403 | HMAC mismatch | Align `VOICE_WEBHOOK_SECRET` with provider; avoid `VOICE_WEBHOOK_DEV_MODE` in production |
| API 5xx on boot | Database not migrated | Run `pnpm db:bootstrap` and `pnpm db:drift:check` |

## Rollback

- API: redeploy previous gateway binary or container image tag
- Workers: stop workers first to prevent duplicate reconcile; redeploy worker package version aligned with backend SDK

## Container

Build and run from repository root — see [deployments/docker/README.md](../../deployments/docker/README.md).

Run migrations before first serve (or rely on `VOICE_DATABASE_AUTO_MIGRATE=true` at bootstrap):

```powershell
sdkwork-api-voice-standalone-gateway db-migrate
```

## Verification Before Release

```powershell
pnpm verify
node ../sdkwork-specs/tools/check-api-response-envelope.mjs --workspace .
```
