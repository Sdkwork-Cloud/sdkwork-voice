# SDKWork Voice PC (embed host)

Embed packages consumed by IM PC and other host shells. Canonical architecture: `../../sdkwork-specs/APP_PC_ARCHITECTURE_SPEC.md`.

## Packages

| Package | Role |
| --- | --- |
| `@sdkwork/voice-pc-market` | Voice market UI (`VoiceMarketView`) |
| `@sdkwork/voice-pc-speech` | Speech synthesis UI (`VoiceSpeechView`) |
| `sdkwork-voice-pc-core` | Host session ports, SDK client access, audio asset catalog helpers |
| `sdkwork-voice-pc-commons` | Shared UI utilities |

## Host integration (IM PC)

- `voicePcIntegration.ts` wires `configureVoicePcRuntime({ sdkPorts })`
- Shell lazy loaders: tabs `voice` → market, `voicegen` → speech
- Gateway route: `/app/v3/api/voice/*` → `sdkwork-voice-app-api`

## Environment

| Variable | Purpose |
| --- | --- |
| `VITE_SDKWORK_VOICE_MARKET_PILOT` | Local mock market + clone preview |
| `VITE_SDKWORK_VOICE_SPEECH_DEFAULT_MODEL` | Default TTS model (default `tts-1`) |
| `VITE_SDKWORK_VOICE_SPEECH_DEFAULT_VOICE` | Default voice id when catalog empty (default `alloy`) |
| `SDKWORK_IM_VOICE_APP_API_UPSTREAM` | Split-deploy voice app-api upstream |

IM host aliases: `VITE_SDKWORK_IM_VOICE_*` remain supported for migration.
