use std::sync::Arc;

use axum::{
    routing::{get, post},
    Router,
};

use crate::{
    handlers,
    manifest::voice_app_api_http_route_manifest,
    service_port::{VoiceAppApiServicePort, VoiceAppApiState},
};
use sdkwork_routes_voice_http_auth::layer::with_dual_token_request_context;

pub fn build_sdkwork_voice_app_api_router(service: Arc<dyn VoiceAppApiServicePort>) -> Router {
    let router = Router::new()
        .route("/app/v3/api/voice/speech", post(handlers::create_speech))
        .route(
            "/app/v3/api/voice/transcriptions",
            post(handlers::create_transcription),
        )
        .route(
            "/app/v3/api/voice/translations",
            post(handlers::create_translation),
        )
        .route(
            "/app/v3/api/voice/sound_effects",
            post(handlers::create_sound_effect),
        )
        .route("/app/v3/api/voice/music", post(handlers::create_music))
        .route("/app/v3/api/voice/tasks", get(handlers::list_tasks))
        .route(
            "/app/v3/api/voice/tasks/{taskId}",
            get(handlers::retrieve_task),
        )
        .route(
            "/app/v3/api/voice/tasks/{taskId}/cancel",
            post(handlers::cancel_task),
        )
        .route(
            "/app/v3/api/voice/task_events",
            get(handlers::list_task_events),
        )
        .route(
            "/app/v3/api/voice/artifact_drive_sync",
            get(handlers::list_artifact_drive_sync),
        )
        .route(
            "/app/v3/api/voice/audio_assets",
            get(handlers::list_audio_assets),
        )
        .route(
            "/app/v3/api/voice/audio_assets/{audioAssetId}",
            get(handlers::retrieve_audio_asset),
        )
        .with_state(VoiceAppApiState::new(service));
    with_dual_token_request_context(router, voice_app_api_http_route_manifest())
}
