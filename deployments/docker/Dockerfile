# SDKWork Voice API — production container image.
# Build from the sdkwork-voice repository root after sibling SDKWork dependencies
# are available (local workspace checkout or CI prepare-ci-dependencies).

FROM rust:1-bookworm AS builder
WORKDIR /src
COPY . .
RUN cargo build --release -p sdkwork-voice-standalone-gateway

FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /src/target/release/sdkwork-voice-standalone-gateway /usr/local/bin/sdkwork-voice-standalone-gateway
COPY --from=builder /src/database /app/database
ENV VOICE_API_BIND=0.0.0.0:18096
ENV VOICE_DEPLOY_ENV=production
EXPOSE 18096
USER 10001:10001
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD ["curl", "-sf", "http://localhost:18096/healthz"]
CMD ["sdkwork-voice-standalone-gateway"]
