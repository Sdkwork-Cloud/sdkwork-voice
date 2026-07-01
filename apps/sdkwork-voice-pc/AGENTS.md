# Repository Guidelines

<!-- SDKWORK-AGENTS-GENERATED: v2 -->

## SDKWORK Soul

Read `../../../sdkwork-specs/SOUL.md` before executing tasks in this application root. Follow specs before memory, dictionary before context, stop on ambiguity, and evidence before completion.

## SDKWORK Standards

Canonical SDKWORK specs path from this application root:

- `../../../sdkwork-specs/README.md`
- `../../../sdkwork-specs/SOUL.md`
- `../../../sdkwork-specs/AGENTS_SPEC.md`
- `../../../sdkwork-specs/PNPM_SCRIPT_SPEC.md`
- `../../../sdkwork-specs/CODE_STYLE_SPEC.md`
- `../../../sdkwork-specs/NAMING_SPEC.md`

Do not copy root standard text into this application root. If these relative paths do not resolve, stop and report the broken workspace layout.

## Application Identity

Read `sdkwork.app.config.json` only when changing Voice PC embed behavior, runtime config, SDK wiring, release metadata, packaging, or app-owned capabilities.

This directory is an **embed host**, not a standalone runnable shell. IM PC (`sdkwork-im-pc`) consumes `@sdkwork/voice-pc-market` and `@sdkwork/voice-pc-speech` through host integration (`voicePcIntegration.ts`).

## Local Dictionary Structure

- `AGENTS.md`: application agent entrypoint and relative SDKWork spec index.
- `sdkwork.app.config.json`: Voice PC application identity and release metadata.
- `packages/`: embed packages (`voice-pc-market`, `voice-pc-speech`, `voice-pc-core`, `voice-pc-commons`).
- `README.md`: embed package roles, host integration, and environment variables.

## Required Specs By Task Type

- Any code change: `../../../sdkwork-specs/CODE_STYLE_SPEC.md`, `../../../sdkwork-specs/NAMING_SPEC.md`, plus only the touched language/framework spec.
- TypeScript/Node code: `../../../sdkwork-specs/TYPESCRIPT_CODE_SPEC.md`.
- Frontend/UI code: `../../../sdkwork-specs/FRONTEND_CODE_SPEC.md`, `../../../sdkwork-specs/FRONTEND_SPEC.md`, `../../../sdkwork-specs/UI_ARCHITECTURE_SPEC.md`, and `../../../sdkwork-specs/APP_PC_REACT_UI_SPEC.md`.
- PC embed architecture: `../../../sdkwork-specs/APP_PC_ARCHITECTURE_SPEC.md`, `../../../sdkwork-specs/APPLICATION_SPEC.md`.
- SDK integration: `../../../sdkwork-specs/APP_SDK_INTEGRATION_SPEC.md`, `../../../sdkwork-specs/SDK_SPEC.md`.

## Code Style Rules

Feature packages use generated `@sdkwork/voice-app-sdk` clients or approved composed wrappers through `sdkwork-voice-pc-core` host ports — not raw HTTP or manual auth headers. Prefer `@sdkwork/utils` for shared non-UI utilities when available.

Do not reintroduce legacy `@sdkwork/audio-pc-react` or repository-root `packages/pc-react/content/sdkwork-audio-pc-react`.

## Build, Test, and Verification

From sibling `sdkwork-im` application root:

```bash
cd ../../sdkwork-im/apps/sdkwork-im-pc
pnpm run test:voice-app-sdk-integration
pnpm run lint
```

From this directory:

```bash
pnpm run typecheck
```

## HTTP API Response Envelope

Voice app-api operations consumed through `@sdkwork/voice-app-sdk` follow `API_SPEC.md` section 4.5 and sections 14–15. Generated SDK clients unwrap `data` by default; errors use `ProblemDetail` with numeric `code` and `traceId`.

## Human Review Rules

Request human review before breaking SDKWork standards, changing public naming, altering security/auth behavior, or modifying release/deployment governance.
