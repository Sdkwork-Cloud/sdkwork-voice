# apps/sdkwork-voice-common

Shared TypeScript packages for the voice domain: contracts, provider adapter, and async workers.

## Packages

| Package | Role |
| --- | --- |
| `@sdkwork/voice-contracts` | Shared wire types and operation constants |
| `@sdkwork/voice-provider-adapter` | Provider invocation boundary (claw-router) |
| `@sdkwork/voice-generation-worker` | Drains `queued` tasks via backend reconcile |
| `@sdkwork/voice-drive-sync-worker` | Drains `pending_upload` drive sync rows via backend retry |

Workers consume generated `@sdkwork/voice-backend-sdk` clients; they do not call raw HTTP.

## Verification

```powershell
pnpm --filter @sdkwork/voice-generation-worker typecheck
pnpm --filter @sdkwork/voice-drive-sync-worker typecheck
```
