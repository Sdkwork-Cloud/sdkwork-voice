#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoiceRuntimeContext {
    pub tenant_id: String,
    pub organization_id: Option<String>,
    pub user_id: String,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum VoiceOperationType {
    Speech,
    Transcription,
    Translation,
    SoundEffect,
    Music,
    RealtimeSession,
    RealtimeClientSecret,
    RealtimeCall,
    RealtimeTranscription,
    RealtimeTranslation,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum VoiceTaskStatus {
    Queued,
    Routing,
    Submitted,
    Running,
    Succeeded,
    Failed,
    Cancelled,
    Expired,
    NeedsReview,
}

impl VoiceOperationType {
    pub fn as_storage_value(self) -> &'static str {
        match self {
            Self::Speech => "speech",
            Self::Transcription => "transcription",
            Self::Translation => "translation",
            Self::SoundEffect => "sound_effect",
            Self::Music => "music",
            Self::RealtimeSession => "realtime_session",
            Self::RealtimeClientSecret => "realtime_client_secret",
            Self::RealtimeCall => "realtime_call",
            Self::RealtimeTranscription => "realtime_transcription",
            Self::RealtimeTranslation => "realtime_translation",
        }
    }

    pub fn from_storage_value(value: &str) -> Option<Self> {
        match value {
            "speech" => Some(Self::Speech),
            "transcription" => Some(Self::Transcription),
            "translation" => Some(Self::Translation),
            "sound_effect" => Some(Self::SoundEffect),
            "music" => Some(Self::Music),
            "realtime_session" => Some(Self::RealtimeSession),
            "realtime_client_secret" => Some(Self::RealtimeClientSecret),
            "realtime_call" => Some(Self::RealtimeCall),
            "realtime_transcription" => Some(Self::RealtimeTranscription),
            "realtime_translation" => Some(Self::RealtimeTranslation),
            _ => None,
        }
    }

    pub fn from_create_operation_id(operation_id: &str) -> Option<Self> {
        match operation_id {
            "speech.create" => Some(Self::Speech),
            "transcriptions.create" => Some(Self::Transcription),
            "translations.create" => Some(Self::Translation),
            "soundEffects.create" => Some(Self::SoundEffect),
            "music.create" => Some(Self::Music),
            _ => None,
        }
    }
}

impl VoiceTaskStatus {
    pub fn as_storage_value(self) -> &'static str {
        match self {
            Self::Queued => "queued",
            Self::Routing => "routing",
            Self::Submitted => "submitted",
            Self::Running => "running",
            Self::Succeeded => "succeeded",
            Self::Failed => "failed",
            Self::Cancelled => "cancelled",
            Self::Expired => "expired",
            Self::NeedsReview => "needs_review",
        }
    }

    pub fn from_storage_value(value: &str) -> Option<Self> {
        match value {
            "queued" => Some(Self::Queued),
            "routing" => Some(Self::Routing),
            "submitted" => Some(Self::Submitted),
            "running" => Some(Self::Running),
            "succeeded" => Some(Self::Succeeded),
            "failed" => Some(Self::Failed),
            "cancelled" => Some(Self::Cancelled),
            "expired" => Some(Self::Expired),
            "needs_review" => Some(Self::NeedsReview),
            _ => None,
        }
    }

    pub fn allows_cancel(self) -> bool {
        matches!(
            self,
            Self::Queued | Self::Routing | Self::Submitted | Self::Running
        )
    }

    pub fn is_terminal(self) -> bool {
        matches!(
            self,
            Self::Succeeded
                | Self::Failed
                | Self::Cancelled
                | Self::Expired
                | Self::NeedsReview
        )
    }
}
