use std::collections::BTreeMap;

use sdkwork_utils_rust::{format_datetime, now, PageInfo, PageMode};
use sdkwork_voice_contract::{
    VoiceOperationType, VoiceRuntimeContext, VoiceServiceError, VoiceTaskStatus,
};
use serde_json::{json, Value};

use crate::{
    NewVoiceArtifactDriveSync, NewVoiceAudioArtifact, NewVoiceProviderRoute,
    NewVoiceProviderWebhookEvent, NewVoiceRequestLog, NewVoiceTask, NewVoiceTaskEvent,
    VoiceArtifactDriveSyncListQuery, VoiceAudioArtifactListQuery, VoiceProviderRouteListQuery,
    VoiceProviderRouteUpdate, VoiceProviderWebhookEventListQuery, VoiceRequestLogListQuery,
    VoiceRuntimePorts, VoiceTaskEventListQuery, VoiceTaskListQuery, VoiceTaskProviderUpdate,
    VoiceTaskRecord, VoiceWebhookDeliveryListQuery,
};

const DEFAULT_PAGE_SIZE: i32 = 20;
const MAX_PAGE_SIZE: i32 = 100;

pub async fn handle_voice_app_operation(
    context: &VoiceRuntimeContext,
    operation_id: &str,
    path_params: BTreeMap<String, String>,
    body: Value,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    let started = std::time::Instant::now();
    validate_context(context)?;
    require_operation_permission(context, operation_id)?;
    tracing::info!(
        operation_id,
        tenant_id = %context.tenant_id,
        user_id = %context.user_id,
        "voice app operation"
    );

    let result = match operation_id {
        "speech.create"
        | "transcriptions.create"
        | "translations.create"
        | "soundEffects.create"
        | "music.create" => create_voice_task(context, operation_id, body, ports).await,
        "tasks.list" => list_voice_tasks(context, &body, false, ports).await,
        "tasks.retrieve" => {
            let task_id = parse_task_id(&path_params)?;
            retrieve_voice_task(context, task_id, ports).await
        }
        "tasks.cancel" => {
            let task_id = parse_task_id(&path_params)?;
            cancel_voice_task(context, task_id, ports).await
        }
        "taskEvents.list" => list_voice_task_events(context, &body, ports).await,
        "artifactDriveSync.list" => list_artifact_drive_sync(context, &body, ports).await,
        "audioAssets.list" => list_audio_assets(context, &body, ports).await,
        "audioAssets.retrieve" => {
            let artifact_id = parse_i64_param(&path_params, "audioAssetId")?;
            retrieve_audio_asset(context, artifact_id, ports).await
        }
        _ => Err(VoiceServiceError::validation(format!(
            "unsupported voice app operation: {operation_id}"
        ))),
    };
    record_request_log(context, operation_id, started, result.is_ok(), ports).await;
    result
}

pub async fn handle_voice_backend_operation(
    context: &VoiceRuntimeContext,
    operation_id: &str,
    path_params: BTreeMap<String, String>,
    body: Value,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    let started = std::time::Instant::now();
    validate_context(context)?;
    require_operation_permission(context, operation_id)?;
    tracing::info!(
        operation_id,
        tenant_id = %context.tenant_id,
        "voice backend operation"
    );

    let result = match operation_id {
        "providerRoutes.create" => create_provider_route(&body, ports).await,
        "providerRoutes.list" => list_provider_routes(&body, ports).await,
        "providerRoutes.retrieve" => {
            let route_id = parse_i64_param(&path_params, "providerRouteId")?;
            retrieve_provider_route(route_id, ports).await
        }
        "providerRoutes.update" => {
            let route_id = parse_i64_param(&path_params, "providerRouteId")?;
            update_provider_route(route_id, &body, ports).await
        }
        "providerRoutes.delete" => {
            let route_id = parse_i64_param(&path_params, "providerRouteId")?;
            delete_provider_route(route_id, ports).await
        }
        "tasks.list" => list_voice_tasks(context, &body, true, ports).await,
        "tasks.retrieve" => {
            let task_id = parse_task_id(&path_params)?;
            retrieve_voice_task(context, task_id, ports).await
        }
        "tasks.cancel" => {
            let task_id = parse_task_id(&path_params)?;
            cancel_voice_task(context, task_id, ports).await
        }
        "tasks.retry" | "tasks.reconcile" => {
            let task_id = parse_task_id(&path_params)?;
            retry_voice_task(context, task_id, operation_id, &body, ports).await
        }
        "taskEvents.list" => list_voice_task_events(context, &body, ports).await,
        "providerWebhookEvents.list" => list_provider_webhook_events(&body, ports).await,
        "providerWebhookEvents.replay" => {
            let event_id = parse_i64_param(&path_params, "eventId")?;
            replay_provider_webhook_event(context, event_id, ports).await
        }
        "webhookDeliveries.list" => list_webhook_deliveries(&body, ports).await,
        "requestLogs.list" => list_request_logs(context, &body, ports).await,
        "artifactDriveSync.list" => list_artifact_drive_sync(context, &body, ports).await,
        "artifactDriveSync.retry" => {
            let sync_id = parse_i64_param(&path_params, "syncId")?;
            retry_artifact_drive_sync(sync_id, ports).await
        }
        "audioArtifacts.list" => list_audio_assets(context, &body, ports).await,
        "audioArtifacts.retrieve" => {
            let artifact_id = parse_i64_param(&path_params, "audioArtifactId")?;
            retrieve_audio_asset(context, artifact_id, ports).await
        }
        "audioArtifacts.delete" => {
            let artifact_id = parse_i64_param(&path_params, "audioArtifactId")?;
            delete_audio_asset(context, artifact_id, ports).await
        }
        _ => Err(VoiceServiceError::validation(format!(
            "unsupported voice backend operation: {operation_id}"
        ))),
    };
    record_request_log(context, operation_id, started, result.is_ok(), ports).await;
    result
}

pub async fn handle_voice_provider_webhook_ingress(
    provider_code: &str,
    body: Value,
    signature_header: Option<&str>,
    trace_id: &str,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    verify_provider_webhook_signature(provider_code, &body, signature_header)?;
    accept_provider_webhook(provider_code, &body, trace_id, ports).await
}

fn verify_provider_webhook_signature(
    provider_code: &str,
    body: &Value,
    signature_header: Option<&str>,
) -> Result<(), VoiceServiceError> {
    if voice_webhook_dev_mode_enabled() {
        return Ok(());
    }

    let secret = webhook_secret_for_provider(provider_code).ok_or_else(|| {
        VoiceServiceError::unauthenticated(format!(
            "webhook secret is not configured for provider `{provider_code}`"
        ))
    })?;

    let signature = signature_header
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .or_else(|| {
            body.get("signature")
                .and_then(Value::as_str)
                .map(str::trim)
                .filter(|value| !value.is_empty())
        })
        .ok_or_else(|| {
            VoiceServiceError::unauthenticated(
                "provider webhook signature is required (X-Voice-Webhook-Signature header or body.signature)",
            )
        })?;

    let payload = body.get("payload").cloned().unwrap_or_else(|| body.clone());
    let payload_bytes = payload.to_string();
    let expected = sdkwork_utils_rust::hmac_sha256(payload_bytes.as_bytes(), secret.as_bytes());
    if !constant_time_eq(signature.as_bytes(), expected.as_bytes()) {
        return Err(VoiceServiceError::unauthenticated(
            "provider webhook signature verification failed",
        ));
    }
    Ok(())
}

fn voice_webhook_dev_mode_enabled() -> bool {
    if is_production_deploy_env() {
        return false;
    }
    matches!(
        std::env::var("VOICE_WEBHOOK_DEV_MODE")
            .unwrap_or_default()
            .trim()
            .to_ascii_lowercase()
            .as_str(),
        "1" | "true" | "yes" | "on"
    )
}

fn is_production_deploy_env() -> bool {
    matches!(
        std::env::var("VOICE_DEPLOY_ENV")
            .or_else(|_| std::env::var("DEPLOY_ENV"))
            .unwrap_or_default()
            .trim()
            .to_ascii_lowercase()
            .as_str(),
        "production" | "prod"
    )
}

fn require_permission(
    context: &VoiceRuntimeContext,
    required: &str,
) -> Result<(), VoiceServiceError> {
    if context.permission_scopes.is_empty() {
        return Ok(());
    }
    if context
        .permission_scopes
        .iter()
        .any(|scope| scope == "voice.*" || scope == required)
    {
        return Ok(());
    }
    Err(VoiceServiceError::unauthorized(format!(
        "missing required permission scope: {required}"
    )))
}

fn require_operation_permission(
    context: &VoiceRuntimeContext,
    operation_id: &str,
) -> Result<(), VoiceServiceError> {
    let required = if operation_id.ends_with(".list")
        || operation_id.ends_with(".retrieve")
        || matches!(operation_id, "taskEvents.list" | "requestLogs.list")
    {
        "voice.tasks.read"
    } else if operation_id.starts_with("providerRoutes.") {
        if operation_id.ends_with(".list") || operation_id.ends_with(".retrieve") {
            "voice.providerRoutes.read"
        } else {
            "voice.providerRoutes.write"
        }
    } else if operation_id.starts_with("providerRoutes") {
        "voice.providerRoutes.write"
    } else {
        "voice.tasks.write"
    };
    require_permission(context, required)
}

async fn record_request_log(
    context: &VoiceRuntimeContext,
    operation_id: &str,
    started: std::time::Instant,
    succeeded: bool,
    ports: &VoiceRuntimePorts<'_>,
) {
    let tenant_id = parse_tenant_id(context).unwrap_or(0);
    let status = if succeeded { "succeeded" } else { "failed" };
    let log = NewVoiceRequestLog {
        id: next_voice_id(),
        request_id: format!("vr-{}", sdkwork_utils_rust::uuid()),
        trace_id: context.trace_id.clone(),
        tenant_id,
        capability: "voice".to_owned(),
        operation_id: operation_id.to_owned(),
        consumer: context.user_id.clone(),
        status: status.to_owned(),
        latency_ms: Some(started.elapsed().as_millis() as i64),
    };
    let _ = ports.repository.insert_request_log(log).await;
}

fn parse_tenant_id(context: &VoiceRuntimeContext) -> Result<i64, VoiceServiceError> {
    context
        .tenant_id
        .trim()
        .parse::<i64>()
        .map_err(|_| VoiceServiceError::unauthenticated("tenant_id must be a numeric identifier"))
}

fn is_terminal_task_status(status: &str) -> bool {
    VoiceTaskStatus::from_storage_value(status)
        .map(|value| value.is_terminal())
        .unwrap_or(false)
}

fn parse_i64(value: &str) -> i64 {
    value.trim().parse().unwrap_or(0)
}

fn webhook_secret_for_provider(provider_code: &str) -> Option<String> {
    let normalized = provider_code.trim().to_ascii_uppercase().replace('-', "_");
    let specific_key = format!("VOICE_WEBHOOK_SECRET_{normalized}");
    if let Ok(value) = std::env::var(&specific_key) {
        let trimmed = value.trim().to_string();
        if !trimmed.is_empty() {
            return Some(trimmed);
        }
    }
    std::env::var("VOICE_WEBHOOK_SECRET")
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn constant_time_eq(left: &[u8], right: &[u8]) -> bool {
    if left.len() != right.len() {
        return false;
    }
    left.iter()
        .zip(right.iter())
        .fold(0u8, |acc, (a, b)| acc | (a ^ b))
        == 0
}

async fn create_voice_task(
    context: &VoiceRuntimeContext,
    operation_id: &str,
    body: Value,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    let operation_type =
        VoiceOperationType::from_create_operation_id(operation_id).ok_or_else(|| {
            VoiceServiceError::validation(format!("unsupported create operation: {operation_id}"))
        })?;
    let tenant_id = parse_i64(&context.tenant_id);
    let organization_id = context
        .organization_id
        .as_deref()
        .map(parse_i64)
        .unwrap_or(0);
    let user_id = parse_i64(&context.user_id);
    let idempotency_key = string_field(&body, &["idempotencyKey", "idempotency_key"]);
    if let Some(key) = idempotency_key.as_deref() {
        if let Some(existing) = ports
            .repository
            .get_task_by_idempotency(tenant_id, operation_type.as_storage_value(), key)
            .await?
        {
            return Ok(json!({ "item": task_to_json(&existing) }));
        }
    }

    let provider_code = string_field(&body, &["provider", "providerCode", "provider_code"])
        .and_then(|value| {
            body.get("provider")
                .and_then(|provider| provider.get("providerCode"))
                .and_then(Value::as_str)
                .map(str::to_owned)
                .or(Some(value))
        })
        .unwrap_or_else(|| "default".to_owned());
    let provider_route_id = string_field(&body, &["providerRouteId", "provider_route_id"])
        .and_then(|value| value.parse::<i64>().ok());
    let model = string_field(&body, &["model"]);
    let now_text = format_datetime(now(), None);
    let task_id = next_voice_id();
    let task_no = format!("vt-{}", sdkwork_utils_rust::uuid());
    let request_json = serde_json::to_string(&body).map_err(|error| {
        VoiceServiceError::validation(format!("failed to serialize request body: {error}"))
    })?;

    let task = ports
        .repository
        .insert_task(NewVoiceTask {
            id: task_id,
            task_no,
            tenant_id,
            organization_id,
            user_id,
            operation_type: operation_type.as_storage_value().to_owned(),
            provider_code,
            provider_route_id,
            model,
            idempotency_key,
            request_json,
            normalized_options_json: None,
        })
        .await?;

    ports
        .repository
        .insert_task_event(NewVoiceTaskEvent {
            id: next_voice_id(),
            event_no: format!("ve-{}", sdkwork_utils_rust::uuid()),
            task_id: task.id,
            event_type: "voice.task.created".to_owned(),
            from_status: None,
            to_status: Some(VoiceTaskStatus::Queued.as_storage_value().to_owned()),
            payload_json: json!({ "operationId": operation_id }).to_string(),
            received_at: now_text.clone(),
        })
        .await?;

    Ok(json!({ "item": task_to_json(&task) }))
}

async fn list_voice_tasks(
    context: &VoiceRuntimeContext,
    body: &Value,
    admin: bool,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    let tenant_id = parse_i64(&context.tenant_id);
    let page = page_field(body, "page", 1);
    let page_size = page_size_field(body);
    let user_id = if admin {
        i64_field(body, &["userId", "user_id"])
    } else {
        Some(parse_i64(&context.user_id))
    };
    let page_result = ports
        .repository
        .list_tasks(VoiceTaskListQuery {
            tenant_id,
            organization_id: i64_field(body, &["organizationId", "organization_id"]).or_else(
                || {
                    context
                        .organization_id
                        .as_deref()
                        .map(parse_i64)
                        .filter(|_| !admin)
                },
            ),
            user_id,
            operation_type: string_field(body, &["operationType", "operation_type"]),
            status: string_field(body, &["status"]),
            page,
            page_size,
        })
        .await?;

    Ok(list_payload(
        page_result.items.iter().map(task_to_json).collect(),
        page,
        page_size,
        page_result.has_more,
    ))
}

async fn retrieve_voice_task(
    context: &VoiceRuntimeContext,
    task_id: i64,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    let tenant_id = parse_i64(&context.tenant_id);
    let task = ports
        .repository
        .get_task_by_id(tenant_id, task_id)
        .await?
        .ok_or_else(|| VoiceServiceError::not_found("voice task not found"))?;
    Ok(json!({ "item": task_to_json(&task) }))
}

async fn cancel_voice_task(
    context: &VoiceRuntimeContext,
    task_id: i64,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    let tenant_id = parse_i64(&context.tenant_id);
    let current = ports
        .repository
        .get_task_by_id(tenant_id, task_id)
        .await?
        .ok_or_else(|| VoiceServiceError::not_found("voice task not found"))?;
    let status = VoiceTaskStatus::from_storage_value(&current.status).ok_or_else(|| {
        VoiceServiceError::invalid_state(format!("unknown task status: {}", current.status))
    })?;
    if !status.allows_cancel() {
        return Err(VoiceServiceError::invalid_state(
            "task cannot be cancelled in current status",
        ));
    }
    let updated = ports
        .repository
        .update_task_status(
            task_id,
            VoiceTaskStatus::Cancelled.as_storage_value(),
            None,
            None,
        )
        .await?;
    let now_text = format_datetime(now(), None);
    ports
        .repository
        .insert_task_event(NewVoiceTaskEvent {
            id: next_voice_id(),
            event_no: format!("ve-{}", sdkwork_utils_rust::uuid()),
            task_id,
            event_type: "voice.task.cancelled".to_owned(),
            from_status: Some(current.status),
            to_status: Some(VoiceTaskStatus::Cancelled.as_storage_value().to_owned()),
            payload_json: json!({}).to_string(),
            received_at: now_text,
        })
        .await?;
    Ok(json!({ "item": task_to_json(&updated) }))
}

async fn retry_voice_task(
    context: &VoiceRuntimeContext,
    task_id: i64,
    operation_id: &str,
    body: &Value,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    require_permission(context, "voice.tasks.write")?;
    if operation_id == "tasks.reconcile" {
        if let Some(provider_result) = body
            .get("providerResult")
            .or_else(|| body.get("provider_result"))
        {
            return apply_task_provider_result(context, task_id, provider_result, ports).await;
        }
    }

    let tenant_id = parse_tenant_id(context)?;
    let current = ports
        .repository
        .get_task_by_id(tenant_id, task_id)
        .await?
        .ok_or_else(|| VoiceServiceError::not_found("voice task not found"))?;
    if is_terminal_task_status(&current.status) {
        return Err(VoiceServiceError::invalid_state(
            "voice task is terminal and cannot be retried",
        ));
    }
    let updated = ports
        .repository
        .update_task_status(
            task_id,
            VoiceTaskStatus::Queued.as_storage_value(),
            None,
            None,
        )
        .await?;
    let event_type = if operation_id == "tasks.reconcile" {
        "voice.task.reconciled"
    } else {
        "voice.task.retried"
    };
    ports
        .repository
        .insert_task_event(NewVoiceTaskEvent {
            id: next_voice_id(),
            event_no: format!("ve-{}", sdkwork_utils_rust::uuid()),
            task_id,
            event_type: event_type.to_owned(),
            from_status: Some(current.status),
            to_status: Some(VoiceTaskStatus::Queued.as_storage_value().to_owned()),
            payload_json: json!({ "operationId": operation_id }).to_string(),
            received_at: format_datetime(now(), None),
        })
        .await?;
    Ok(json!({ "item": task_to_json(&updated) }))
}

async fn apply_task_provider_result(
    context: &VoiceRuntimeContext,
    task_id: i64,
    provider_result: &Value,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    require_permission(context, "voice.tasks.write")?;
    let tenant_id = parse_tenant_id(context)?;
    let current = ports
        .repository
        .get_task_by_id(tenant_id, task_id)
        .await?
        .ok_or_else(|| VoiceServiceError::not_found("voice task not found"))?;

    let status = string_field(provider_result, &["status"])
        .unwrap_or_else(|| VoiceTaskStatus::Succeeded.as_storage_value().to_owned());
    let provider_task_id = string_field(provider_result, &["providerTaskId", "provider_task_id"]);
    let error_code = string_field(provider_result, &["errorCode", "error_code"]);
    let error_message = string_field(provider_result, &["errorMessage", "error_message"]);
    let provider_response = provider_result
        .get("providerResponse")
        .or_else(|| provider_result.get("provider_response"))
        .cloned();
    let result_json = provider_result
        .get("result")
        .or_else(|| provider_result.get("normalizedResult"))
        .cloned();
    let completed_at = if status == VoiceTaskStatus::Succeeded.as_storage_value()
        || status == VoiceTaskStatus::Failed.as_storage_value()
    {
        Some(format_datetime(now(), None))
    } else {
        None
    };

    let updated = ports
        .repository
        .update_task_provider_state(VoiceTaskProviderUpdate {
            task_id,
            status: status.clone(),
            provider_task_id: provider_task_id.clone(),
            provider_response_json: provider_response.as_ref().map(|value| value.to_string()),
            result_json: result_json.as_ref().map(|value| value.to_string()),
            error_code: error_code.clone(),
            error_message: error_message.clone(),
            completed_at,
        })
        .await?;

    if let Some(artifacts) = provider_result
        .get("generatedArtifacts")
        .or_else(|| provider_result.get("generated_artifacts"))
        .and_then(Value::as_array)
    {
        for artifact in artifacts {
            let artifact_index = artifact
                .get("artifactIndex")
                .or_else(|| artifact.get("artifact_index"))
                .and_then(Value::as_i64)
                .unwrap_or(0) as i32;
            let kind = string_field(artifact, &["kind"]).unwrap_or_else(|| "audio".to_owned());
            let mime_type = string_field(artifact, &["mimeType", "mime_type"]);
            let format = string_field(artifact, &["format", "fileExtension", "file_extension"]);
            let source_uri = string_field(artifact, &["sourceUri", "source_uri"]);
            let provider_asset_id =
                string_field(artifact, &["providerAssetId", "provider_asset_id"]);
            let media_resource = artifact
                .get("mediaResource")
                .or_else(|| artifact.get("media_resource"))
                .cloned()
                .unwrap_or_else(|| {
                    json!({
                        "source": source_uri,
                        "mimeType": mime_type,
                        "providerAssetId": provider_asset_id,
                    })
                });
            let artifact_id = next_voice_id();
            let inserted = if let Some(existing) = ports
                .repository
                .get_audio_artifact_by_task_index(task_id, artifact_index)
                .await?
            {
                existing
            } else {
                ports
                    .repository
                    .insert_audio_artifact(NewVoiceAudioArtifact {
                        id: artifact_id,
                        artifact_no: format!("va-{}", sdkwork_utils_rust::uuid()),
                        task_id,
                        kind: kind.clone(),
                        artifact_type: string_field(artifact, &["artifactType", "artifact_type"]),
                        provider_code: string_field(artifact, &["providerCode", "provider_code"])
                            .or_else(|| Some(current.provider_code.clone())),
                        provider_asset_id: provider_asset_id.clone(),
                        artifact_index,
                        format,
                        mime_type: mime_type.clone(),
                        media_resource_json: media_resource.to_string(),
                        status: "ready".to_owned(),
                    })
                    .await?
            };
            let source_hash = source_uri
                .as_deref()
                .map(|value| sdkwork_utils_rust::sha256_hash(value.as_bytes()));
            ports
                .repository
                .insert_artifact_drive_sync(NewVoiceArtifactDriveSync {
                    id: next_voice_id(),
                    sync_no: format!("vs-{}", sdkwork_utils_rust::uuid()),
                    task_id,
                    artifact_id: inserted.id,
                    tenant_id: current.tenant_id,
                    organization_id: current.organization_id,
                    user_id: current.user_id,
                    actor_type: "user".to_owned(),
                    provider_code: Some(current.provider_code.clone()),
                    provider_asset_id,
                    artifact_index,
                    source_uri,
                    source_hash,
                    drive_space_type: "ai_generated".to_owned(),
                    sync_status: "pending_upload".to_owned(),
                })
                .await?;
        }
    }

    ports
        .repository
        .insert_task_event(NewVoiceTaskEvent {
            id: next_voice_id(),
            event_no: format!("ve-{}", sdkwork_utils_rust::uuid()),
            task_id,
            event_type: "voice.task.provider_result_applied".to_owned(),
            from_status: Some(current.status),
            to_status: Some(status),
            payload_json: provider_result.to_string(),
            received_at: format_datetime(now(), None),
        })
        .await?;

    Ok(json!({ "item": task_to_json(&updated) }))
}

async fn list_voice_task_events(
    context: &VoiceRuntimeContext,
    body: &Value,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    let tenant_id = parse_i64(&context.tenant_id);
    let page = page_field(body, "page", 1);
    let page_size = page_size_field(body);
    let page_result = ports
        .repository
        .list_task_events(VoiceTaskEventListQuery {
            tenant_id,
            task_id: i64_field(body, &["taskId", "task_id"]),
            page,
            page_size,
        })
        .await?;
    Ok(list_payload(
        page_result.items.iter().map(task_event_to_json).collect(),
        page,
        page_size,
        page_result.has_more,
    ))
}

async fn list_audio_assets(
    context: &VoiceRuntimeContext,
    body: &Value,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    let tenant_id = parse_i64(&context.tenant_id);
    let page = page_field(body, "page", 1);
    let page_size = page_size_field(body);
    let page_result = ports
        .repository
        .list_audio_artifacts(VoiceAudioArtifactListQuery {
            tenant_id,
            task_id: i64_field(body, &["taskId", "task_id"]),
            page,
            page_size,
        })
        .await?;
    Ok(list_payload(
        page_result
            .items
            .iter()
            .map(audio_artifact_to_json)
            .collect(),
        page,
        page_size,
        page_result.has_more,
    ))
}

async fn retrieve_audio_asset(
    context: &VoiceRuntimeContext,
    artifact_id: i64,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    require_permission(context, "voice.tasks.read")?;
    let tenant_id = parse_tenant_id(context)?;
    let artifact = ports
        .repository
        .get_audio_artifact_by_id(tenant_id, artifact_id)
        .await?
        .ok_or_else(|| VoiceServiceError::not_found("audio artifact not found"))?;
    Ok(json!({ "item": audio_artifact_to_json(&artifact) }))
}

async fn delete_audio_asset(
    context: &VoiceRuntimeContext,
    artifact_id: i64,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    require_permission(context, "voice.tasks.write")?;
    let tenant_id = parse_tenant_id(context)?;
    ports
        .repository
        .delete_audio_artifact(tenant_id, artifact_id)
        .await?;
    Ok(json!({ "deleted": true }))
}

async fn list_artifact_drive_sync(
    context: &VoiceRuntimeContext,
    body: &Value,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    let tenant_id = parse_i64(&context.tenant_id);
    let page = page_field(body, "page", 1);
    let page_size = page_size_field(body);
    let page_result = ports
        .repository
        .list_artifact_drive_sync(VoiceArtifactDriveSyncListQuery {
            tenant_id,
            task_id: i64_field(body, &["taskId", "task_id"]),
            sync_status: string_field(body, &["syncStatus", "sync_status"]),
            page,
            page_size,
        })
        .await?;
    Ok(list_payload(
        page_result
            .items
            .iter()
            .map(artifact_drive_sync_to_json)
            .collect(),
        page,
        page_size,
        page_result.has_more,
    ))
}

async fn retry_artifact_drive_sync(
    sync_id: i64,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    let current = ports
        .repository
        .get_artifact_drive_sync_by_id(sync_id)
        .await?
        .ok_or_else(|| VoiceServiceError::not_found("artifact drive sync not found"))?;
    if current
        .source_uri
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .is_none()
    {
        return Err(VoiceServiceError::invalid_state(
            "artifact drive sync is missing source_uri and cannot be retried",
        ));
    }
    let sync = ports.repository.retry_artifact_drive_sync(sync_id).await?;
    if let Some(processor) = ports.drive_sync_processor {
        match processor.process_sync(sync_id, ports).await {
            Ok(processed) => {
                return Ok(json!({
                    "accepted": true,
                    "item": artifact_drive_sync_to_json(&processed)
                }));
            }
            Err(error) => {
                let _ = ports
                    .repository
                    .mark_artifact_drive_sync_failed(sync_id, error.code(), error.message())
                    .await;
                return Err(error);
            }
        }
    }
    Ok(json!({
        "accepted": true,
        "item": artifact_drive_sync_to_json(&sync)
    }))
}

async fn create_provider_route(
    body: &Value,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    let route_key = required_string(body, &["routeKey", "route_key"])?;
    let route_name = required_string(body, &["routeName", "route_name"])?;
    let provider_id = required_string(body, &["providerId", "provider_id"])?;
    let client_protocol = string_field(body, &["clientProtocol", "client_protocol"])
        .unwrap_or_else(|| "http".to_owned());
    let upstream_protocol = string_field(body, &["upstreamProtocol", "upstream_protocol"])
        .unwrap_or_else(|| "http".to_owned());
    let upstream_config_json = body
        .get("upstreamConfig")
        .or_else(|| body.get("upstream_config"))
        .map(|value| value.to_string())
        .unwrap_or_else(|| "{}".to_owned());
    let enabled = body.get("enabled").and_then(Value::as_bool).unwrap_or(true);
    let managed_by =
        string_field(body, &["managedBy", "managed_by"]).unwrap_or_else(|| "backend".to_owned());
    let route = ports
        .repository
        .insert_provider_route(NewVoiceProviderRoute {
            id: next_voice_id(),
            route_key,
            route_name,
            provider_id,
            client_protocol,
            upstream_protocol,
            upstream_config_json,
            enabled,
            managed_by,
            notes: string_field(body, &["notes"]),
        })
        .await?;
    Ok(json!({ "item": provider_route_to_json(&route) }))
}

async fn list_provider_routes(
    body: &Value,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    let page = page_field(body, "page", 1);
    let page_size = page_size_field(body);
    let page_result = ports
        .repository
        .list_provider_routes(VoiceProviderRouteListQuery {
            provider_id: string_field(body, &["providerId", "provider_id"]),
            page,
            page_size,
        })
        .await?;
    Ok(list_payload(
        page_result
            .items
            .iter()
            .map(provider_route_to_json)
            .collect(),
        page,
        page_size,
        page_result.has_more,
    ))
}

async fn retrieve_provider_route(
    route_id: i64,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    let route = ports
        .repository
        .get_provider_route_by_id(route_id)
        .await?
        .ok_or_else(|| VoiceServiceError::not_found("provider route not found"))?;
    Ok(json!({ "item": provider_route_to_json(&route) }))
}

async fn update_provider_route(
    route_id: i64,
    body: &Value,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    let route = ports
        .repository
        .update_provider_route(VoiceProviderRouteUpdate {
            id: route_id,
            route_name: string_field(body, &["routeName", "route_name"]),
            upstream_config_json: body
                .get("upstreamConfig")
                .or_else(|| body.get("upstream_config"))
                .map(|value| value.to_string()),
            enabled: body.get("enabled").and_then(Value::as_bool),
            notes: string_field(body, &["notes"]),
        })
        .await?;
    Ok(json!({ "item": provider_route_to_json(&route) }))
}

async fn delete_provider_route(
    route_id: i64,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    ports.repository.delete_provider_route(route_id).await?;
    Ok(json!({ "deleted": true }))
}

async fn accept_provider_webhook(
    provider_code: &str,
    body: &Value,
    trace_id: &str,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    let event_id =
        string_field(body, &["eventId", "event_id"]).unwrap_or_else(sdkwork_utils_rust::uuid);
    let provider_task_id = string_field(body, &["providerTaskId", "provider_task_id"]);
    let payload = body.get("payload").cloned().unwrap_or_else(|| body.clone());
    let payload_json = payload.to_string();
    let payload_hash = sdkwork_utils_rust::sha256_hash(payload_json.as_bytes());
    let received_at = format_datetime(now(), None);
    let event = ports
        .repository
        .insert_provider_webhook_event(NewVoiceProviderWebhookEvent {
            id: next_voice_id(),
            event_no: format!("pw-{}", sdkwork_utils_rust::uuid()),
            provider_code: provider_code.to_owned(),
            event_id,
            task_id: i64_field(body, &["taskId", "task_id"]),
            provider_task_id: provider_task_id.clone(),
            signature_status: "accepted".to_owned(),
            payload_hash,
            payload_json: payload_json.clone(),
            received_at,
        })
        .await?;

    let event = match process_provider_webhook_event_record(&event, &payload, trace_id, ports).await
    {
        Ok(()) => ports
            .repository
            .get_provider_webhook_event_by_id(event.id)
            .await?
            .unwrap_or(event),
        Err(error) => {
            let _ = ports
                .repository
                .update_provider_webhook_event_processing(event.id, "failed", Some(error.message()))
                .await;
            ports
                .repository
                .get_provider_webhook_event_by_id(event.id)
                .await?
                .unwrap_or(event)
        }
    };

    Ok(json!({
        "accepted": true,
        "item": provider_webhook_event_to_json(&event)
    }))
}

async fn process_provider_webhook_event_record(
    event: &crate::VoiceProviderWebhookEventRecord,
    payload: &Value,
    trace_id: &str,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<(), VoiceServiceError> {
    let task_id = resolve_task_id_for_webhook_event(event, payload, ports).await?;
    let Some(task_id) = task_id else {
        ports
            .repository
            .update_provider_webhook_event_processing(
                event.id,
                "skipped",
                Some("no linked voice task for provider webhook event"),
            )
            .await?;
        return Ok(());
    };

    let provider_result = webhook_payload_to_provider_result(payload);
    let task = ports
        .repository
        .get_task_by_id(0, task_id)
        .await?
        .ok_or_else(|| VoiceServiceError::not_found("voice task not found"))?;
    let context = VoiceRuntimeContext {
        tenant_id: task.tenant_id.to_string(),
        organization_id: Some(task.organization_id.to_string()),
        user_id: task.user_id.to_string(),
        permission_scopes: vec!["voice.tasks.write".to_owned()],
        trace_id: trace_id.to_owned(),
    };
    apply_task_provider_result(&context, task_id, &provider_result, ports).await?;
    ports
        .repository
        .update_provider_webhook_event_processing(event.id, "processed", None)
        .await?;
    Ok(())
}

async fn resolve_task_id_for_webhook_event(
    event: &crate::VoiceProviderWebhookEventRecord,
    payload: &Value,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Option<i64>, VoiceServiceError> {
    if let Some(task_id) = event.task_id {
        return Ok(Some(task_id));
    }
    if let Some(task_id) = i64_field(payload, &["taskId", "task_id"]) {
        return Ok(Some(task_id));
    }
    let provider_task_id = event
        .provider_task_id
        .clone()
        .or_else(|| string_field(payload, &["providerTaskId", "provider_task_id"]));
    if let Some(provider_task_id) = provider_task_id {
        let task = ports
            .repository
            .get_task_by_provider_task(&event.provider_code, &provider_task_id)
            .await?;
        return Ok(task.map(|record| record.id));
    }
    Ok(None)
}

fn webhook_payload_to_provider_result(payload: &Value) -> Value {
    if payload.get("providerResult").is_some() || payload.get("provider_result").is_some() {
        return payload
            .get("providerResult")
            .or_else(|| payload.get("provider_result"))
            .cloned()
            .unwrap_or_else(|| payload.clone());
    }

    json!({
        "status": string_field(payload, &["status"])
            .unwrap_or_else(|| VoiceTaskStatus::Succeeded.as_storage_value().to_owned()),
        "providerTaskId": string_field(payload, &["providerTaskId", "provider_task_id"]),
        "generatedArtifacts": payload
            .get("generatedArtifacts")
            .or_else(|| payload.get("generated_artifacts"))
            .or_else(|| payload.get("artifacts"))
            .cloned(),
        "providerResponse": payload.clone(),
        "errorCode": string_field(payload, &["errorCode", "error_code"]),
        "errorMessage": string_field(payload, &["errorMessage", "error_message"]),
    })
}

async fn list_provider_webhook_events(
    body: &Value,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    let page = page_field(body, "page", 1);
    let page_size = page_size_field(body);
    let page_result = ports
        .repository
        .list_provider_webhook_events(VoiceProviderWebhookEventListQuery {
            provider_code: string_field(body, &["providerCode", "provider_code"]),
            processing_status: string_field(body, &["processingStatus", "processing_status"]),
            page,
            page_size,
        })
        .await?;
    Ok(list_payload(
        page_result
            .items
            .iter()
            .map(provider_webhook_event_to_json)
            .collect(),
        page,
        page_size,
        page_result.has_more,
    ))
}

async fn replay_provider_webhook_event(
    context: &VoiceRuntimeContext,
    event_id: i64,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    let event = ports
        .repository
        .get_provider_webhook_event_by_id(event_id)
        .await?
        .ok_or_else(|| VoiceServiceError::not_found("provider webhook event not found"))?;
    let payload: Value = serde_json::from_str(&event.payload_json).map_err(|error| {
        VoiceServiceError::validation(format!("invalid provider webhook payload_json: {error}"))
    })?;

    let updated =
        match process_provider_webhook_event_record(&event, &payload, &context.trace_id, ports)
            .await
        {
            Ok(()) => ports
                .repository
                .get_provider_webhook_event_by_id(event_id)
                .await?
                .unwrap_or(event),
            Err(error) => {
                let _ = ports
                    .repository
                    .update_provider_webhook_event_processing(
                        event_id,
                        "failed",
                        Some(error.message()),
                    )
                    .await;
                ports
                    .repository
                    .get_provider_webhook_event_by_id(event_id)
                    .await?
                    .unwrap_or(event)
            }
        };

    Ok(json!({
        "accepted": true,
        "item": provider_webhook_event_to_json(&updated)
    }))
}

async fn list_webhook_deliveries(
    body: &Value,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    let page = page_field(body, "page", 1);
    let page_size = page_size_field(body);
    let page_result = ports
        .repository
        .list_webhook_deliveries(VoiceWebhookDeliveryListQuery {
            task_id: i64_field(body, &["taskId", "task_id"]),
            delivery_status: string_field(body, &["deliveryStatus", "delivery_status"]),
            page,
            page_size,
        })
        .await?;
    Ok(list_payload(
        page_result
            .items
            .iter()
            .map(webhook_delivery_to_json)
            .collect(),
        page,
        page_size,
        page_result.has_more,
    ))
}

async fn list_request_logs(
    context: &VoiceRuntimeContext,
    body: &Value,
    ports: &VoiceRuntimePorts<'_>,
) -> Result<Value, VoiceServiceError> {
    require_permission(context, "voice.tasks.read")?;
    let tenant_id = parse_tenant_id(context)?;
    let page = page_field(body, "page", 1);
    let page_size = page_size_field(body);
    let page_result = ports
        .repository
        .list_request_logs(VoiceRequestLogListQuery {
            tenant_id,
            operation_id: string_field(body, &["operationId", "operation_id"]),
            page,
            page_size,
        })
        .await?;
    Ok(list_payload(
        page_result.items.iter().map(request_log_to_json).collect(),
        page,
        page_size,
        page_result.has_more,
    ))
}

fn validate_context(context: &VoiceRuntimeContext) -> Result<(), VoiceServiceError> {
    if context.tenant_id.trim().is_empty() {
        return Err(VoiceServiceError::unauthenticated("tenant_id is required"));
    }
    if context.user_id.trim().is_empty() {
        return Err(VoiceServiceError::unauthenticated("user_id is required"));
    }
    Ok(())
}

fn parse_task_id(path_params: &BTreeMap<String, String>) -> Result<i64, VoiceServiceError> {
    let raw = path_param(path_params, "taskId")?;
    raw.parse::<i64>()
        .map_err(|_| VoiceServiceError::validation(format!("invalid taskId: {raw}")))
}

fn parse_i64_param(
    path_params: &BTreeMap<String, String>,
    key: &str,
) -> Result<i64, VoiceServiceError> {
    let raw = path_param(path_params, key)?;
    raw.parse::<i64>()
        .map_err(|_| VoiceServiceError::validation(format!("invalid {key}: {raw}")))
}

fn path_param<'a>(
    path_params: &'a BTreeMap<String, String>,
    key: &str,
) -> Result<&'a str, VoiceServiceError> {
    path_params
        .get(key)
        .map(String::as_str)
        .ok_or_else(|| VoiceServiceError::validation(format!("missing path param: {key}")))
}

fn string_field(body: &Value, keys: &[&str]) -> Option<String> {
    keys.iter()
        .find_map(|key| body.get(*key))
        .and_then(|value| match value {
            Value::String(text) if !text.is_empty() => Some(text.clone()),
            Value::Number(number) => Some(number.to_string()),
            Value::Bool(flag) => Some(flag.to_string()),
            _ => None,
        })
}

fn i64_field(body: &Value, keys: &[&str]) -> Option<i64> {
    string_field(body, keys).and_then(|value| value.parse().ok())
}

fn required_string(body: &Value, keys: &[&str]) -> Result<String, VoiceServiceError> {
    string_field(body, keys).ok_or_else(|| {
        VoiceServiceError::validation(format!("missing required field: {}", keys[0]))
    })
}

fn page_field(body: &Value, key: &str, default: i32) -> i32 {
    body.get(key)
        .and_then(Value::as_i64)
        .map(|value| value as i32)
        .or_else(|| string_field(body, &[key]).and_then(|value| value.parse().ok()))
        .unwrap_or(default)
        .max(1)
}

fn page_size_field(body: &Value) -> i32 {
    body.get("pageSize")
        .or_else(|| body.get("page_size"))
        .and_then(Value::as_i64)
        .map(|value| value as i32)
        .or_else(|| {
            string_field(body, &["pageSize", "page_size"]).and_then(|value| value.parse().ok())
        })
        .unwrap_or(DEFAULT_PAGE_SIZE)
        .clamp(1, MAX_PAGE_SIZE)
}

fn list_payload(items: Vec<Value>, page: i32, page_size: i32, has_more: bool) -> Value {
    json!({
        "items": items,
        "pageInfo": offset_page_info(page, page_size, has_more)
    })
}

fn offset_page_info(page: i32, page_size: i32, has_more: bool) -> PageInfo {
    PageInfo {
        mode: PageMode::Offset,
        page: Some(page),
        page_size: Some(page_size),
        total_items: None,
        total_pages: None,
        next_cursor: None,
        has_more: Some(has_more),
    }
}

fn next_voice_id() -> i64 {
    let millis = now().timestamp_millis();
    let suffix = sdkwork_utils_rust::uuid();
    let hash = suffix.bytes().fold(0u64, |acc, byte| {
        acc.wrapping_mul(31).wrapping_add(u64::from(byte))
    });
    millis
        .saturating_mul(1000)
        .saturating_add((hash % 1000) as i64)
}

pub fn task_to_json(task: &VoiceTaskRecord) -> Value {
    json!({
        "id": task.id.to_string(),
        "taskNo": task.task_no,
        "operationType": task.operation_type,
        "status": task.status,
        "progress": task.progress,
        "providerCode": task.provider_code,
        "providerTaskId": task.provider_task_id,
        "model": task.model,
        "errorCode": task.error_code,
        "errorMessage": task.error_message,
        "createdAt": task.created_at,
        "updatedAt": task.updated_at,
        "completedAt": task.completed_at,
    })
}

fn task_event_to_json(event: &crate::VoiceTaskEventRecord) -> Value {
    json!({
        "id": event.id.to_string(),
        "eventNo": event.event_no,
        "taskId": event.task_id.to_string(),
        "eventType": event.event_type,
        "fromStatus": event.from_status,
        "toStatus": event.to_status,
        "status": event.status,
        "receivedAt": event.received_at,
        "createdAt": event.created_at,
    })
}

fn provider_route_to_json(route: &crate::VoiceProviderRouteRecord) -> Value {
    json!({
        "id": route.id.to_string(),
        "routeKey": route.route_key,
        "routeName": route.route_name,
        "providerId": route.provider_id,
        "clientProtocol": route.client_protocol,
        "upstreamProtocol": route.upstream_protocol,
        "upstreamConfig": serde_json::from_str::<Value>(&route.upstream_config_json)
            .unwrap_or(Value::Object(Default::default())),
        "enabled": route.enabled,
        "managedBy": route.managed_by,
        "notes": route.notes,
        "createdAt": route.created_at,
        "updatedAt": route.updated_at,
    })
}

fn audio_artifact_to_json(artifact: &crate::VoiceAudioArtifactRecord) -> Value {
    json!({
        "id": artifact.id.to_string(),
        "artifactNo": artifact.artifact_no,
        "taskId": artifact.task_id.map(|value| value.to_string()),
        "kind": artifact.kind,
        "artifactType": artifact.artifact_type,
        "title": artifact.title,
        "voiceId": artifact.voice_id,
        "providerCode": artifact.provider_code,
        "format": artifact.format,
        "mimeType": artifact.mime_type,
        "durationSeconds": artifact.duration_seconds,
        "mediaResource": serde_json::from_str::<Value>(&artifact.media_resource_json)
            .unwrap_or(Value::Object(Default::default())),
        "status": artifact.status,
        "createdAt": artifact.created_at,
        "updatedAt": artifact.updated_at,
    })
}

fn artifact_drive_sync_to_json(sync: &crate::VoiceArtifactDriveSyncRecord) -> Value {
    json!({
        "id": sync.id.to_string(),
        "syncNo": sync.sync_no,
        "taskId": sync.task_id.to_string(),
        "artifactId": sync.artifact_id.to_string(),
        "artifactIndex": sync.artifact_index,
        "syncStatus": sync.sync_status,
        "sourceUri": sync.source_uri,
        "driveSpaceType": sync.drive_space_type,
        "driveSpaceId": sync.drive_space_id,
        "driveNodeId": sync.drive_node_id,
        "errorCode": sync.error_code,
        "errorMessage": sync.error_message,
        "createdAt": sync.created_at,
        "updatedAt": sync.updated_at,
    })
}

fn provider_webhook_event_to_json(event: &crate::VoiceProviderWebhookEventRecord) -> Value {
    json!({
        "id": event.id.to_string(),
        "eventNo": event.event_no,
        "providerCode": event.provider_code,
        "eventId": event.event_id,
        "taskId": event.task_id.map(|value| value.to_string()),
        "providerTaskId": event.provider_task_id,
        "signatureStatus": event.signature_status,
        "processingStatus": event.processing_status,
        "receivedAt": event.received_at,
        "createdAt": event.created_at,
    })
}

fn webhook_delivery_to_json(delivery: &crate::VoiceWebhookDeliveryRecord) -> Value {
    json!({
        "id": delivery.id.to_string(),
        "deliveryNo": delivery.delivery_no,
        "taskId": delivery.task_id.to_string(),
        "eventType": delivery.event_type,
        "targetUrl": delivery.target_url,
        "deliveryStatus": delivery.delivery_status,
        "attemptCount": delivery.attempt_count,
        "createdAt": delivery.created_at,
    })
}

fn request_log_to_json(log: &crate::VoiceRequestLogRecord) -> Value {
    json!({
        "id": log.id.to_string(),
        "requestId": log.request_id,
        "traceId": log.trace_id,
        "capability": log.capability,
        "operationId": log.operation_id,
        "consumer": log.consumer,
        "status": log.status,
        "latencyMs": log.latency_ms,
        "createdAt": log.created_at,
    })
}
