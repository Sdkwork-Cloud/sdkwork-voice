pub const BACKEND_API_PREFIX: &str = "/backend/v3/api";

use sdkwork_web_contract::{HttpMethod as WebHttpMethod, HttpRoute};
use sdkwork_web_core::HttpRouteManifest;

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum HttpMethod {
    Delete,
    Get,
    Patch,
    Post,
    Put,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoiceHttpRoute {
    pub method: HttpMethod,
    pub path: &'static str,
    pub tag: &'static str,
    pub operation_id: &'static str,
}

impl VoiceHttpRoute {
    pub const fn new(
        method: HttpMethod,
        path: &'static str,
        tag: &'static str,
        operation_id: &'static str,
    ) -> Self {
        Self {
            method,
            path,
            tag,
            operation_id,
        }
    }
}

pub fn backend_routes() -> Vec<VoiceHttpRoute> {
    vec![
        VoiceHttpRoute::new(
            HttpMethod::Post,
            "/backend/v3/api/voice/provider_routes",
            "voice",
            "providerRoutes.create",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Get,
            "/backend/v3/api/voice/provider_routes",
            "voice",
            "providerRoutes.list",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Get,
            "/backend/v3/api/voice/provider_routes/{providerRouteId}",
            "voice",
            "providerRoutes.retrieve",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Patch,
            "/backend/v3/api/voice/provider_routes/{providerRouteId}",
            "voice",
            "providerRoutes.update",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Delete,
            "/backend/v3/api/voice/provider_routes/{providerRouteId}",
            "voice",
            "providerRoutes.delete",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Get,
            "/backend/v3/api/voice/tasks",
            "voice",
            "tasks.list",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Get,
            "/backend/v3/api/voice/tasks/{taskId}",
            "voice",
            "tasks.retrieve",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Post,
            "/backend/v3/api/voice/tasks/{taskId}/cancel",
            "voice",
            "tasks.cancel",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Post,
            "/backend/v3/api/voice/tasks/{taskId}/retry",
            "voice",
            "tasks.retry",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Post,
            "/backend/v3/api/voice/tasks/{taskId}/reconcile",
            "voice",
            "tasks.reconcile",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Get,
            "/backend/v3/api/voice/task_events",
            "voice",
            "taskEvents.list",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Post,
            "/backend/v3/api/voice/provider_webhooks/{providerCode}",
            "voice",
            "providerWebhooks.accept",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Get,
            "/backend/v3/api/voice/provider_webhook_events",
            "voice",
            "providerWebhookEvents.list",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Post,
            "/backend/v3/api/voice/provider_webhook_events/{eventId}/replay",
            "voice",
            "providerWebhookEvents.replay",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Get,
            "/backend/v3/api/voice/webhook_deliveries",
            "voice",
            "webhookDeliveries.list",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Get,
            "/backend/v3/api/voice/request_logs",
            "voice",
            "requestLogs.list",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Get,
            "/backend/v3/api/voice/artifact_drive_sync",
            "voice",
            "artifactDriveSync.list",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Post,
            "/backend/v3/api/voice/artifact_drive_sync/{syncId}/retry",
            "voice",
            "artifactDriveSync.retry",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Get,
            "/backend/v3/api/voice/audio_artifacts",
            "voice",
            "audioArtifacts.list",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Get,
            "/backend/v3/api/voice/audio_artifacts/{audioArtifactId}",
            "voice",
            "audioArtifacts.retrieve",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Delete,
            "/backend/v3/api/voice/audio_artifacts/{audioArtifactId}",
            "voice",
            "audioArtifacts.delete",
        ),
    ]
}

pub fn required_dual_token_headers() -> [&'static str; 2] {
    ["Authorization", "Access-Token"]
}

const VOICE_BACKEND_API_ROUTES: &[HttpRoute] = &[
    HttpRoute::dual_token(
        WebHttpMethod::Post,
        "/backend/v3/api/voice/provider_routes",
        "voice",
        "providerRoutes.create",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Get,
        "/backend/v3/api/voice/provider_routes",
        "voice",
        "providerRoutes.list",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Get,
        "/backend/v3/api/voice/provider_routes/{providerRouteId}",
        "voice",
        "providerRoutes.retrieve",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Patch,
        "/backend/v3/api/voice/provider_routes/{providerRouteId}",
        "voice",
        "providerRoutes.update",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Delete,
        "/backend/v3/api/voice/provider_routes/{providerRouteId}",
        "voice",
        "providerRoutes.delete",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Get,
        "/backend/v3/api/voice/tasks",
        "voice",
        "tasks.list",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Get,
        "/backend/v3/api/voice/tasks/{taskId}",
        "voice",
        "tasks.retrieve",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Post,
        "/backend/v3/api/voice/tasks/{taskId}/cancel",
        "voice",
        "tasks.cancel",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Post,
        "/backend/v3/api/voice/tasks/{taskId}/retry",
        "voice",
        "tasks.retry",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Post,
        "/backend/v3/api/voice/tasks/{taskId}/reconcile",
        "voice",
        "tasks.reconcile",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Get,
        "/backend/v3/api/voice/task_events",
        "voice",
        "taskEvents.list",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Get,
        "/backend/v3/api/voice/provider_webhook_events",
        "voice",
        "providerWebhookEvents.list",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Post,
        "/backend/v3/api/voice/provider_webhook_events/{eventId}/replay",
        "voice",
        "providerWebhookEvents.replay",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Get,
        "/backend/v3/api/voice/webhook_deliveries",
        "voice",
        "webhookDeliveries.list",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Get,
        "/backend/v3/api/voice/request_logs",
        "voice",
        "requestLogs.list",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Get,
        "/backend/v3/api/voice/artifact_drive_sync",
        "voice",
        "artifactDriveSync.list",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Post,
        "/backend/v3/api/voice/artifact_drive_sync/{syncId}/retry",
        "voice",
        "artifactDriveSync.retry",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Get,
        "/backend/v3/api/voice/audio_artifacts",
        "voice",
        "audioArtifacts.list",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Get,
        "/backend/v3/api/voice/audio_artifacts/{audioArtifactId}",
        "voice",
        "audioArtifacts.retrieve",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Delete,
        "/backend/v3/api/voice/audio_artifacts/{audioArtifactId}",
        "voice",
        "audioArtifacts.delete",
    ),
];

pub fn voice_backend_api_http_route_manifest() -> HttpRouteManifest {
    HttpRouteManifest::new(VOICE_BACKEND_API_ROUTES)
}
