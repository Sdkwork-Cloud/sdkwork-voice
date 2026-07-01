use std::{collections::BTreeMap, sync::Arc};

use async_trait::async_trait;
use serde_json::Value;

pub use sdkwork_routes_voice_http_auth::{
    VoiceAuthError, VoiceRequestContext, VoiceRouteError,
};

#[async_trait]
pub trait VoiceBackendApiServicePort: Send + Sync {
    async fn handle(
        &self,
        context: VoiceRequestContext,
        operation_id: &'static str,
        path_params: BTreeMap<String, String>,
        body: Value,
    ) -> Result<Value, VoiceRouteError>;

    async fn accept_provider_webhook_ingress(
        &self,
        provider_code: String,
        body: Value,
        signature_header: Option<String>,
    ) -> Result<Value, VoiceRouteError>;
}

#[derive(Clone)]
pub struct VoiceBackendApiState {
    service: Arc<dyn VoiceBackendApiServicePort>,
}

impl VoiceBackendApiState {
    pub fn new(service: Arc<dyn VoiceBackendApiServicePort>) -> Self {
        Self { service }
    }

    pub fn service(&self) -> Arc<dyn VoiceBackendApiServicePort> {
        Arc::clone(&self.service)
    }
}
