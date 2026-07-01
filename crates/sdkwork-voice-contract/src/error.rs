#[derive(Clone, Debug, Eq, PartialEq)]
pub enum VoiceServiceErrorKind {
    Unauthenticated,
    Unauthorized,
    NotFound,
    Conflict,
    InvalidState,
    Validation,
    Transport,
    ProviderUnavailable,
    Storage,
    Unknown,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoiceServiceError {
    kind: VoiceServiceErrorKind,
    message: String,
}

impl VoiceServiceError {
    pub fn unauthenticated(message: impl Into<String>) -> Self {
        Self::new(VoiceServiceErrorKind::Unauthenticated, message)
    }

    pub fn unauthorized(message: impl Into<String>) -> Self {
        Self::new(VoiceServiceErrorKind::Unauthorized, message)
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self::new(VoiceServiceErrorKind::NotFound, message)
    }

    pub fn conflict(message: impl Into<String>) -> Self {
        Self::new(VoiceServiceErrorKind::Conflict, message)
    }

    pub fn invalid_state(message: impl Into<String>) -> Self {
        Self::new(VoiceServiceErrorKind::InvalidState, message)
    }

    pub fn validation(message: impl Into<String>) -> Self {
        Self::new(VoiceServiceErrorKind::Validation, message)
    }

    pub fn transport(message: impl Into<String>) -> Self {
        Self::new(VoiceServiceErrorKind::Transport, message)
    }

    pub fn provider_unavailable(message: impl Into<String>) -> Self {
        Self::new(VoiceServiceErrorKind::ProviderUnavailable, message)
    }

    pub fn storage(message: impl Into<String>) -> Self {
        Self::new(VoiceServiceErrorKind::Storage, message)
    }

    pub fn unknown(message: impl Into<String>) -> Self {
        Self::new(VoiceServiceErrorKind::Unknown, message)
    }

    pub fn code(&self) -> &'static str {
        match self.kind {
            VoiceServiceErrorKind::Unauthenticated => "unauthenticated",
            VoiceServiceErrorKind::Unauthorized => "unauthorized",
            VoiceServiceErrorKind::NotFound => "not-found",
            VoiceServiceErrorKind::Conflict => "conflict",
            VoiceServiceErrorKind::InvalidState => "invalid-state",
            VoiceServiceErrorKind::Validation => "validation",
            VoiceServiceErrorKind::Transport => "transport",
            VoiceServiceErrorKind::ProviderUnavailable => "provider-unavailable",
            VoiceServiceErrorKind::Storage => "storage",
            VoiceServiceErrorKind::Unknown => "unknown",
        }
    }

    pub fn message(&self) -> &str {
        &self.message
    }

    fn new(kind: VoiceServiceErrorKind, message: impl Into<String>) -> Self {
        Self {
            kind,
            message: message.into(),
        }
    }
}
