use sdkwork_routes_voice_app_api::{app_routes, required_dual_token_headers, HttpMethod};

#[test]
fn exposes_voice_app_route_catalog() {
    let app_routes = app_routes();
    assert_eq!(app_routes.len(), 12);

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

    for route in &app_routes {
        assert!(route.path.starts_with("/app/v3/api/voice"));
        assert_eq!(route.tag, "voice");
    }
}

#[test]
fn preserves_standard_dual_token_headers() {
    assert_eq!(
        required_dual_token_headers(),
        ["Authorization", "Access-Token"]
    );
}
