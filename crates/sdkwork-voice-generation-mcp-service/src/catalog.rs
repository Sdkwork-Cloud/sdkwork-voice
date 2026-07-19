use rmcp::model::{
    GetPromptResult, ListPromptsResult, ListResourcesResult, Prompt, PromptMessage, Resource,
    ResourceContents, Role,
};
use sdkwork_voice_service::{VoiceGenerationProviderCapability, VoiceGenerationProviderDescriptor};
pub(crate) const CAPABILITIES_URI: &str = "sdkwork://voice/generation/capabilities";
pub(crate) const VENDORS_URI: &str = "sdkwork://voice/generation/vendors";
pub(crate) const GENERATION_PROMPT: &str = "voice.generation.request";
pub(crate) fn resources() -> ListResourcesResult {
    ListResourcesResult::with_all_items(vec![
        Resource::new(CAPABILITIES_URI, "voice-generation-capabilities")
            .with_title("Voice generation capabilities")
            .with_mime_type("application/json"),
        Resource::new(VENDORS_URI, "voice-generation-vendors")
            .with_title("Voice generation vendors")
            .with_mime_type("application/json"),
    ])
}
pub(crate) fn catalog(descriptors: Vec<VoiceGenerationProviderDescriptor>) -> serde_json::Value {
    let providers = descriptors.into_iter().map(|descriptor| serde_json::json!({"vendors": descriptor.vendors.into_iter().map(|vendor| vendor.to_string()).collect::<Vec<_>>(), "capabilities": descriptor.capabilities.into_iter().map(capability_name).collect::<Vec<_>>() })).collect::<Vec<_>>();
    serde_json::json!({"domain":"voice","tools":["voice.synthesize","voice.retrieve","voice.cancel","voice.capabilities"],"transports":["stdio","streamable-http-sse"],"providers":providers})
}
pub(crate) fn read(
    uri: &str,
    descriptors: Vec<VoiceGenerationProviderDescriptor>,
) -> Option<ResourceContents> {
    let catalog = catalog(descriptors);
    let value = match uri {
        CAPABILITIES_URI => catalog,
        VENDORS_URI => catalog.get("providers")?.clone(),
        _ => return None,
    };
    Some(
        ResourceContents::text(serde_json::to_string_pretty(&value).ok()?, uri)
            .with_mime_type("application/json"),
    )
}
pub(crate) fn prompts() -> ListPromptsResult {
    ListPromptsResult::with_all_items(vec![Prompt::new(
        GENERATION_PROMPT,
        Some("Prepare a provider-neutral speech synthesis request for voice.synthesize."),
        None,
    )])
}
pub(crate) fn prompt() -> GetPromptResult {
    GetPromptResult::new(vec![PromptMessage::new_text(Role::User, "Create a speech synthesis request. Inspect sdkwork://voice/generation/vendors, choose a supported voice and audio format, keep provider-only fields inside vendorParameters with its schema identifier, and invoke voice.synthesize.")]).with_description("Provider-neutral voice synthesis request workflow")
}
fn capability_name(capability: VoiceGenerationProviderCapability) -> &'static str {
    match capability {
        VoiceGenerationProviderCapability::Speech => "speech",
        VoiceGenerationProviderCapability::InlineAudio => "inline-audio",
        VoiceGenerationProviderCapability::ProviderUrl => "provider-url",
        VoiceGenerationProviderCapability::Polling => "polling",
        VoiceGenerationProviderCapability::Cancellation => "cancellation",
    }
}
