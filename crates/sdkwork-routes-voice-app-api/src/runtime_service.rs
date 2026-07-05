use std::collections::BTreeMap;

use async_trait::async_trait;
use axum::http::StatusCode;
use sdkwork_voice_contract::{VoiceRuntimeContext, VoiceServiceError};
use sdkwork_voice_service::{handle_voice_app_operation, VoiceRepositoryPort, VoiceRuntimePorts};
use serde_json::Value;

use crate::service_port::{VoiceAppApiServicePort, VoiceRequestContext, VoiceRouteError};

pub struct VoiceAppRuntimeService<Repository> {
    repository: Repository,
}

impl<Repository> VoiceAppRuntimeService<Repository> {
    pub fn new(repository: Repository) -> Self {
        Self { repository }
    }
}

#[async_trait]
impl<Repository> VoiceAppApiServicePort for VoiceAppRuntimeService<Repository>
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
        handle_voice_app_operation(
            &runtime_context_from_route(context),
            operation_id,
            path_params,
            body,
            &VoiceRuntimePorts {
                repository: &self.repository,
                drive_sync_processor: None,
            },
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
        permission_scopes: context.permission_scopes,
        trace_id: context.trace_id,
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
