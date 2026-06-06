use sdkwork_voice_http::{app_routes, backend_routes, required_dual_token_headers, HttpMethod};

#[test]
fn exposes_voice_app_and_backend_route_catalogs() {
    let app_routes = app_routes();
    let backend_routes = backend_routes();

    assert_eq!(app_routes.len(), 5);
    assert_eq!(backend_routes.len(), 9);

    assert!(app_routes.iter().any(|route| {
        route.method == HttpMethod::Post
            && route.path == "/app/v3/api/voice/speech"
            && route.tag == "voice"
            && route.operation_id == "speech.create"
    }));
    assert!(app_routes.iter().any(|route| {
        route.path == "/app/v3/api/voice/transcriptions"
            && route.operation_id == "transcriptions.create"
    }));
    assert!(app_routes.iter().any(|route| {
        route.path == "/app/v3/api/voice/translations"
            && route.operation_id == "translations.create"
    }));

    assert!(backend_routes.iter().any(|route| {
        route.method == HttpMethod::Get
            && route.path == "/backend/v3/api/voice/request_logs"
            && route.operation_id == "requestLogs.list"
    }));

    for route in app_routes.iter().chain(backend_routes.iter()) {
        assert!(
            route.path.starts_with("/app/v3/api/voice")
                || route.path.starts_with("/backend/v3/api/voice"),
            "voice routes must stay in voice API prefixes: {}",
            route.path
        );
        assert_eq!(route.tag, "voice");
    }
}

#[test]
fn preserves_standard_dual_token_headers() {
    assert_eq!(required_dual_token_headers(), ["Authorization", "Access-Token"]);
}
