use std::sync::Arc;

use axum::{
    routing::{get, post},
    Router,
};

use crate::{
    handlers,
    manifest::voice_backend_api_http_route_manifest,
    service_port::{VoiceBackendApiServicePort, VoiceBackendApiState},
};
use sdkwork_routes_voice_http_auth::layer::with_dual_token_request_context;

pub fn build_sdkwork_voice_backend_api_router(
    service: Arc<dyn VoiceBackendApiServicePort>,
) -> Router {
    let webhook_router = Router::new()
        .route(
            "/backend/v3/api/voice/provider_webhooks/{providerCode}",
            post(handlers::accept_provider_webhook_ingress),
        )
        .with_state(VoiceBackendApiState::new(service.clone()));

    let protected_router = Router::new()
        .route(
            "/backend/v3/api/voice/provider_routes",
            get(handlers::list_provider_routes).post(handlers::create_provider_route),
        )
        .route(
            "/backend/v3/api/voice/provider_routes/{providerRouteId}",
            get(handlers::retrieve_provider_route)
                .patch(handlers::update_provider_route)
                .delete(handlers::delete_provider_route),
        )
        .route("/backend/v3/api/voice/tasks", get(handlers::list_tasks))
        .route(
            "/backend/v3/api/voice/tasks/{taskId}",
            get(handlers::retrieve_task),
        )
        .route(
            "/backend/v3/api/voice/tasks/{taskId}/cancel",
            post(handlers::cancel_task),
        )
        .route(
            "/backend/v3/api/voice/tasks/{taskId}/retry",
            post(handlers::retry_task),
        )
        .route(
            "/backend/v3/api/voice/tasks/{taskId}/reconcile",
            post(handlers::reconcile_task),
        )
        .route(
            "/backend/v3/api/voice/task_events",
            get(handlers::list_task_events),
        )
        .route(
            "/backend/v3/api/voice/provider_webhook_events",
            get(handlers::list_provider_webhook_events),
        )
        .route(
            "/backend/v3/api/voice/provider_webhook_events/{eventId}/replay",
            post(handlers::replay_provider_webhook_event),
        )
        .route(
            "/backend/v3/api/voice/webhook_deliveries",
            get(handlers::list_webhook_deliveries),
        )
        .route(
            "/backend/v3/api/voice/request_logs",
            get(handlers::list_request_logs),
        )
        .route(
            "/backend/v3/api/voice/artifact_drive_sync",
            get(handlers::list_artifact_drive_sync),
        )
        .route(
            "/backend/v3/api/voice/artifact_drive_sync/{syncId}/retry",
            post(handlers::retry_artifact_drive_sync),
        )
        .route(
            "/backend/v3/api/voice/audio_artifacts",
            get(handlers::list_audio_artifacts),
        )
        .route(
            "/backend/v3/api/voice/audio_artifacts/{audioArtifactId}",
            get(handlers::retrieve_audio_artifact).delete(handlers::delete_audio_artifact),
        )
        .with_state(VoiceBackendApiState::new(service));

    webhook_router.merge(with_dual_token_request_context(
        protected_router,
        voice_backend_api_http_route_manifest(),
    ))
}
