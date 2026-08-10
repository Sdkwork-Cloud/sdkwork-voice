pub const APP_API_PREFIX: &str = "/app/v3/api";

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
            HttpMethod::Post,
            "/app/v3/api/voice/sound_effects",
            "voice",
            "soundEffects.create",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Post,
            "/app/v3/api/voice/music",
            "voice",
            "music.create",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Get,
            "/app/v3/api/voice/tasks",
            "voice",
            "tasks.list",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Get,
            "/app/v3/api/voice/tasks/{taskId}",
            "voice",
            "tasks.retrieve",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Post,
            "/app/v3/api/voice/tasks/{taskId}/cancel",
            "voice",
            "tasks.cancel",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Get,
            "/app/v3/api/voice/task_events",
            "voice",
            "taskEvents.list",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Get,
            "/app/v3/api/voice/artifact_drive_sync",
            "voice",
            "artifactDriveSync.list",
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
        VoiceHttpRoute::new(
            HttpMethod::Post,
            "/app/v3/api/voice/voice_profiles",
            "voice",
            "voiceProfiles.create",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Get,
            "/app/v3/api/voice/voice_profiles",
            "voice",
            "voiceProfiles.list",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Get,
            "/app/v3/api/voice/voice_profiles/{profileId}",
            "voice",
            "voiceProfiles.retrieve",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Patch,
            "/app/v3/api/voice/voice_profiles/{profileId}",
            "voice",
            "voiceProfiles.update",
        ),
        VoiceHttpRoute::new(
            HttpMethod::Delete,
            "/app/v3/api/voice/voice_profiles/{profileId}",
            "voice",
            "voiceProfiles.delete",
        ),
    ]
}

pub fn required_dual_token_headers() -> [&'static str; 2] {
    ["Authorization", "Access-Token"]
}

const VOICE_APP_API_ROUTES: &[HttpRoute] = &[
    HttpRoute::dual_token(
        WebHttpMethod::Post,
        "/app/v3/api/voice/speech",
        "voice",
        "speech.create",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Post,
        "/app/v3/api/voice/transcriptions",
        "voice",
        "transcriptions.create",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Post,
        "/app/v3/api/voice/translations",
        "voice",
        "translations.create",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Post,
        "/app/v3/api/voice/sound_effects",
        "voice",
        "soundEffects.create",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Post,
        "/app/v3/api/voice/music",
        "voice",
        "music.create",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Get,
        "/app/v3/api/voice/tasks",
        "voice",
        "tasks.list",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Get,
        "/app/v3/api/voice/tasks/{taskId}",
        "voice",
        "tasks.retrieve",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Post,
        "/app/v3/api/voice/tasks/{taskId}/cancel",
        "voice",
        "tasks.cancel",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Get,
        "/app/v3/api/voice/task_events",
        "voice",
        "taskEvents.list",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Get,
        "/app/v3/api/voice/artifact_drive_sync",
        "voice",
        "artifactDriveSync.list",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Get,
        "/app/v3/api/voice/audio_assets",
        "voice",
        "audioAssets.list",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Get,
        "/app/v3/api/voice/audio_assets/{audioAssetId}",
        "voice",
        "audioAssets.retrieve",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Post,
        "/app/v3/api/voice/voice_profiles",
        "voice",
        "voiceProfiles.create",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Get,
        "/app/v3/api/voice/voice_profiles",
        "voice",
        "voiceProfiles.list",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Get,
        "/app/v3/api/voice/voice_profiles/{profileId}",
        "voice",
        "voiceProfiles.retrieve",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Patch,
        "/app/v3/api/voice/voice_profiles/{profileId}",
        "voice",
        "voiceProfiles.update",
    ),
    HttpRoute::dual_token(
        WebHttpMethod::Delete,
        "/app/v3/api/voice/voice_profiles/{profileId}",
        "voice",
        "voiceProfiles.delete",
    ),
];

pub fn voice_app_api_http_route_manifest() -> HttpRouteManifest {
    HttpRouteManifest::new(VOICE_APP_API_ROUTES)
}
