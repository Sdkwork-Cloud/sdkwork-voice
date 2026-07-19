//! L4 generated-SDK adapter for speech generation.

mod adapter;
mod normalization;
mod requests;
mod routing;

pub use adapter::VoiceGenerationProviderAdapter;
pub use requests::build_speech_generation_request;
pub use routing::{resolve_speech_sdk_route, SpeechSdkRoute, VOICE_GENERATION_PROVIDER_ADAPTER_ID};
