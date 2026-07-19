use crate::VoiceGenerationProviderError;

#[derive(Clone, Debug, Eq, Hash, PartialEq, serde::Deserialize, serde::Serialize)]
#[serde(transparent)]
pub struct VoiceVendorId(String);

impl VoiceVendorId {
    pub fn new(value: impl Into<String>) -> Result<Self, VoiceGenerationProviderError> {
        let value = value.into().trim().to_ascii_lowercase().replace('_', "-");
        if value.is_empty() {
            return Err(VoiceGenerationProviderError::InvalidRequest(
                "vendor is required".to_string(),
            ));
        }
        if !value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || byte == b'-')
        {
            return Err(VoiceGenerationProviderError::InvalidRequest(
                "vendor must use lowercase letters, digits, or hyphens".to_string(),
            ));
        }
        Ok(Self(value))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl std::fmt::Display for VoiceVendorId {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(self.as_str())
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum VoiceAudioFormat {
    Aac,
    Flac,
    Mp3,
    Opus,
    Pcm,
    Wav,
}

impl VoiceAudioFormat {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Aac => "aac",
            Self::Flac => "flac",
            Self::Mp3 => "mp3",
            Self::Opus => "opus",
            Self::Pcm => "pcm",
            Self::Wav => "wav",
        }
    }

    pub fn mime_type(self) -> &'static str {
        match self {
            Self::Aac => "audio/aac",
            Self::Flac => "audio/flac",
            Self::Mp3 => "audio/mpeg",
            Self::Opus => "audio/ogg",
            Self::Pcm => "audio/L16",
            Self::Wav => "audio/wav",
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq, serde::Deserialize, serde::Serialize)]
pub struct VoiceGenerationVendorParameters {
    pub schema: String,
    pub values: serde_json::Value,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceSpeechGenerationCommand {
    pub vendor: VoiceVendorId,
    pub model: String,
    pub input: String,
    pub voice: String,
    pub response_format: VoiceAudioFormat,
    pub speed: Option<f64>,
    pub instructions: Option<String>,
    pub callback_url: Option<String>,
    pub idempotency_key: Option<String>,
    pub vendor_parameters: Option<VoiceGenerationVendorParameters>,
}

impl VoiceSpeechGenerationCommand {
    pub fn validate(&self) -> Result<(), VoiceGenerationProviderError> {
        for (value, name) in [
            (&self.model, "model"),
            (&self.input, "input"),
            (&self.voice, "voice"),
        ] {
            if value.trim().is_empty() {
                return Err(VoiceGenerationProviderError::InvalidRequest(format!(
                    "{name} is required"
                )));
            }
        }
        if self
            .speed
            .is_some_and(|speed| !(0.25..=4.0).contains(&speed))
        {
            return Err(VoiceGenerationProviderError::InvalidRequest(
                "speed must be between 0.25 and 4.0".to_string(),
            ));
        }
        Ok(())
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum VoiceProviderTaskMode {
    Synchronous,
    Task,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceProviderDispatchPlan {
    pub provider_id: String,
    pub vendor: VoiceVendorId,
    pub model: String,
    pub task_mode: VoiceProviderTaskMode,
    pub response_format: VoiceAudioFormat,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum VoiceGeneratedAudioSource {
    Inline(Vec<u8>),
    ProviderUrl(String),
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoiceGeneratedAudio {
    pub output_index: i32,
    pub source: VoiceGeneratedAudioSource,
    pub file_name: String,
    pub mime_type: String,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum VoiceGenerationStatus {
    Submitted,
    Running,
    Succeeded,
    Failed,
    Cancelled,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NormalizedVoiceGenerationResult {
    pub vendor: String,
    pub provider_task_id: Option<String>,
    pub status: VoiceGenerationStatus,
    pub terminal: bool,
    pub outputs: Vec<VoiceGeneratedAudio>,
    pub error_code: Option<String>,
    pub error_message: Option<String>,
}
