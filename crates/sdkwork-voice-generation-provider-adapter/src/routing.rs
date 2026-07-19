pub const VOICE_GENERATION_PROVIDER_ADAPTER_ID: &str = "sdkwork-voice-generation-provider-adapter";

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct SpeechSdkRoute {
    pub resource: &'static str,
    pub method: &'static str,
}

pub fn resolve_speech_sdk_route() -> SpeechSdkRoute {
    SpeechSdkRoute {
        resource: "audio",
        method: "create_speech",
    }
}
