use sdkwork_api_voice_assembly::{
    assemble_api_router, gateway_contract_fallback_config, voice_database_readiness_check,
};
use sdkwork_api_voice_standalone_gateway::{init_tracing, run_database_migrate_only};
use sdkwork_web_bootstrap::{service_router, ServiceRouterConfig};
use std::process;
use std::time::Duration;
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::timeout::TimeoutLayer;
use tower_http::trace::TraceLayer;

fn exit_with_error(context: &str, message: impl std::fmt::Display) -> ! {
    tracing::error!(context, error = %message, "fatal startup failure");
    eprintln!("FATAL [{context}]: {message}");
    process::exit(1);
}

#[tokio::main]
async fn main() {
    init_tracing();

    if matches!(std::env::args().nth(1).as_deref(), Some("db-migrate")) {
        if let Err(error) = run_database_migrate_only().await {
            exit_with_error("db-migrate", error);
        }
        return;
    }

    let cors_layer = sdkwork_web_bootstrap::application_cors_layer_from_env(
        &["SDKWORK_VOICE_ENVIRONMENT", "VOICE_ENVIRONMENT"],
        &["SDKWORK_CORS_ALLOWED_ORIGINS"],
    );
    let assembly = match assemble_api_router().await {
        Ok(assembly) => assembly,
        Err(error) => exit_with_error("bootstrap", error),
    };
    let business = assembly
        .router
        .layer(cors_layer)
        .layer(RequestBodyLimitLayer::new(16 * 1024 * 1024))
        .layer(TimeoutLayer::new(Duration::from_secs(60)))
        .layer(TraceLayer::new_for_http());

    let service_config = ServiceRouterConfig::default()
        .with_readiness_check(voice_database_readiness_check(&assembly.voice_pool))
        .with_contract_fallback(gateway_contract_fallback_config());
    let app = service_router(business, service_config);
    let addr = std::env::var("VOICE_API_BIND").unwrap_or_else(|_| "0.0.0.0:18096".to_owned());
    let listener = match tokio::net::TcpListener::bind(&addr).await {
        Ok(listener) => listener,
        Err(error) => exit_with_error("bind", format!("{addr}: {error}")),
    };

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

    if let Err(error) = axum::serve(listener, app)
        .with_graceful_shutdown(shutdown)
        .await
    {
        exit_with_error("serve", error);
    }
}
