use sdkwork_api_voice_assembly::assemble_api_router;
use sdkwork_api_voice_assembly::run_database_migrate_only;
use sdkwork_api_voice_standalone_gateway::init_tracing;
use sdkwork_iam_web_adapter::{
    build_web_framework_builder, iam_web_request_context_resolver_from_env,
};
use sdkwork_web_bootstrap::{infra_public_path_prefixes, ComposedApiAssembly};
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
    let framework = build_web_framework_builder(
        iam_web_request_context_resolver_from_env().await,
        assembly.route_manifest.clone(),
        infra_public_path_prefixes(),
    );
    let business = ComposedApiAssembly::try_compose("SDKWork Voice API", vec![assembly])
        .unwrap_or_else(|error| exit_with_error("composition", error))
        .into_hosted(framework)
        .router
        .layer(cors_layer)
        .layer(RequestBodyLimitLayer::new(16 * 1024 * 1024))
        .layer(TimeoutLayer::new(Duration::from_secs(60)))
        .layer(TraceLayer::new_for_http());
    let app = business;
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
