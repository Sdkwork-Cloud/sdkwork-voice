use sdkwork_voice_http::{app_routes, backend_routes, required_dual_token_headers, HttpMethod};

#[test]
fn exposes_voice_app_and_backend_route_catalogs() {
    let app_routes = app_routes();
    let backend_routes = backend_routes();

    assert_eq!(app_routes.len(), 12);
    assert_eq!(backend_routes.len(), 21);

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
    assert!(app_routes.iter().any(|route| {
        route.method == HttpMethod::Post
            && route.path == "/app/v3/api/voice/sound_effects"
            && route.operation_id == "soundEffects.create"
    }));
    assert!(app_routes.iter().any(|route| {
        route.method == HttpMethod::Post
            && route.path == "/app/v3/api/voice/music"
            && route.operation_id == "music.create"
    }));
    assert!(app_routes.iter().any(|route| {
        route.method == HttpMethod::Get
            && route.path == "/app/v3/api/voice/tasks/{taskId}"
            && route.operation_id == "tasks.retrieve"
    }));
    assert!(app_routes.iter().any(|route| {
        route.method == HttpMethod::Post
            && route.path == "/app/v3/api/voice/tasks/{taskId}/cancel"
            && route.operation_id == "tasks.cancel"
    }));
    assert!(app_routes.iter().any(|route| {
        route.method == HttpMethod::Get
            && route.path == "/app/v3/api/voice/artifact_drive_sync"
            && route.operation_id == "artifactDriveSync.list"
    }));

    assert!(backend_routes.iter().any(|route| {
        route.method == HttpMethod::Get
            && route.path == "/backend/v3/api/voice/request_logs"
            && route.operation_id == "requestLogs.list"
    }));
    assert!(backend_routes.iter().any(|route| {
        route.method == HttpMethod::Post
            && route.path == "/backend/v3/api/voice/provider_webhooks/{providerCode}"
            && route.operation_id == "providerWebhooks.accept"
    }));
    assert!(backend_routes.iter().any(|route| {
        route.method == HttpMethod::Post
            && route.path == "/backend/v3/api/voice/tasks/{taskId}/reconcile"
            && route.operation_id == "tasks.reconcile"
    }));
    assert!(backend_routes.iter().any(|route| {
        route.method == HttpMethod::Get
            && route.path == "/backend/v3/api/voice/provider_webhook_events"
            && route.operation_id == "providerWebhookEvents.list"
    }));
    assert!(backend_routes.iter().any(|route| {
        route.method == HttpMethod::Get
            && route.path == "/backend/v3/api/voice/artifact_drive_sync"
            && route.operation_id == "artifactDriveSync.list"
    }));
    assert!(backend_routes.iter().any(|route| {
        route.method == HttpMethod::Post
            && route.path == "/backend/v3/api/voice/artifact_drive_sync/{syncId}/retry"
            && route.operation_id == "artifactDriveSync.retry"
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
