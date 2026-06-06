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
