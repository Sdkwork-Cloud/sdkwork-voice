pub mod manifest;

pub use manifest::{
    backend_routes, required_dual_token_headers, HttpMethod, VoiceHttpRoute, BACKEND_API_PREFIX,
};

pub fn gateway_mount() -> axum::Router {
    axum::Router::new()
}
