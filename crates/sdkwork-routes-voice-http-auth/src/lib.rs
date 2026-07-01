pub mod context;
pub mod layer;
pub mod response;
pub mod test_support;

pub use context::{
    voice_request_context_from_web, webhook_ingress_web_request_context, VoiceAuthError,
    VoiceRequestContext,
};
pub use response::{
    finish_success, success_envelope, success_status_for_voice_app_operation,
    success_status_for_voice_backend_operation, VoiceRouteError,
};

pub fn gateway_mount() -> axum::Router {
    axum::Router::new()
}
