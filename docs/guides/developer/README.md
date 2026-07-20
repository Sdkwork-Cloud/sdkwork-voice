# Developer Guide

Local development for SDKWork Voice starts from the repository root.

## Prerequisites

- Node.js 22 + pnpm 10.33
- Rust stable toolchain
- PostgreSQL (voice database; optional Drive database for artifact sync)
- Sibling SDKWork repositories checked out next to this repo (`sdkwork-specs`, `sdkwork-database`, `sdkwork-drive`, `sdkwork-web-framework`, `sdkwork-iam`, `sdkwork-utils`, `sdkwork-appbase`)

## Bootstrap

```powershell
pnpm install
pnpm install:ci-dependencies    # optional in monorepo checkout; required in isolated CI
pnpm db:bootstrap
```

## Verification

```powershell
pnpm verify
pnpm api:materialize
node ../sdkwork-specs/tools/check-api-response-envelope.mjs --workspace .
```

## Run Standalone API

```powershell
cargo run -p sdkwork-voice-standalone-gateway
```

Default bind: `0.0.0.0:18096` (`VOICE_API_BIND`).

## Async Workers

Run as separate processes with backend SDK credentials:

- `@sdkwork/voice-generation-worker` — drains `tasks.list?status=queued`
- `@sdkwork/voice-drive-sync-worker` — drains `artifactDriveSync.list?sync_status=pending_upload`

## Package Layout

| Path | Role |
| --- | --- |
| `apps/sdkwork-voice-common/packages/` | Contracts, provider adapter, workers |
| `apps/sdkwork-voice-pc/packages/` | PC embed UI and local API proxy |
| `crates/` | Rust HTTP plane, service, repository, gateway |
| `sdks/` | OpenAPI authorities and generated SDK families |

See [TECH_ARCHITECTURE.md](../../architecture/tech/TECH_ARCHITECTURE.md) and `../../../sdkwork-specs/DOCUMENTATION_SPEC.md` section 2.1.
