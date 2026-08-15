//! Tracing bootstrap for `sdkwork-api-voice-standalone-gateway`.
pub fn init_tracing() {
    #[cfg(feature = "otel")]
    if std::env::var("OTEL_EXPORTER_OTLP_ENDPOINT")
        .ok()
        .is_some_and(|value| !value.trim().is_empty())
    {
        match init_otel_tracing("sdkwork-api-voice-standalone-gateway") {
            Ok(()) => return,
            Err(error) => {
                eprintln!(
                    "sdkwork-api-voice-standalone-gateway OTLP tracing init failed ({error}); falling back to fmt subscriber"
                );
            }
        }
    }

    init_fmt_tracing();
}

fn init_fmt_tracing() {
    let use_json = is_production_deploy_env()
        || std::env::var("VOICE_LOG_FORMAT")
            .map(|value| value.eq_ignore_ascii_case("json"))
            .unwrap_or(false);

    let env_filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info"));

    if use_json {
        tracing_subscriber::fmt()
            .json()
            .with_env_filter(env_filter)
            .with_current_span(true)
            .with_span_list(true)
            .init();
    } else {
        tracing_subscriber::fmt().with_env_filter(env_filter).init();
    }
}

fn is_production_deploy_env() -> bool {
    matches!(
        std::env::var("VOICE_DEPLOY_ENV")
            .unwrap_or_default()
            .trim()
            .to_ascii_lowercase()
            .as_str(),
        "production" | "prod"
    )
}

#[cfg(feature = "otel")]
fn init_otel_tracing(service_name: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    use opentelemetry::trace::TracerProvider as _;
    use opentelemetry_otlp::WithExportConfig;
    use opentelemetry_sdk::trace::TracerProvider;
    use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, Layer};

    let endpoint = std::env::var("OTEL_EXPORTER_OTLP_ENDPOINT")?;
    let exporter = opentelemetry_otlp::SpanExporter::builder()
        .with_http()
        .with_endpoint(endpoint)
        .build()?;
    let provider = TracerProvider::builder()
        .with_batch_exporter(exporter, opentelemetry_sdk::runtime::Tokio)
        .build();
    let tracer = provider.tracer(service_name.to_owned());
    let telemetry = tracing_opentelemetry::layer().with_tracer(tracer);

    let use_json = is_production_deploy_env()
        || std::env::var("VOICE_LOG_FORMAT")
            .map(|value| value.eq_ignore_ascii_case("json"))
            .unwrap_or(false);

    let filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info"));

    let fmt_layer = if use_json {
        tracing_subscriber::fmt::layer()
            .json()
            .with_current_span(true)
            .with_span_list(true)
            .boxed()
    } else {
        tracing_subscriber::fmt::layer().boxed()
    };

    tracing_subscriber::registry()
        .with(filter)
        .with(fmt_layer)
        .with(telemetry)
        .try_init()?;

    tracing::info!(
        service = service_name,
        "sdkwork-voice OTLP tracing initialized"
    );
    Ok(())
}
