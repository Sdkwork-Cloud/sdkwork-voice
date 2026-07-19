use async_trait::async_trait;

use crate::{
    NormalizedVoiceGenerationResult, VoiceGenerationProviderError, VoiceGenerationProviderResult,
    VoiceProviderDispatchPlan, VoiceSpeechGenerationCommand, VoiceVendorId,
};

#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub enum VoiceGenerationProviderCapability {
    Speech,
    InlineAudio,
    ProviderUrl,
    Polling,
    Cancellation,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoiceGenerationProviderDescriptor {
    pub id: String,
    pub vendors: Vec<VoiceVendorId>,
    pub capabilities: Vec<VoiceGenerationProviderCapability>,
}

impl VoiceGenerationProviderDescriptor {
    pub fn supports_vendor(&self, vendor: &VoiceVendorId) -> bool {
        self.vendors.iter().any(|candidate| candidate == vendor)
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceProviderSubmission {
    pub dispatch_plan: VoiceProviderDispatchPlan,
    pub result: NormalizedVoiceGenerationResult,
}

#[async_trait]
pub trait VoiceGenerationProvider: Send + Sync {
    fn descriptor(&self) -> &VoiceGenerationProviderDescriptor;

    fn validate(&self, command: &VoiceSpeechGenerationCommand)
        -> VoiceGenerationProviderResult<()>;

    async fn generate(
        &self,
        command: &VoiceSpeechGenerationCommand,
    ) -> VoiceGenerationProviderResult<VoiceProviderSubmission>;

    async fn retrieve(
        &self,
        _dispatch_plan: &VoiceProviderDispatchPlan,
        _provider_task_id: &str,
    ) -> VoiceGenerationProviderResult<NormalizedVoiceGenerationResult> {
        Err(VoiceGenerationProviderError::UnsupportedCapability(
            "task retrieval".to_string(),
        ))
    }

    async fn cancel(
        &self,
        _dispatch_plan: &VoiceProviderDispatchPlan,
        _provider_task_id: &str,
    ) -> VoiceGenerationProviderResult<NormalizedVoiceGenerationResult> {
        Err(VoiceGenerationProviderError::UnsupportedCapability(
            "cancellation".to_string(),
        ))
    }
}
