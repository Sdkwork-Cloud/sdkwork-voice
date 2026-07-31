use std::collections::BTreeMap;

use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::Response,
    Json,
};
use sdkwork_routes_voice_http_auth::{
    finish_success, success_envelope, success_status_for_voice_backend_operation,
    voice_request_context_from_web, webhook_ingress_web_request_context,
};
use sdkwork_web_core::WebRequestContext;
use serde_json::Value;

use crate::service_port::VoiceBackendApiState;

pub async fn create_provider_route(
    State(state): State<VoiceBackendApiState>,
    app_ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    call_operation(
        state,
        app_ctx,
        "providerRoutes.create",
        BTreeMap::new(),
        body,
    )
    .await
}

pub async fn list_provider_routes(
    State(state): State<VoiceBackendApiState>,
    app_ctx: WebRequestContext,
    Query(query): Query<BTreeMap<String, String>>,
) -> Response {
    call_operation(
        state,
        app_ctx,
        "providerRoutes.list",
        BTreeMap::new(),
        query_body(query),
    )
    .await
}

pub async fn retrieve_provider_route(
    State(state): State<VoiceBackendApiState>,
    app_ctx: WebRequestContext,
    Path(provider_route_id): Path<String>,
) -> Response {
    call_single_param_operation(
        state,
        app_ctx,
        "providerRoutes.retrieve",
        "providerRouteId",
        provider_route_id,
        Value::Null,
    )
    .await
}

pub async fn update_provider_route(
    State(state): State<VoiceBackendApiState>,
    app_ctx: WebRequestContext,
    Path(provider_route_id): Path<String>,
    Json(body): Json<Value>,
) -> Response {
    call_single_param_operation(
        state,
        app_ctx,
        "providerRoutes.update",
        "providerRouteId",
        provider_route_id,
        body,
    )
    .await
}

pub async fn delete_provider_route(
    State(state): State<VoiceBackendApiState>,
    app_ctx: WebRequestContext,
    Path(provider_route_id): Path<String>,
) -> Response {
    call_single_param_operation(
        state,
        app_ctx,
        "providerRoutes.delete",
        "providerRouteId",
        provider_route_id,
        Value::Null,
    )
    .await
}

pub async fn list_tasks(
    State(state): State<VoiceBackendApiState>,
    app_ctx: WebRequestContext,
    Query(query): Query<BTreeMap<String, String>>,
) -> Response {
    call_operation(
        state,
        app_ctx,
        "tasks.list",
        BTreeMap::new(),
        query_body(query),
    )
    .await
}

pub async fn retrieve_task(
    State(state): State<VoiceBackendApiState>,
    app_ctx: WebRequestContext,
    Path(task_id): Path<String>,
) -> Response {
    call_single_param_operation(
        state,
        app_ctx,
        "tasks.retrieve",
        "taskId",
        task_id,
        Value::Null,
    )
    .await
}

pub async fn cancel_task(
    State(state): State<VoiceBackendApiState>,
    app_ctx: WebRequestContext,
    Path(task_id): Path<String>,
) -> Response {
    call_single_param_operation(
        state,
        app_ctx,
        "tasks.cancel",
        "taskId",
        task_id,
        Value::Null,
    )
    .await
}

pub async fn retry_task(
    State(state): State<VoiceBackendApiState>,
    app_ctx: WebRequestContext,
    Path(task_id): Path<String>,
) -> Response {
    call_single_param_operation(
        state,
        app_ctx,
        "tasks.retry",
        "taskId",
        task_id,
        Value::Null,
    )
    .await
}

pub async fn reconcile_task(
    State(state): State<VoiceBackendApiState>,
    app_ctx: WebRequestContext,
    Path(task_id): Path<String>,
    body: Option<Json<Value>>,
) -> Response {
    call_single_param_operation(
        state,
        app_ctx,
        "tasks.reconcile",
        "taskId",
        task_id,
        body.map(|Json(value)| value).unwrap_or(Value::Null),
    )
    .await
}

pub async fn list_task_events(
    State(state): State<VoiceBackendApiState>,
    app_ctx: WebRequestContext,
    Query(query): Query<BTreeMap<String, String>>,
) -> Response {
    call_operation(
        state,
        app_ctx,
        "taskEvents.list",
        BTreeMap::new(),
        query_body(query),
    )
    .await
}

pub async fn accept_provider_webhook_ingress(
    State(state): State<VoiceBackendApiState>,
    headers: HeaderMap,
    Path(provider_code): Path<String>,
    Json(body): Json<Value>,
) -> Response {
    let trace_id = sdkwork_utils_rust::uuid();
    let signature = headers
        .get("x-voice-webhook-signature")
        .and_then(|value| value.to_str().ok())
        .map(str::to_owned);

    let result = state
        .service()
        .accept_provider_webhook_ingress(provider_code, body, signature, trace_id.clone())
        .await;

    match result {
        Ok(data) => success_envelope(
            &webhook_ingress_web_request_context(trace_id),
            StatusCode::OK,
            data,
        ),
        Err(error) => error.into_response_for(&webhook_ingress_web_request_context(trace_id)),
    }
}

pub async fn list_provider_webhook_events(
    State(state): State<VoiceBackendApiState>,
    app_ctx: WebRequestContext,
    Query(query): Query<BTreeMap<String, String>>,
) -> Response {
    call_operation(
        state,
        app_ctx,
        "providerWebhookEvents.list",
        BTreeMap::new(),
        query_body(query),
    )
    .await
}

pub async fn replay_provider_webhook_event(
    State(state): State<VoiceBackendApiState>,
    app_ctx: WebRequestContext,
    Path(event_id): Path<String>,
) -> Response {
    call_single_param_operation(
        state,
        app_ctx,
        "providerWebhookEvents.replay",
        "eventId",
        event_id,
        Value::Null,
    )
    .await
}

pub async fn list_webhook_deliveries(
    State(state): State<VoiceBackendApiState>,
    app_ctx: WebRequestContext,
    Query(query): Query<BTreeMap<String, String>>,
) -> Response {
    call_operation(
        state,
        app_ctx,
        "webhookDeliveries.list",
        BTreeMap::new(),
        query_body(query),
    )
    .await
}

pub async fn list_request_logs(
    State(state): State<VoiceBackendApiState>,
    app_ctx: WebRequestContext,
    Query(query): Query<BTreeMap<String, String>>,
) -> Response {
    call_operation(
        state,
        app_ctx,
        "requestLogs.list",
        BTreeMap::new(),
        query_body(query),
    )
    .await
}

pub async fn list_artifact_drive_sync(
    State(state): State<VoiceBackendApiState>,
    app_ctx: WebRequestContext,
    Query(query): Query<BTreeMap<String, String>>,
) -> Response {
    call_operation(
        state,
        app_ctx,
        "artifactDriveSync.list",
        BTreeMap::new(),
        query_body(query),
    )
    .await
}

pub async fn retry_artifact_drive_sync(
    State(state): State<VoiceBackendApiState>,
    app_ctx: WebRequestContext,
    Path(sync_id): Path<String>,
) -> Response {
    call_single_param_operation(
        state,
        app_ctx,
        "artifactDriveSync.retry",
        "syncId",
        sync_id,
        Value::Null,
    )
    .await
}

pub async fn list_audio_artifacts(
    State(state): State<VoiceBackendApiState>,
    app_ctx: WebRequestContext,
    Query(query): Query<BTreeMap<String, String>>,
) -> Response {
    call_operation(
        state,
        app_ctx,
        "audioArtifacts.list",
        BTreeMap::new(),
        query_body(query),
    )
    .await
}

pub async fn retrieve_audio_artifact(
    State(state): State<VoiceBackendApiState>,
    app_ctx: WebRequestContext,
    Path(audio_artifact_id): Path<String>,
) -> Response {
    call_single_param_operation(
        state,
        app_ctx,
        "audioArtifacts.retrieve",
        "audioArtifactId",
        audio_artifact_id,
        Value::Null,
    )
    .await
}

pub async fn delete_audio_artifact(
    State(state): State<VoiceBackendApiState>,
    app_ctx: WebRequestContext,
    Path(audio_artifact_id): Path<String>,
) -> Response {
    call_single_param_operation(
        state,
        app_ctx,
        "audioArtifacts.delete",
        "audioArtifactId",
        audio_artifact_id,
        Value::Null,
    )
    .await
}

async fn call_single_param_operation(
    state: VoiceBackendApiState,
    app_ctx: WebRequestContext,
    operation_id: &'static str,
    param_key: &'static str,
    param_value: String,
    body: Value,
) -> Response {
    let mut path_params = BTreeMap::new();
    path_params.insert(param_key.to_owned(), param_value);
    call_operation(state, app_ctx, operation_id, path_params, body).await
}

async fn call_operation(
    state: VoiceBackendApiState,
    app_ctx: WebRequestContext,
    operation_id: &'static str,
    path_params: BTreeMap<String, String>,
    body: Value,
) -> Response {
    let result = async {
        let request_context = voice_request_context_from_web(&app_ctx)?;
        let service = state.service().clone();
        let response = service
            .handle(request_context, operation_id, path_params, body)
            .await?;
        finish_success(
            &app_ctx,
            success_status_for_voice_backend_operation(operation_id),
            response,
        )
    }
    .await;

    match result {
        Ok(response) => response,
        Err(error) => error.into_response_for(&app_ctx),
    }
}

fn query_body(query: BTreeMap<String, String>) -> Value {
    Value::Object(
        query
            .into_iter()
            .map(|(key, value)| (key, Value::String(value)))
            .collect(),
    )
}
