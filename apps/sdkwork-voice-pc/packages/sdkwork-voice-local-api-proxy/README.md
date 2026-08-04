# @sdkwork/voice-local-api-proxy

Domain: communication
Capability: voice-local-api-proxy
Package type: react-package
Status: standard

This README is the SDKWork module entrypoint for `@sdkwork/voice-local-api-proxy`. The machine-readable component contract is `specs/component.spec.json`; canonical standards are under `../../../../../sdkwork-specs/`.

## Public API

- `.`

## Required SDK Surface

- None declared in `specs/component.spec.json`.

## Supported Proxy Catalog

The local proxy catalog includes OpenAI-compatible speech, transcription, translation, voice catalog, voice consent, realtime session, realtime client secret, realtime call action, realtime transcription, and realtime translation routes. It also includes custom/cloud-router provider entries for Suno music, ElevenLabs sound effects, Volcengine provider tasks, Kling video generation, Nano Banana image generation, Midjourney image generation, and Vidu image/video generation plus task creations lookup.

## Configuration

Configuration keys, runtime entrypoints, and integration contracts are declared in `specs/component.spec.json`. Shared modules must receive configuration through typed bootstrap or service boundaries rather than reading host-local environment state directly.

## SaaS/Private/Local Behavior

This component follows the deployment and runtime rules referenced by its `canonicalSpecs` entries. SaaS, private, and local behavior must stay compatible with the relevant SDKWork specs before implementation changes are made.

## Security

Do not add secrets, live tokens, manual auth headers, or app-local credential handling to this module. Protected API and SDK access must use the generated SDK or approved service boundary declared in the component contract.

## Extension Points

Extension points are limited to public exports, runtime entrypoints, SDK clients, events, and config keys declared in `specs/component.spec.json`.

## Verification

- `pnpm typecheck`

## Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`. Update that contract before changing public integration behavior.
