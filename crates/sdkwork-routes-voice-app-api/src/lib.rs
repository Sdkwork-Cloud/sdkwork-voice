pub mod manifest;

pub use manifest::{
    app_routes, required_dual_token_headers, HttpMethod, VoiceHttpRoute, APP_API_PREFIX,
};

pub fn gateway_mount() -> axum::Router {
    axum::Router::new()
}
