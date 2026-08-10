use std::collections::BTreeMap;

use axum::{
    extract::{Path, Query, State},
    response::Response,
    Json,
};
use sdkwork_routes_voice_http_auth::{
    finish_success, success_status_for_voice_app_operation, voice_request_context_from_web,
};
use sdkwork_web_core::WebRequestContext;
use serde_json::Value;

use crate::service_port::VoiceAppApiState;

pub async fn create_speech(
    State(state): State<VoiceAppApiState>,
    app_ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    call_operation(state, app_ctx, "speech.create", BTreeMap::new(), body).await
}

pub async fn create_transcription(
    State(state): State<VoiceAppApiState>,
    app_ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    call_operation(
        state,
        app_ctx,
        "transcriptions.create",
        BTreeMap::new(),
        body,
    )
    .await
}

pub async fn create_translation(
    State(state): State<VoiceAppApiState>,
    app_ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    call_operation(state, app_ctx, "translations.create", BTreeMap::new(), body).await
}

pub async fn create_sound_effect(
    State(state): State<VoiceAppApiState>,
    app_ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    call_operation(state, app_ctx, "soundEffects.create", BTreeMap::new(), body).await
}

pub async fn create_music(
    State(state): State<VoiceAppApiState>,
    app_ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    call_operation(state, app_ctx, "music.create", BTreeMap::new(), body).await
}

pub async fn list_tasks(
    State(state): State<VoiceAppApiState>,
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
    State(state): State<VoiceAppApiState>,
    app_ctx: WebRequestContext,
    Path(task_id): Path<String>,
) -> Response {
    call_task_operation(state, app_ctx, "tasks.retrieve", task_id, Value::Null).await
}

pub async fn cancel_task(
    State(state): State<VoiceAppApiState>,
    app_ctx: WebRequestContext,
    Path(task_id): Path<String>,
) -> Response {
    call_task_operation(state, app_ctx, "tasks.cancel", task_id, Value::Null).await
}

pub async fn list_task_events(
    State(state): State<VoiceAppApiState>,
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

pub async fn list_artifact_drive_sync(
    State(state): State<VoiceAppApiState>,
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

pub async fn list_audio_assets(
    State(state): State<VoiceAppApiState>,
    app_ctx: WebRequestContext,
    Query(query): Query<BTreeMap<String, String>>,
) -> Response {
    call_operation(
        state,
        app_ctx,
        "audioAssets.list",
        BTreeMap::new(),
        query_body(query),
    )
    .await
}

pub async fn retrieve_audio_asset(
    State(state): State<VoiceAppApiState>,
    app_ctx: WebRequestContext,
    Path(audio_asset_id): Path<String>,
) -> Response {
    let mut path_params = BTreeMap::new();
    path_params.insert("audioAssetId".to_owned(), audio_asset_id);
    call_operation(
        state,
        app_ctx,
        "audioAssets.retrieve",
        path_params,
        Value::Null,
    )
    .await
}

pub async fn create_voice_profile(
    State(state): State<VoiceAppApiState>,
    app_ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    call_operation(
        state,
        app_ctx,
        "voiceProfiles.create",
        BTreeMap::new(),
        body,
    )
    .await
}

pub async fn list_voice_profiles(
    State(state): State<VoiceAppApiState>,
    app_ctx: WebRequestContext,
    Query(query): Query<BTreeMap<String, String>>,
) -> Response {
    call_operation(
        state,
        app_ctx,
        "voiceProfiles.list",
        BTreeMap::new(),
        query_body(query),
    )
    .await
}

pub async fn retrieve_voice_profile(
    State(state): State<VoiceAppApiState>,
    app_ctx: WebRequestContext,
    Path(profile_id): Path<String>,
) -> Response {
    let mut path_params = BTreeMap::new();
    path_params.insert("profileId".to_owned(), profile_id);
    call_operation(
        state,
        app_ctx,
        "voiceProfiles.retrieve",
        path_params,
        Value::Null,
    )
    .await
}

pub async fn update_voice_profile(
    State(state): State<VoiceAppApiState>,
    app_ctx: WebRequestContext,
    Path(profile_id): Path<String>,
    Json(body): Json<Value>,
) -> Response {
    let mut path_params = BTreeMap::new();
    path_params.insert("profileId".to_owned(), profile_id);
    call_operation(
        state,
        app_ctx,
        "voiceProfiles.update",
        path_params,
        body,
    )
    .await
}

pub async fn delete_voice_profile(
    State(state): State<VoiceAppApiState>,
    app_ctx: WebRequestContext,
    Path(profile_id): Path<String>,
) -> Response {
    let mut path_params = BTreeMap::new();
    path_params.insert("profileId".to_owned(), profile_id);
    call_operation(
        state,
        app_ctx,
        "voiceProfiles.delete",
        path_params,
        Value::Null,
    )
    .await
}

async fn call_task_operation(
    state: VoiceAppApiState,
    app_ctx: WebRequestContext,
    operation_id: &'static str,
    task_id: String,
    body: Value,
) -> Response {
    let mut path_params = BTreeMap::new();
    path_params.insert("taskId".to_owned(), task_id);
    call_operation(state, app_ctx, operation_id, path_params, body).await
}

async fn call_operation(
    state: VoiceAppApiState,
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
            success_status_for_voice_app_operation(operation_id),
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
