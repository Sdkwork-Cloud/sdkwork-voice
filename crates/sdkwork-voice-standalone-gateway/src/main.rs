use axum::http::HeaderValue;
use sdkwork_voice_gateway_assembly::{assemble_application_router, gateway_contract_fallback_config};
use sdkwork_web_bootstrap::{service_router, ServiceRouterConfig};
use std::time::Duration;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::timeout::TimeoutLayer;
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let cors_layer = build_cors_layer_from_env();
    let business = assemble_application_router()
        .await
        .expect("assemble voice application router")
        .router
        .layer(cors_layer)
        .layer(RequestBodyLimitLayer::new(16 * 1024 * 1024))
        .layer(TimeoutLayer::new(Duration::from_secs(60)))
        .layer(TraceLayer::new_for_http());

    let service_config = ServiceRouterConfig::default()
        .with_always_ready()
        .with_contract_fallback(gateway_contract_fallback_config());
    let app = service_router(business, service_config);
    let addr = std::env::var("VOICE_API_BIND").unwrap_or_else(|_| "0.0.0.0:18096".to_owned());
    let listener = tokio::net::TcpListener::bind(&addr).await.expect("bind");

    tracing::info!(bind = %addr, "voice api server starting");

    let shutdown = async {
        let ctrl_c = async {
            tokio::signal::ctrl_c()
                .await
                .expect("failed to install Ctrl+C handler");
        };

        #[cfg(unix)]
        let terminate = async {
            tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
                .expect("failed to install signal handler")
                .recv()
                .await;
        };

        #[cfg(not(unix))]
        let terminate = std::future::pending::<()>();

        tokio::select! {
            _ = ctrl_c => {},
            _ = terminate => {},
        }

        tracing::info!("voice api server shutdown signal received, draining in-flight requests");
    };

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown)
        .await
        .expect("serve");
}

fn build_cors_layer_from_env() -> CorsLayer {
    let raw = std::env::var("VOICE_API_CORS_ORIGINS").unwrap_or_default();
    let origins: Vec<&str> = raw
        .split(',')
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .collect();

    if origins.is_empty() {
        tracing::warn!("VOICE_API_CORS_ORIGINS not set; CORS will deny all cross-origin requests");
        return CorsLayer::new();
    }

    if origins.iter().any(|origin| *origin == "*") {
        tracing::error!(
            "VOICE_API_CORS_ORIGINS contains wildcard '*'; denying all cross-origin requests"
        );
        return CorsLayer::new();
    }

    let parsed: Vec<HeaderValue> = origins
        .iter()
        .filter_map(|origin| match HeaderValue::try_from(*origin) {
            Ok(value) => Some(value),
            Err(error) => {
                tracing::warn!(origin = *origin, error = %error, "invalid CORS origin skipped");
                None
            }
        })
        .collect();

    if parsed.is_empty() {
        tracing::error!("no valid CORS origins parsed; denying all cross-origin requests");
        return CorsLayer::new();
    }

    tracing::info!(origins = ?origins, "CORS allowlist configured");
    CorsLayer::new()
        .allow_origin(AllowOrigin::list(parsed))
        .allow_credentials(true)
        .allow_methods([
            axum::http::Method::GET,
            axum::http::Method::POST,
            axum::http::Method::PUT,
            axum::http::Method::PATCH,
            axum::http::Method::DELETE,
            axum::http::Method::OPTIONS,
        ])
        .allow_headers(tower_http::cors::Any)
}
