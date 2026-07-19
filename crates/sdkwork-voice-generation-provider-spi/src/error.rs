#[derive(Clone, Debug, Eq, PartialEq, thiserror::Error)]
pub enum VoiceGenerationProviderError {
    #[error("speech generation request is invalid: {0}")]
    InvalidRequest(String),
    #[error("speech generation vendor is unsupported: {0}")]
    UnsupportedVendor(String),
    #[error("speech generation capability is unsupported: {0}")]
    UnsupportedCapability(String),
    #[error("speech generation parameter is unsupported: {0}")]
    UnsupportedParameter(String),
    #[error("speech generation provider is not configured: {0}")]
    ProviderNotConfigured(String),
    #[error("speech generation provider is unavailable: {0}")]
    ProviderUnavailable(String),
    #[error("speech generation provider rate limited the request: {0}")]
    RateLimited(String),
    #[error("speech generation provider rejected the request: {0}")]
    Rejected(String),
    #[error("speech generation provider timed out: {0}")]
    Timeout(String),
    #[error("speech generation provider transport failed: {0}")]
    Transport(String),
    #[error("speech generation provider returned an invalid response: {0}")]
    InvalidProviderResponse(String),
    #[error("speech generation provider configuration is invalid: {0}")]
    Configuration(String),
}

impl VoiceGenerationProviderError {
    pub fn retryable(&self) -> bool {
        matches!(
            self,
            Self::ProviderUnavailable(_)
                | Self::RateLimited(_)
                | Self::Timeout(_)
                | Self::Transport(_)
        )
    }
}

pub type VoiceGenerationProviderResult<T> = Result<T, VoiceGenerationProviderError>;
