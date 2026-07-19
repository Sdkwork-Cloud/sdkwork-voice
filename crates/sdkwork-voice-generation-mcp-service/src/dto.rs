use crate::McpToolError;
use base64::{engine::general_purpose::STANDARD, Engine};
use rmcp::schemars::JsonSchema;
use sdkwork_voice_service::{
    NormalizedVoiceGenerationResult, VoiceAudioFormat, VoiceGeneratedAudioSource,
    VoiceGenerationStatus, VoiceGenerationVendorParameters, VoiceProviderSubmission,
    VoiceSpeechGenerationCommand, VoiceVendorId,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Clone, Debug, Deserialize, JsonSchema, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VendorParametersInput {
    pub schema: String,
    pub values: Value,
}

#[derive(Clone, Copy, Debug, Deserialize, JsonSchema, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum VoiceAudioFormatInput {
    Aac,
    Flac,
    Mp3,
    Opus,
    Pcm,
    Wav,
}

#[derive(Clone, Debug, Deserialize, JsonSchema, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SynthesizeVoiceInput {
    pub vendor: String,
    pub model: String,
    pub input: String,
    pub voice: String,
    #[serde(default = "default_format")]
    pub response_format: VoiceAudioFormatInput,
    #[serde(default)]
    pub speed: Option<f64>,
    #[serde(default)]
    pub instructions: Option<String>,
    #[serde(default)]
    pub callback_url: Option<String>,
    #[serde(default)]
    pub idempotency_key: Option<String>,
    #[serde(default)]
    pub vendor_parameters: Option<VendorParametersInput>,
}

#[derive(Clone, Debug, Deserialize, JsonSchema, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceTaskInput {
    pub task_handle: String,
}

#[derive(Clone, Debug, JsonSchema, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceGenerationResult {
    pub vendor: String,
    pub task_handle: Option<String>,
    pub status: String,
    pub terminal: bool,
    pub outputs: Vec<VoiceOutput>,
    pub error_code: Option<String>,
    pub error_message: Option<String>,
}

#[derive(Clone, Debug, JsonSchema, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceOutput {
    pub output_index: i32,
    pub audio_base64: Option<String>,
    pub url: Option<String>,
    pub file_name: String,
    pub mime_type: String,
}

impl TryFrom<SynthesizeVoiceInput> for VoiceSpeechGenerationCommand {
    type Error = McpToolError;
    fn try_from(input: SynthesizeVoiceInput) -> Result<Self, Self::Error> {
        Ok(Self {
            vendor: VoiceVendorId::new(input.vendor).map_err(McpToolError::from)?,
            model: input.model,
            input: input.input,
            voice: input.voice,
            response_format: input.response_format.into(),
            speed: input.speed,
            instructions: input.instructions,
            callback_url: input.callback_url,
            idempotency_key: input.idempotency_key,
            vendor_parameters: input.vendor_parameters.map(|parameters| {
                VoiceGenerationVendorParameters {
                    schema: parameters.schema,
                    values: parameters.values,
                }
            }),
        })
    }
}

impl From<VoiceAudioFormatInput> for VoiceAudioFormat {
    fn from(value: VoiceAudioFormatInput) -> Self {
        match value {
            VoiceAudioFormatInput::Aac => Self::Aac,
            VoiceAudioFormatInput::Flac => Self::Flac,
            VoiceAudioFormatInput::Mp3 => Self::Mp3,
            VoiceAudioFormatInput::Opus => Self::Opus,
            VoiceAudioFormatInput::Pcm => Self::Pcm,
            VoiceAudioFormatInput::Wav => Self::Wav,
        }
    }
}

impl VoiceGenerationResult {
    pub(crate) fn from_submission(
        submission: &VoiceProviderSubmission,
        task_handle: Option<String>,
    ) -> Self {
        Self::from_normalized(&submission.result, task_handle)
    }
    pub(crate) fn from_normalized(
        result: &NormalizedVoiceGenerationResult,
        task_handle: Option<String>,
    ) -> Self {
        Self {
            vendor: result.vendor.clone(),
            task_handle,
            status: status_name(result.status).into(),
            terminal: result.terminal,
            outputs: result
                .outputs
                .iter()
                .map(|output| {
                    let (audio_base64, url) = match &output.source {
                        VoiceGeneratedAudioSource::Inline(bytes) => {
                            (Some(STANDARD.encode(bytes)), None)
                        }
                        VoiceGeneratedAudioSource::ProviderUrl(url) => (None, Some(url.clone())),
                    };
                    VoiceOutput {
                        output_index: output.output_index,
                        audio_base64,
                        url,
                        file_name: output.file_name.clone(),
                        mime_type: output.mime_type.clone(),
                    }
                })
                .collect(),
            error_code: result.error_code.clone(),
            error_message: result.error_message.clone(),
        }
    }
}

fn status_name(status: VoiceGenerationStatus) -> &'static str {
    match status {
        VoiceGenerationStatus::Submitted => "submitted",
        VoiceGenerationStatus::Running => "running",
        VoiceGenerationStatus::Succeeded => "succeeded",
        VoiceGenerationStatus::Failed => "failed",
        VoiceGenerationStatus::Cancelled => "cancelled",
    }
}
fn default_format() -> VoiceAudioFormatInput {
    VoiceAudioFormatInput::Mp3
}
