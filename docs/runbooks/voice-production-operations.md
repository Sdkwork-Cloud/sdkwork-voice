# Voice Production Operations

Status: active
Owner: voice-platform
Updated: 2026-06-30

## Startup Order

1. Bootstrap voice database: `pnpm db:bootstrap`
2. Start API gateway: `cargo run -p sdkwork-voice-standalone-gateway`
3. Start generation worker (`@sdkwork/voice-generation-worker`)
4. Start drive sync worker (`@sdkwork/voice-drive-sync-worker`) when Drive DB is configured

## Monitoring Checklist

- HTTP `/health` returns 200
- `voice_generation_task` queue depth (`status=queued`) stable under load
- `voice_artifact_drive_sync` rows not stuck in `uploading` or `failed`
- Provider webhook events processed (`processing_status` not permanently `failed`)

## Common Incidents

| Symptom | Likely cause | Action |
| --- | --- | --- |
| Tasks stay `queued` | Generation worker down or provider unavailable | Restart worker; check provider routes and claw-router |
| Drive sync `failed` | Missing `source_uri`, Drive DB down, or object store path | Inspect sync row error; verify `DRIVE_DATABASE_URL` and `VOICE_DRIVE_OBJECT_STORE_ROOT` |
| Webhook 401/403 | HMAC mismatch | Align `VOICE_WEBHOOK_SECRET` with provider; avoid `VOICE_WEBHOOK_DEV_MODE` in production |
| API 5xx on boot | Database not migrated | Run `pnpm db:bootstrap` and `pnpm db:drift:check` |

## Rollback

- API: redeploy previous gateway binary; database migrations are forward-only — do not drop production tables
- Workers: stop workers first to prevent duplicate reconcile; redeploy worker package version aligned with backend SDK

## Verification Before Release

```powershell
pnpm verify
node ../sdkwork-specs/tools/check-api-response-envelope.mjs --workspace .
```
