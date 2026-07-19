use schemars::JsonSchema;
use sdkwork_voice_service::VoiceGenerationProviderError;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, JsonSchema, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct McpToolError {
    pub code: String,
    pub message: String,
    pub retryable: bool,
}

impl McpToolError {
    pub(crate) fn invalid_request(message: impl Into<String>) -> Self {
        Self {
            code: "invalid_request".into(),
            message: message.into(),
            retryable: false,
        }
    }
    pub(crate) fn task_not_found(handle: &str) -> Self {
        Self {
            code: "task_not_found".into(),
            message: format!("voice generation task handle was not found: {handle}"),
            retryable: false,
        }
    }
    pub(crate) fn store_unavailable() -> Self {
        Self {
            code: "task_store_unavailable".into(),
            message: "voice MCP task store is unavailable".into(),
            retryable: true,
        }
    }
}

impl From<VoiceGenerationProviderError> for McpToolError {
    fn from(error: VoiceGenerationProviderError) -> Self {
        let code = match &error {
            VoiceGenerationProviderError::InvalidRequest(_) => "invalid_request",
            VoiceGenerationProviderError::UnsupportedVendor(_) => "unsupported_vendor",
            VoiceGenerationProviderError::UnsupportedCapability(_) => "unsupported_capability",
            VoiceGenerationProviderError::UnsupportedParameter(_) => "unsupported_parameter",
            VoiceGenerationProviderError::ProviderNotConfigured(_) => "provider_not_configured",
            VoiceGenerationProviderError::ProviderUnavailable(_) => "provider_unavailable",
            VoiceGenerationProviderError::RateLimited(_) => "rate_limited",
            VoiceGenerationProviderError::Rejected(_) => "rejected",
            VoiceGenerationProviderError::Timeout(_) => "timeout",
            VoiceGenerationProviderError::Transport(_) => "transport",
            VoiceGenerationProviderError::InvalidProviderResponse(_) => "invalid_provider_response",
            VoiceGenerationProviderError::Configuration(_) => "configuration",
        };
        Self {
            code: code.into(),
            message: error.to_string(),
            retryable: error.retryable(),
        }
    }
}
