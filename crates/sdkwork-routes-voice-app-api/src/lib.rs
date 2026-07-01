use std::sync::Arc;

use axum::Router;
use sdkwork_web_core::HttpRouteManifest;

pub mod handlers;
pub mod manifest;
pub mod routes;
pub mod runtime_service;
pub mod service_port;

pub use manifest::{
    app_routes, required_dual_token_headers, voice_app_api_http_route_manifest, HttpMethod,
    VoiceHttpRoute, APP_API_PREFIX,
};
pub use routes::build_sdkwork_voice_app_api_router;
pub use runtime_service::VoiceAppRuntimeService;
pub use service_port::{VoiceAppApiServicePort, VoiceRequestContext, VoiceRouteError};

pub fn gateway_route_manifest() -> HttpRouteManifest {
    voice_app_api_http_route_manifest()
}

pub fn gateway_mount(service: Arc<dyn VoiceAppApiServicePort>) -> Router {
    build_sdkwork_voice_app_api_router(service)
}
