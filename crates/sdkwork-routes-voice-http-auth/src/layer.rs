use axum::Router;
use sdkwork_iam_web_adapter::build_web_framework_layer;
use sdkwork_web_axum::with_web_request_context;
use sdkwork_web_core::{DefaultWebRequestContextResolver, HttpRouteManifest};

pub fn with_dual_token_request_context(
    router: Router,
    route_manifest: HttpRouteManifest,
) -> Router {
    let layer = build_web_framework_layer(
        DefaultWebRequestContextResolver::default(),
        route_manifest,
        Vec::new(),
    );
    with_web_request_context(router, layer)
}
