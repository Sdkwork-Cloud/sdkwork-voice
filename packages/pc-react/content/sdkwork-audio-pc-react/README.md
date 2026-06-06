# @sdkwork/audio-pc-react

## Purpose

Audio generation, speech synthesis, and voice capture.

## Placement

- Architecture: `pc-react`
- Domain: `voice`
- Capability: `audio`
- Status: `ready`

## Depends on

- `@sdkwork/voice-contracts` for voice-owned media resource contracts
- React runtime dependencies supplied by the consuming application shell
- Appbase IAM, Drive, request-context, and UI foundations remain external dependencies rather than duplicated code

## Extraction sources

- migrated legacy appbase audio package
- `sdkwork-react-audio`
- `sdkwork-pc-portal-voice`

## Next implementation steps

- Route remote business through generated `sdkwork-voice` app/backend SDK clients once transport output is generated.
- Keep reusable UI and service logic inside `sdkwork-voice`; do not reintroduce `sdkwork-appbase` package ownership.

## SDKWork Documentation Contract

Domain: communication
Capability: audio
Package type: react-package
Status: ready

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

- `pnpm --filter @sdkwork/audio-pc-react typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
