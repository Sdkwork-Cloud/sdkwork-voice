# ADR-20260719: Voice Generation Provider SPI

Status: accepted
Date: 2026-07-19
Owner: SDKWork Voice maintainers

## Decision

Speech generation is exposed through `VoiceGenerationServicePort` in `sdkwork-voice-service` and a
transport-neutral `sdkwork-voice-generation-provider-spi`. The generated SDK route, DTO conversion,
versioned vendor parameters, error mapping, and output normalization belong exclusively to
`sdkwork-voice-generation-provider-adapter`. Runtime bootstrap constructs the SDK client.

ClawRouter is not a vendor or public provider contract. The initial adapter supports synchronous
OpenAI-compatible speech because that is the typed operation currently available in the Rust SDK.
