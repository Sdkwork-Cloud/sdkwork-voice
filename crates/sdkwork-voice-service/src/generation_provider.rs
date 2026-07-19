use std::sync::Arc;

use async_trait::async_trait;
use sdkwork_voice_generation_provider_spi::{
    NormalizedVoiceGenerationResult, VoiceGenerationProviderDescriptor,
    VoiceGenerationProviderError, VoiceGenerationProviderRegistry, VoiceGenerationProviderResult,
    VoiceProviderDispatchPlan, VoiceProviderSubmission, VoiceSpeechGenerationCommand,
};

#[async_trait]
pub trait VoiceGenerationServicePort: Send + Sync {
    async fn generate_speech(
        &self,
        command: VoiceSpeechGenerationCommand,
    ) -> VoiceGenerationProviderResult<VoiceProviderSubmission>;

    async fn retrieve(
        &self,
        dispatch_plan: &VoiceProviderDispatchPlan,
        provider_task_id: &str,
    ) -> VoiceGenerationProviderResult<NormalizedVoiceGenerationResult>;

    async fn cancel(
        &self,
        dispatch_plan: &VoiceProviderDispatchPlan,
        provider_task_id: &str,
    ) -> VoiceGenerationProviderResult<NormalizedVoiceGenerationResult>;

    fn provider_descriptors(&self) -> Vec<VoiceGenerationProviderDescriptor>;
}

#[derive(Clone)]
pub struct VoiceGenerationService {
    providers: Arc<VoiceGenerationProviderRegistry>,
}

impl VoiceGenerationService {
    pub fn new(providers: VoiceGenerationProviderRegistry) -> Self {
        Self {
            providers: Arc::new(providers),
        }
    }

    fn provider_for_dispatch(
        &self,
        dispatch_plan: &VoiceProviderDispatchPlan,
    ) -> VoiceGenerationProviderResult<
        Arc<dyn sdkwork_voice_generation_provider_spi::VoiceGenerationProvider>,
    > {
        if !dispatch_plan.provider_id.trim().is_empty() {
            return self.providers.select_by_id(&dispatch_plan.provider_id);
        }
        self.providers.select_for_vendor(&dispatch_plan.vendor)
    }
}

#[async_trait]
impl VoiceGenerationServicePort for VoiceGenerationService {
    async fn generate_speech(
        &self,
        command: VoiceSpeechGenerationCommand,
    ) -> VoiceGenerationProviderResult<VoiceProviderSubmission> {
        let provider = self.providers.select_for_vendor(&command.vendor)?;
        provider.validate(&command)?;
        provider.generate(&command).await
    }

    async fn retrieve(
        &self,
        dispatch_plan: &VoiceProviderDispatchPlan,
        provider_task_id: &str,
    ) -> VoiceGenerationProviderResult<NormalizedVoiceGenerationResult> {
        if provider_task_id.trim().is_empty() {
            return Err(VoiceGenerationProviderError::InvalidRequest(
                "provider_task_id is required".to_string(),
            ));
        }
        self.provider_for_dispatch(dispatch_plan)?
            .retrieve(dispatch_plan, provider_task_id.trim())
            .await
    }

    async fn cancel(
        &self,
        dispatch_plan: &VoiceProviderDispatchPlan,
        provider_task_id: &str,
    ) -> VoiceGenerationProviderResult<NormalizedVoiceGenerationResult> {
        if provider_task_id.trim().is_empty() {
            return Err(VoiceGenerationProviderError::InvalidRequest(
                "provider_task_id is required".to_string(),
            ));
        }
        self.provider_for_dispatch(dispatch_plan)?
            .cancel(dispatch_plan, provider_task_id.trim())
            .await
    }

    fn provider_descriptors(&self) -> Vec<VoiceGenerationProviderDescriptor> {
        self.providers.descriptors()
    }
}
