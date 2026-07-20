# SDKWork Voice App SDK

Generator-owned app/client SDK family for `sdkwork-voice-app-api`.

Run `pnpm api:materialize` from the `sdkwork-voice` root to refresh the OpenAPI authority and derived sdkgen inputs, then run `.\sdks\sdkwork-voice-app-sdk\bin\generate-sdk.ps1` to generate language transports through the canonical SDKWork generator.

## SDKWork Documentation Contract

Domain: communication
Capability: voice-app-sdk
Package type: node-package
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

- `powershell -NoProfile -Command "Get-Content specs/component.spec.json -Raw | ConvertFrom-Json | Out-Null"`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
