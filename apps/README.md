# apps/

Application: voice
Status: active
Owner: SDKWork maintainers
Specs: APPLICATION_SPEC.md, APP_PC_ARCHITECTURE_SPEC.md, SDKWORK_WORKSPACE_SPEC.md

## Primary App Surface

Runnable PC application root: `apps/sdkwork-voice-pc/`.

## Directory Index

| Directory | Surface role | Runnable | Purpose | Entry |
| --- | --- | --- | --- | --- |
| `sdkwork-voice-common/` | Shared TS packages | no | Contracts, provider adapter, generation/drive workers | `packages/sdkwork-voice-contracts`, `packages/sdkwork-voice-generation-worker` |
| `sdkwork-voice-pc/` | PC React embed host | partial | Voice market and speech synthesis embed packages consumed by IM PC shell | `packages/sdkwork-voice-pc-market`, `packages/sdkwork-voice-pc-speech` |

## Embed Packages

- `@sdkwork/voice-contracts`, `@sdkwork/voice-provider-adapter` — shared contracts and provider adapter (`sdkwork-voice-common/`)
- `@sdkwork/voice-generation-worker`, `@sdkwork/voice-drive-sync-worker` — async backend workers (`sdkwork-voice-common/`)
- `@sdkwork/voice-pc-market` — voice market catalog and clone UI
- `@sdkwork/voice-pc-speech` — TTS / speech synthesis UI
- `sdkwork-voice-pc-core` — host session and SDK port wiring
- `sdkwork-voice-pc-commons` — shared UI utilities

IM PC integrates through `voicePcIntegration` and shell lazy loaders, matching Drive/Knowledgebase embed patterns.

## Related Specs

- `../../sdkwork-specs/APPLICATION_SPEC.md`
- `../../sdkwork-specs/APP_PC_ARCHITECTURE_SPEC.md`
- `../../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`
