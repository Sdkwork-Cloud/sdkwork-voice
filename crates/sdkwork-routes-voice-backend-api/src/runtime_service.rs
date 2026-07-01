use std::collections::BTreeMap;
use std::sync::Arc;

use async_trait::async_trait;
use axum::http::StatusCode;
use sdkwork_voice_contract::{VoiceRuntimeContext, VoiceServiceError};
use sdkwork_voice_service::{
    handle_voice_backend_operation, VoiceArtifactDriveSyncProcessorPort, VoiceRepositoryPort,
    VoiceRuntimePorts,
};
use serde_json::Value;

use crate::service_port::{VoiceBackendApiServicePort, VoiceRequestContext, VoiceRouteError};

pub struct VoiceBackendRuntimeService<Repository> {
    repository: Repository,
    drive_sync_processor: Option<Arc<dyn VoiceArtifactDriveSyncProcessorPort>>,
}

impl<Repository> VoiceBackendRuntimeService<Repository> {
    pub fn new(repository: Repository) -> Self {
        Self {
            repository,
            drive_sync_processor: None,
        }
    }

    pub fn with_drive_sync_processor(
        mut self,
        processor: Arc<dyn VoiceArtifactDriveSyncProcessorPort>,
    ) -> Self {
        self.drive_sync_processor = Some(processor);
        self
    }
}

impl<Repository: VoiceRepositoryPort> VoiceBackendRuntimeService<Repository> {
    fn runtime_ports(&self) -> VoiceRuntimePorts<'_> {
        VoiceRuntimePorts {
            repository: &self.repository,
            drive_sync_processor: self
                .drive_sync_processor
                .as_deref()
                .map(|processor| processor as &dyn VoiceArtifactDriveSyncProcessorPort),
        }
    }
}

#[async_trait]
impl<Repository> VoiceBackendApiServicePort for VoiceBackendRuntimeService<Repository>
where
    Repository: VoiceRepositoryPort + Send + Sync + 'static,
{
    async fn handle(
        &self,
        context: VoiceRequestContext,
        operation_id: &'static str,
        path_params: BTreeMap<String, String>,
        body: Value,
    ) -> Result<Value, VoiceRouteError> {
        handle_voice_backend_operation(
            &runtime_context_from_route(context),
            operation_id,
            path_params,
            body,
            &self.runtime_ports(),
        )
        .await
        .map_err(route_error_from_runtime)
    }

    async fn accept_provider_webhook_ingress(
        &self,
        provider_code: String,
        body: Value,
        signature_header: Option<String>,
    ) -> Result<Value, VoiceRouteError> {
        sdkwork_voice_service::handle_voice_provider_webhook_ingress(
            &provider_code,
            body,
            signature_header.as_deref(),
            &self.runtime_ports(),
        )
        .await
        .map_err(route_error_from_runtime)
    }
}

fn runtime_context_from_route(context: VoiceRequestContext) -> VoiceRuntimeContext {
    VoiceRuntimeContext {
        tenant_id: context.tenant_id,
        organization_id: context.organization_id,
        user_id: context.user_id,
    }
}

fn route_error_from_runtime(error: VoiceServiceError) -> VoiceRouteError {
    let status = match error.code() {
        "unauthenticated" => StatusCode::UNAUTHORIZED,
        "unauthorized" => StatusCode::FORBIDDEN,
        "not-found" => StatusCode::NOT_FOUND,
        "conflict" | "invalid-state" => StatusCode::CONFLICT,
        "validation" => StatusCode::BAD_REQUEST,
        "transport" => StatusCode::BAD_GATEWAY,
        "provider-unavailable" => StatusCode::SERVICE_UNAVAILABLE,
        "storage" | "unknown" => StatusCode::INTERNAL_SERVER_ERROR,
        _ => StatusCode::INTERNAL_SERVER_ERROR,
    };
    VoiceRouteError::from_wire(status, error.code(), error.message())
}
