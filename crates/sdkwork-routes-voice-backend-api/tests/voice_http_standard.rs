use sdkwork_routes_voice_backend_api::{backend_routes, required_dual_token_headers, HttpMethod};

#[test]
fn exposes_voice_backend_route_catalog() {
    let backend_routes = backend_routes();

    assert_eq!(backend_routes.len(), 21);

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

    for route in &backend_routes {
        assert!(route.path.starts_with("/backend/v3/api/voice"));
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
