pub const APP_API_PREFIX: &str = "/app/v3/api";
pub const BACKEND_API_PREFIX: &str = "/backend/v3/api";

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

pub fn app_routes() -> Vec<VoiceHttpRoute> {
    vec![
        VoiceHttpRoute::new(
            HttpMethod::Post,
            "/app/v3/api/voice/speech",
            "voice",
            "speech.create",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Post,
            "/app/v3/api/voice/transcriptions",
            "voice",
            "transcriptions.create",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Post,
            "/app/v3/api/voice/translations",
            "voice",
            "translations.create",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Get,
            "/app/v3/api/voice/audio_assets",
            "voice",
            "audioAssets.list",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Get,
            "/app/v3/api/voice/audio_assets/{audioAssetId}",
            "voice",
            "audioAssets.retrieve",
        ),
    ]
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
            "/backend/v3/api/voice/request_logs",
            "voice",
            "requestLogs.list",
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
