use std::sync::Arc;

use axum::Router;
use sdkwork_database_sqlx::{create_any_pool_from_config, DatabasePool};
use sdkwork_routes_voice_app_api::{VoiceAppApiServicePort, VoiceAppRuntimeService};
use sdkwork_routes_voice_backend_api::{VoiceBackendApiServicePort, VoiceBackendRuntimeService};
use sdkwork_voice_drive_sync_processor::VoiceDriveSyncProcessor;
use sdkwork_voice_generation_repository_sqlx::{
    bootstrap_voice_database, connect_voice_database_pool_from_env, SqlVoiceStore,
};
use sdkwork_voice_service::VoiceArtifactDriveSyncProcessorPort;

pub struct EmbeddedVoiceAssembly {
    pub router: Router,
}

pub async fn assemble_embedded_voice_application_router_from_env(
) -> Result<EmbeddedVoiceAssembly, String> {
    let _ = dotenvy::dotenv();
    let voice_pool = connect_voice_database_pool_from_env()
        .await
        .map_err(|error| error.to_string())?;
    let _voice_host = bootstrap_voice_database(voice_pool.clone()).await?;
    assemble_embedded_voice_application_router(voice_pool).await
}

pub async fn assemble_embedded_voice_application_router(
    voice_pool: DatabasePool,
) -> Result<EmbeddedVoiceAssembly, String> {
    let config = voice_pool.config().clone();
    let any_pool = create_any_pool_from_config(config)
        .await
        .map_err(|error| format!("create voice any pool failed: {error}"))?;
    let store = SqlVoiceStore::new(any_pool);

    let app_service: Arc<dyn VoiceAppApiServicePort> =
        Arc::new(VoiceAppRuntimeService::new(store.clone()));

    let mut backend_runtime = VoiceBackendRuntimeService::new(store.clone());
    if let Some(processor) = VoiceDriveSyncProcessor::try_from_env()
        .await
        .map_err(|error| error.to_string())?
    {
        let processor: Arc<dyn VoiceArtifactDriveSyncProcessorPort> = processor.into_arc();
        backend_runtime = backend_runtime.with_drive_sync_processor(processor);
        tracing::info!("voice drive sync processor enabled");
    } else {
        tracing::info!("voice drive sync processor disabled (DRIVE database not configured)");
    }
    let backend_service: Arc<dyn VoiceBackendApiServicePort> = Arc::new(backend_runtime);

    Ok(EmbeddedVoiceAssembly {
        router: sdkwork_routes_voice_app_api::gateway_mount(app_service)
            .merge(sdkwork_routes_voice_backend_api::gateway_mount(backend_service)),
    })
}
