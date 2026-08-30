use cloudrouter_open_sdk::SdkworkAiClient;
use sdkwork_voice_generation_provider_spi::{
    VoiceGenerationProvider, VoiceGenerationProviderCapability, VoiceGenerationProviderDescriptor,
    VoiceGenerationProviderError, VoiceGenerationProviderResult, VoiceProviderDispatchPlan,
    VoiceProviderSubmission, VoiceProviderTaskMode, VoiceSpeechGenerationCommand, VoiceVendorId,
};

use crate::normalization::normalize_speech_result;
use crate::requests::build_speech_generation_request;
use crate::routing::VOICE_GENERATION_PROVIDER_ADAPTER_ID;

#[derive(Clone)]
pub struct VoiceGenerationProviderAdapter {
    client: SdkworkAiClient,
    descriptor: VoiceGenerationProviderDescriptor,
}

impl VoiceGenerationProviderAdapter {
    pub fn new(client: SdkworkAiClient) -> Self {
        Self {
            client,
            descriptor: VoiceGenerationProviderDescriptor {
                id: VOICE_GENERATION_PROVIDER_ADAPTER_ID.to_string(),
                vendors: ["openai", "openai-compatible"]
                    .into_iter()
                    .map(|vendor| VoiceVendorId::new(vendor).expect("static voice vendor"))
                    .collect(),
                capabilities: vec![
                    VoiceGenerationProviderCapability::Speech,
                    VoiceGenerationProviderCapability::InlineAudio,
                    VoiceGenerationProviderCapability::ProviderUrl,
                ],
            },
        }
    }
}

#[async_trait::async_trait]
impl VoiceGenerationProvider for VoiceGenerationProviderAdapter {
    fn descriptor(&self) -> &VoiceGenerationProviderDescriptor {
        &self.descriptor
    }

    fn validate(
        &self,
        command: &VoiceSpeechGenerationCommand,
    ) -> VoiceGenerationProviderResult<()> {
        if !self.descriptor.supports_vendor(&command.vendor) {
            return Err(VoiceGenerationProviderError::UnsupportedVendor(
                command.vendor.to_string(),
            ));
        }
        command.validate()?;
        build_speech_generation_request(command)?;
        Ok(())
    }

    async fn generate(
        &self,
        command: &VoiceSpeechGenerationCommand,
    ) -> VoiceGenerationProviderResult<VoiceProviderSubmission> {
        self.validate(command)?;
        let request = build_speech_generation_request(command)?;
        let payload = self
            .client
            .audio()
            .create_speech(&request)
            .await
            .map_err(map_sdk_error)?;
        Ok(VoiceProviderSubmission {
            dispatch_plan: VoiceProviderDispatchPlan {
                provider_id: self.descriptor.id.clone(),
                vendor: command.vendor.clone(),
                model: command.model.trim().to_string(),
                task_mode: VoiceProviderTaskMode::Synchronous,
                response_format: command.response_format,
            },
            result: normalize_speech_result(command, payload),
        })
    }
}

fn map_sdk_error(error: cloudrouter_open_sdk::SdkworkError) -> VoiceGenerationProviderError {
    match error {
        cloudrouter_open_sdk::SdkworkError::Http(error) if error.is_timeout() => {
            VoiceGenerationProviderError::Timeout(error.to_string())
        }
        cloudrouter_open_sdk::SdkworkError::Http(error) => {
            VoiceGenerationProviderError::Transport(error.to_string())
        }
        cloudrouter_open_sdk::SdkworkError::HttpStatus { status: 408, body } => {
            VoiceGenerationProviderError::Timeout(body)
        }
        cloudrouter_open_sdk::SdkworkError::HttpStatus { status: 429, body } => {
            VoiceGenerationProviderError::RateLimited(body)
        }
        cloudrouter_open_sdk::SdkworkError::HttpStatus { status, body } if status >= 500 => {
            VoiceGenerationProviderError::ProviderUnavailable(format!(
                "http status {status}: {body}"
            ))
        }
        cloudrouter_open_sdk::SdkworkError::HttpStatus { status, body } => {
            VoiceGenerationProviderError::Rejected(format!("http status {status}: {body}"))
        }
        cloudrouter_open_sdk::SdkworkError::Serialization(error) => {
            VoiceGenerationProviderError::InvalidProviderResponse(error.to_string())
        }
        cloudrouter_open_sdk::SdkworkError::ResponseBodyTooLarge { .. } => {
            VoiceGenerationProviderError::InvalidProviderResponse(error.to_string())
        }
        cloudrouter_open_sdk::SdkworkError::ApiStatus { code, trace_id } => {
            VoiceGenerationProviderError::Rejected(format!("api status {code} (traceId={trace_id})"))
        }
        cloudrouter_open_sdk::SdkworkError::MissingAccessToken => {
            VoiceGenerationProviderError::Configuration(error.to_string())
        }
        error @ (cloudrouter_open_sdk::SdkworkError::InvalidHeaderName(_)
        | cloudrouter_open_sdk::SdkworkError::InvalidHeaderValue(_)
        | cloudrouter_open_sdk::SdkworkError::InvalidHttpMethod(_)) => {
            VoiceGenerationProviderError::Configuration(error.to_string())
        }
    }
}
