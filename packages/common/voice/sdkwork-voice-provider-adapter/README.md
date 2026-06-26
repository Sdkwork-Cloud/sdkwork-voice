# @sdkwork/voice-provider-adapter

Domain: communication
Capability: voice-provider-adapter
Package type: node-package
Status: standard

This README is the SDKWork module entrypoint for `@sdkwork/voice-provider-adapter`. The machine-readable component contract is `specs/component.spec.json`; canonical standards are under `../../../../../sdkwork-specs/`.

## Public API

- `.`

## Required SDK Surface

The adapter consumes an injected `sdkwork-clawrouter` generated SDK client shape. It does not construct SDK clients, read credentials, or issue raw provider HTTP requests.

Current generated SDK surfaces:

- `client.audio.speech.create`
- `client.audio.transcriptions.create`
- `client.audio.translations.create`
- `client.audio.voices.list`
- `client.audio.voices.create`
- `client.audio.voices.retrieve`
- `client.audio.voiceConsents.list`
- `client.audio.voiceConsents.create`
- `client.audio.voiceConsents.retrieve`
- `client.audio.voiceConsents.update`
- `client.audio.voiceConsents.delete`
- `client.realtime.sessions.create`
- `client.realtime.clientSecrets.create`
- `client.realtime.calls.create`
- `client.realtime.calls.accept.create`
- `client.realtime.calls.hangup.create`
- `client.realtime.calls.refer.create`
- `client.realtime.calls.reject.create`
- `client.realtime.transcriptionSessions.create`
- `client.realtime.translations.create`
- `client.audioSuno.v1.music.generations.create`
- `client.audioSuno.v1.music.generations.retrieve`
- `client.videosVolcengine.api.v3.contents.generations.tasks.create`
- `client.videosVolcengine.api.v3.contents.generations.tasks.retrieve`
- `client.videosKling.v1.videos.generations.create`
- `client.videosKling.v1.videos.generations.retrieve`
- `client.imagesNanoBanana.v1.images.generations.create`
- `client.imagesNanoBanana.v1.images.generations.retrieve`
- `client.imagesMidjourney.v1.images.generations.create`
- `client.imagesMidjourney.v1.images.generations.retrieve`
- `client.imagesVidu.ent.v2.reference2image.create`
- `client.videosVidu.ent.v2.text2video.create`
- `client.videosVidu.ent.v2.img2video.create`
- `client.videosVidu.ent.v2.reference2video.create`
- `client.videosVidu.ent.v2.startEnd2video.create`
- `client.videosVidu.ent.v2.tasks.creations.list`

ElevenLabs sound generation uses the injected provider-route invoker boundary for claw-router provider passthrough behavior.

Generated SDK resources are called through their owning resource objects so class-based generated clients keep their method binding. The adapter must not detach generated SDK methods and call them as unbound functions.

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
