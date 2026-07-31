use std::{collections::BTreeMap, sync::Arc};

use async_trait::async_trait;
use serde_json::Value;

pub use sdkwork_routes_voice_http_auth::{VoiceAuthError, VoiceRequestContext, VoiceRouteError};

#[async_trait]
pub trait VoiceAppApiServicePort: Send + Sync {
    async fn handle(
        &self,
        context: VoiceRequestContext,
        operation_id: &'static str,
        path_params: BTreeMap<String, String>,
        body: Value,
    ) -> Result<Value, VoiceRouteError>;
}

#[derive(Clone)]
pub struct VoiceAppApiState {
    service: Arc<dyn VoiceAppApiServicePort>,
}

impl VoiceAppApiState {
    pub fn new(service: Arc<dyn VoiceAppApiServicePort>) -> Self {
        Self { service }
    }

    pub fn service(&self) -> Arc<dyn VoiceAppApiServicePort> {
        Arc::clone(&self.service)
    }
}
