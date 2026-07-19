# SDKWork Voice Generation MCP Service

Provider-neutral MCP adapter for `VoiceGenerationServicePort`.

- Tools: `voice.synthesize`, `voice.retrieve`, `voice.cancel`, `voice.capabilities`
- Resources: `sdkwork://voice/generation/capabilities`, `sdkwork://voice/generation/vendors`
- Prompt: `voice.generation.request`
- Transports: stdio and MCP Streamable HTTP with SSE delivery

The mounting composition root owns authentication, authorization, origin checks, limits, tracing,
listener binding, and graceful shutdown.
