use std::sync::Arc;

use sdkwork_voice_service::{
    NormalizedVoiceGenerationResult, VoiceAudioFormat, VoiceGeneratedAudio,
    VoiceGeneratedAudioSource, VoiceGenerationProvider, VoiceGenerationProviderDescriptor,
    VoiceGenerationProviderRegistry, VoiceGenerationProviderResult, VoiceGenerationService,
    VoiceGenerationServicePort, VoiceGenerationStatus, VoiceProviderDispatchPlan,
    VoiceProviderSubmission, VoiceProviderTaskMode, VoiceSpeechGenerationCommand, VoiceVendorId,
};

struct FakeProvider {
    descriptor: VoiceGenerationProviderDescriptor,
}

#[async_trait::async_trait]
impl VoiceGenerationProvider for FakeProvider {
    fn descriptor(&self) -> &VoiceGenerationProviderDescriptor {
        &self.descriptor
    }

    fn validate(
        &self,
        command: &VoiceSpeechGenerationCommand,
    ) -> VoiceGenerationProviderResult<()> {
        command.validate()
    }

    async fn generate(
        &self,
        command: &VoiceSpeechGenerationCommand,
    ) -> VoiceGenerationProviderResult<VoiceProviderSubmission> {
        Ok(VoiceProviderSubmission {
            dispatch_plan: VoiceProviderDispatchPlan {
                provider_id: self.descriptor.id.clone(),
                vendor: command.vendor.clone(),
                model: command.model.clone(),
                task_mode: VoiceProviderTaskMode::Synchronous,
                response_format: command.response_format,
            },
            result: NormalizedVoiceGenerationResult {
                vendor: command.vendor.to_string(),
                provider_task_id: None,
                status: VoiceGenerationStatus::Succeeded,
                terminal: true,
                outputs: vec![VoiceGeneratedAudio {
                    output_index: 0,
                    source: VoiceGeneratedAudioSource::Inline(vec![1, 2, 3]),
                    file_name: "speech-0000.mp3".to_string(),
                    mime_type: "audio/mpeg".to_string(),
                }],
                error_code: None,
                error_message: None,
            },
        })
    }
}

#[tokio::test]
async fn unified_voice_service_dispatches_through_injected_spi() {
    let provider = Arc::new(FakeProvider {
        descriptor: VoiceGenerationProviderDescriptor {
            id: "fake-voice-provider".to_string(),
            vendors: vec![VoiceVendorId::new("openai").expect("vendor")],
            capabilities: Vec::new(),
        },
    });
    let registry = VoiceGenerationProviderRegistry::builder()
        .register(provider)
        .expect("provider")
        .default_provider("fake-voice-provider")
        .build()
        .expect("registry");
    let service = VoiceGenerationService::new(registry);
    let submission = service
        .generate_speech(VoiceSpeechGenerationCommand {
            vendor: VoiceVendorId::new("openai").expect("vendor"),
            model: "tts-model".to_string(),
            input: "Hello".to_string(),
            voice: "alloy".to_string(),
            response_format: VoiceAudioFormat::Mp3,
            speed: None,
            instructions: None,
            callback_url: None,
            idempotency_key: None,
            vendor_parameters: None,
        })
        .await
        .expect("submission");
    assert_eq!(submission.dispatch_plan.provider_id, "fake-voice-provider");
    assert_eq!(submission.result.outputs.len(), 1);
}
