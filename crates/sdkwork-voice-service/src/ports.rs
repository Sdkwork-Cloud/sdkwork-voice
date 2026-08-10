use async_trait::async_trait;
use sdkwork_voice_contract::VoiceServiceError;

pub const VOICE_REPOSITORY_PORT: &str = "voice.generation.repository";

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceTaskRecord {
    pub id: i64,
    pub task_no: String,
    pub tenant_id: i64,
    pub organization_id: i64,
    pub user_id: i64,
    pub operation_type: String,
    pub provider_code: String,
    pub provider_route_id: Option<i64>,
    pub model: Option<String>,
    pub provider_task_id: Option<String>,
    pub idempotency_key: Option<String>,
    pub status: String,
    pub progress: i32,
    pub request_json: String,
    pub result_json: Option<String>,
    pub error_code: Option<String>,
    pub error_message: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub completed_at: Option<String>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct NewVoiceTask {
    pub id: i64,
    pub task_no: String,
    pub tenant_id: i64,
    pub organization_id: i64,
    pub user_id: i64,
    pub operation_type: String,
    pub provider_code: String,
    pub provider_route_id: Option<i64>,
    pub model: Option<String>,
    pub idempotency_key: Option<String>,
    pub request_json: String,
    pub normalized_options_json: Option<String>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceTaskEventRecord {
    pub id: i64,
    pub event_no: String,
    pub task_id: i64,
    pub event_type: String,
    pub from_status: Option<String>,
    pub to_status: Option<String>,
    pub payload_json: String,
    pub status: String,
    pub received_at: String,
    pub created_at: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct NewVoiceTaskEvent {
    pub id: i64,
    pub event_no: String,
    pub task_id: i64,
    pub event_type: String,
    pub from_status: Option<String>,
    pub to_status: Option<String>,
    pub payload_json: String,
    pub received_at: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceProviderRouteRecord {
    pub id: i64,
    pub route_key: String,
    pub route_name: String,
    pub provider_id: String,
    pub client_protocol: String,
    pub upstream_protocol: String,
    pub upstream_config_json: String,
    pub enabled: bool,
    pub managed_by: String,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct NewVoiceProviderRoute {
    pub id: i64,
    pub route_key: String,
    pub route_name: String,
    pub provider_id: String,
    pub client_protocol: String,
    pub upstream_protocol: String,
    pub upstream_config_json: String,
    pub enabled: bool,
    pub managed_by: String,
    pub notes: Option<String>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceProviderRouteUpdate {
    pub id: i64,
    pub route_name: Option<String>,
    pub upstream_config_json: Option<String>,
    pub enabled: Option<bool>,
    pub notes: Option<String>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct NewVoiceAudioArtifact {
    pub id: i64,
    pub artifact_no: String,
    pub task_id: i64,
    pub kind: String,
    pub artifact_type: Option<String>,
    pub provider_code: Option<String>,
    pub provider_asset_id: Option<String>,
    pub artifact_index: i32,
    pub format: Option<String>,
    pub mime_type: Option<String>,
    pub media_resource_json: String,
    pub status: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct NewVoiceArtifactDriveSync {
    pub id: i64,
    pub sync_no: String,
    pub task_id: i64,
    pub artifact_id: i64,
    pub tenant_id: i64,
    pub organization_id: i64,
    pub user_id: i64,
    pub actor_type: String,
    pub provider_code: Option<String>,
    pub provider_asset_id: Option<String>,
    pub artifact_index: i32,
    pub source_uri: Option<String>,
    pub source_hash: Option<String>,
    pub drive_space_type: String,
    pub sync_status: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceTaskProviderUpdate {
    pub task_id: i64,
    pub status: String,
    pub provider_task_id: Option<String>,
    pub provider_response_json: Option<String>,
    pub result_json: Option<String>,
    pub error_code: Option<String>,
    pub error_message: Option<String>,
    pub completed_at: Option<String>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceAudioArtifactRecord {
    pub id: i64,
    pub artifact_no: String,
    pub task_id: Option<i64>,
    pub request_id: Option<String>,
    pub kind: String,
    pub artifact_type: Option<String>,
    pub title: Option<String>,
    pub voice_id: Option<String>,
    pub provider_code: Option<String>,
    pub format: Option<String>,
    pub mime_type: Option<String>,
    pub duration_seconds: Option<i32>,
    pub media_resource_json: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

pub struct VoiceArtifactDriveSyncUploadUpdate {
    pub sync_id: i64,
    pub drive_space_id: String,
    pub drive_node_id: String,
    pub drive_upload_item_id: Option<String>,
    pub drive_upload_session_id: Option<String>,
    pub drive_resource_json: Option<String>,
    pub uploaded_at: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceArtifactDriveSyncRecord {
    pub id: i64,
    pub sync_no: String,
    pub task_id: i64,
    pub artifact_id: i64,
    pub artifact_index: i32,
    pub tenant_id: i64,
    pub organization_id: i64,
    pub user_id: i64,
    pub sync_status: String,
    pub source_uri: Option<String>,
    pub drive_space_type: String,
    pub drive_space_id: Option<String>,
    pub drive_node_id: Option<String>,
    pub error_code: Option<String>,
    pub error_message: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceProviderWebhookEventRecord {
    pub id: i64,
    pub event_no: String,
    pub provider_code: String,
    pub event_id: String,
    pub task_id: Option<i64>,
    pub provider_task_id: Option<String>,
    pub signature_status: String,
    pub payload_hash: String,
    pub payload_json: String,
    pub processing_status: String,
    pub received_at: String,
    pub created_at: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct NewVoiceProviderWebhookEvent {
    pub id: i64,
    pub event_no: String,
    pub provider_code: String,
    pub event_id: String,
    pub task_id: Option<i64>,
    pub provider_task_id: Option<String>,
    pub signature_status: String,
    pub payload_hash: String,
    pub payload_json: String,
    pub received_at: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceWebhookDeliveryRecord {
    pub id: i64,
    pub delivery_no: String,
    pub task_id: i64,
    pub event_type: String,
    pub target_url: String,
    pub delivery_status: String,
    pub attempt_count: i32,
    pub created_at: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceRequestLogRecord {
    pub id: i64,
    pub request_id: String,
    pub trace_id: String,
    pub capability: String,
    pub operation_id: String,
    pub consumer: String,
    pub status: String,
    pub latency_ms: Option<i64>,
    pub created_at: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceTaskListQuery {
    pub tenant_id: i64,
    pub organization_id: Option<i64>,
    pub user_id: Option<i64>,
    pub operation_type: Option<String>,
    pub status: Option<String>,
    pub page: i32,
    pub page_size: i32,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceTaskListPage {
    pub items: Vec<VoiceTaskRecord>,
    pub has_more: bool,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceTaskEventListQuery {
    pub tenant_id: i64,
    pub task_id: Option<i64>,
    pub page: i32,
    pub page_size: i32,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceTaskEventListPage {
    pub items: Vec<VoiceTaskEventRecord>,
    pub has_more: bool,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceProviderRouteListQuery {
    pub provider_id: Option<String>,
    pub page: i32,
    pub page_size: i32,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceProviderRouteListPage {
    pub items: Vec<VoiceProviderRouteRecord>,
    pub has_more: bool,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceAudioArtifactListQuery {
    pub tenant_id: i64,
    pub task_id: Option<i64>,
    pub page: i32,
    pub page_size: i32,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceAudioArtifactListPage {
    pub items: Vec<VoiceAudioArtifactRecord>,
    pub has_more: bool,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceArtifactDriveSyncListQuery {
    pub tenant_id: i64,
    pub task_id: Option<i64>,
    pub sync_status: Option<String>,
    pub page: i32,
    pub page_size: i32,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceProfileRecord {
    pub id: i64,
    pub profile_no: String,
    pub tenant_id: i64,
    pub organization_id: i64,
    pub user_id: i64,
    pub name: String,
    pub description: Option<String>,
    pub kind: String,
    pub status: String,
    pub voice_id: Option<String>,
    pub provider_code: Option<String>,
    pub sample_media_json: String,
    pub duration_seconds: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct NewVoiceProfile {
    pub id: i64,
    pub profile_no: String,
    pub tenant_id: i64,
    pub organization_id: i64,
    pub user_id: i64,
    pub name: String,
    pub description: Option<String>,
    pub kind: String,
    pub status: String,
    pub voice_id: Option<String>,
    pub provider_code: Option<String>,
    pub sample_media_json: String,
    pub duration_seconds: Option<i32>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceProfileUpdate {
    pub id: i64,
    pub tenant_id: i64,
    pub user_id: i64,
    pub name: Option<String>,
    pub description: Option<String>,
    pub voice_id: Option<String>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceProfileListQuery {
    pub tenant_id: i64,
    pub user_id: i64,
    pub page: i32,
    pub page_size: i32,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceProfileListPage {
    pub items: Vec<VoiceProfileRecord>,
    pub has_more: bool,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceArtifactDriveSyncListPage {
    pub items: Vec<VoiceArtifactDriveSyncRecord>,
    pub has_more: bool,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceProviderWebhookEventListQuery {
    pub provider_code: Option<String>,
    pub processing_status: Option<String>,
    pub page: i32,
    pub page_size: i32,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceProviderWebhookEventListPage {
    pub items: Vec<VoiceProviderWebhookEventRecord>,
    pub has_more: bool,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceWebhookDeliveryListQuery {
    pub task_id: Option<i64>,
    pub delivery_status: Option<String>,
    pub page: i32,
    pub page_size: i32,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceWebhookDeliveryListPage {
    pub items: Vec<VoiceWebhookDeliveryRecord>,
    pub has_more: bool,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceRequestLogListQuery {
    pub tenant_id: i64,
    pub operation_id: Option<String>,
    pub page: i32,
    pub page_size: i32,
}

#[derive(Clone, Debug, PartialEq)]
pub struct NewVoiceRequestLog {
    pub id: i64,
    pub request_id: String,
    pub trace_id: String,
    pub tenant_id: i64,
    pub capability: String,
    pub operation_id: String,
    pub consumer: String,
    pub status: String,
    pub latency_ms: Option<i64>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct VoiceRequestLogListPage {
    pub items: Vec<VoiceRequestLogRecord>,
    pub has_more: bool,
}

pub struct VoiceRuntimePorts<'a> {
    pub repository: &'a dyn VoiceRepositoryPort,
    pub drive_sync_processor: Option<&'a dyn VoiceArtifactDriveSyncProcessorPort>,
}

#[async_trait]
pub trait VoiceArtifactDriveSyncProcessorPort: Send + Sync {
    async fn process_sync(
        &self,
        sync_id: i64,
        ports: &VoiceRuntimePorts<'_>,
    ) -> Result<VoiceArtifactDriveSyncRecord, VoiceServiceError>;
}

#[async_trait]
pub trait VoiceRepositoryPort: Send + Sync {
    async fn insert_task(&self, task: NewVoiceTask) -> Result<VoiceTaskRecord, VoiceServiceError>;

    async fn get_task_by_id(
        &self,
        tenant_id: i64,
        task_id: i64,
    ) -> Result<Option<VoiceTaskRecord>, VoiceServiceError>;

    async fn get_task_by_idempotency(
        &self,
        tenant_id: i64,
        operation_type: &str,
        idempotency_key: &str,
    ) -> Result<Option<VoiceTaskRecord>, VoiceServiceError>;

    async fn list_tasks(
        &self,
        query: VoiceTaskListQuery,
    ) -> Result<VoiceTaskListPage, VoiceServiceError>;

    async fn update_task_status(
        &self,
        task_id: i64,
        status: &str,
        error_code: Option<&str>,
        error_message: Option<&str>,
    ) -> Result<VoiceTaskRecord, VoiceServiceError>;

    async fn update_task_provider_state(
        &self,
        update: VoiceTaskProviderUpdate,
    ) -> Result<VoiceTaskRecord, VoiceServiceError>;

    async fn insert_audio_artifact(
        &self,
        artifact: NewVoiceAudioArtifact,
    ) -> Result<VoiceAudioArtifactRecord, VoiceServiceError>;

    async fn insert_artifact_drive_sync(
        &self,
        sync: NewVoiceArtifactDriveSync,
    ) -> Result<VoiceArtifactDriveSyncRecord, VoiceServiceError>;

    async fn insert_task_event(
        &self,
        event: NewVoiceTaskEvent,
    ) -> Result<VoiceTaskEventRecord, VoiceServiceError>;

    async fn list_task_events(
        &self,
        query: VoiceTaskEventListQuery,
    ) -> Result<VoiceTaskEventListPage, VoiceServiceError>;

    async fn insert_provider_route(
        &self,
        route: NewVoiceProviderRoute,
    ) -> Result<VoiceProviderRouteRecord, VoiceServiceError>;

    async fn get_provider_route_by_id(
        &self,
        route_id: i64,
    ) -> Result<Option<VoiceProviderRouteRecord>, VoiceServiceError>;

    async fn list_provider_routes(
        &self,
        query: VoiceProviderRouteListQuery,
    ) -> Result<VoiceProviderRouteListPage, VoiceServiceError>;

    async fn update_provider_route(
        &self,
        update: VoiceProviderRouteUpdate,
    ) -> Result<VoiceProviderRouteRecord, VoiceServiceError>;

    async fn delete_provider_route(&self, route_id: i64) -> Result<(), VoiceServiceError>;

    async fn list_audio_artifacts(
        &self,
        query: VoiceAudioArtifactListQuery,
    ) -> Result<VoiceAudioArtifactListPage, VoiceServiceError>;

    async fn get_audio_artifact_by_id(
        &self,
        tenant_id: i64,
        artifact_id: i64,
    ) -> Result<Option<VoiceAudioArtifactRecord>, VoiceServiceError>;

    async fn get_audio_artifact_by_task_index(
        &self,
        task_id: i64,
        artifact_index: i32,
    ) -> Result<Option<VoiceAudioArtifactRecord>, VoiceServiceError>;

    async fn update_audio_artifact_media_resource(
        &self,
        artifact_id: i64,
        media_resource_json: &str,
    ) -> Result<VoiceAudioArtifactRecord, VoiceServiceError>;

    async fn delete_audio_artifact(
        &self,
        tenant_id: i64,
        artifact_id: i64,
    ) -> Result<(), VoiceServiceError>;

    async fn insert_voice_profile(
        &self,
        profile: NewVoiceProfile,
    ) -> Result<VoiceProfileRecord, VoiceServiceError>;

    async fn list_voice_profiles(
        &self,
        query: VoiceProfileListQuery,
    ) -> Result<VoiceProfileListPage, VoiceServiceError>;

    async fn get_voice_profile_by_id(
        &self,
        tenant_id: i64,
        user_id: i64,
        profile_id: i64,
    ) -> Result<Option<VoiceProfileRecord>, VoiceServiceError>;

    async fn update_voice_profile(
        &self,
        update: VoiceProfileUpdate,
    ) -> Result<VoiceProfileRecord, VoiceServiceError>;

    async fn delete_voice_profile(
        &self,
        tenant_id: i64,
        user_id: i64,
        profile_id: i64,
    ) -> Result<(), VoiceServiceError>;

    async fn list_artifact_drive_sync(
        &self,
        query: VoiceArtifactDriveSyncListQuery,
    ) -> Result<VoiceArtifactDriveSyncListPage, VoiceServiceError>;

    async fn get_artifact_drive_sync_by_id(
        &self,
        sync_id: i64,
    ) -> Result<Option<VoiceArtifactDriveSyncRecord>, VoiceServiceError>;

    async fn retry_artifact_drive_sync(
        &self,
        sync_id: i64,
    ) -> Result<VoiceArtifactDriveSyncRecord, VoiceServiceError>;

    async fn mark_artifact_drive_sync_uploading(
        &self,
        sync_id: i64,
        drive_space_id: &str,
    ) -> Result<VoiceArtifactDriveSyncRecord, VoiceServiceError>;

    async fn mark_artifact_drive_sync_uploaded(
        &self,
        update: VoiceArtifactDriveSyncUploadUpdate,
    ) -> Result<VoiceArtifactDriveSyncRecord, VoiceServiceError>;

    async fn mark_artifact_drive_sync_failed(
        &self,
        sync_id: i64,
        error_code: &str,
        error_message: &str,
    ) -> Result<VoiceArtifactDriveSyncRecord, VoiceServiceError>;

    async fn insert_provider_webhook_event(
        &self,
        event: NewVoiceProviderWebhookEvent,
    ) -> Result<VoiceProviderWebhookEventRecord, VoiceServiceError>;

    async fn list_provider_webhook_events(
        &self,
        query: VoiceProviderWebhookEventListQuery,
    ) -> Result<VoiceProviderWebhookEventListPage, VoiceServiceError>;

    async fn get_provider_webhook_event_by_id(
        &self,
        event_id: i64,
    ) -> Result<Option<VoiceProviderWebhookEventRecord>, VoiceServiceError>;

    async fn update_provider_webhook_event_processing(
        &self,
        event_id: i64,
        processing_status: &str,
        error_summary: Option<&str>,
    ) -> Result<VoiceProviderWebhookEventRecord, VoiceServiceError>;

    async fn get_task_by_provider_task(
        &self,
        provider_code: &str,
        provider_task_id: &str,
    ) -> Result<Option<VoiceTaskRecord>, VoiceServiceError>;

    async fn list_webhook_deliveries(
        &self,
        query: VoiceWebhookDeliveryListQuery,
    ) -> Result<VoiceWebhookDeliveryListPage, VoiceServiceError>;

    async fn list_request_logs(
        &self,
        query: VoiceRequestLogListQuery,
    ) -> Result<VoiceRequestLogListPage, VoiceServiceError>;

    async fn insert_request_log(
        &self,
        log: NewVoiceRequestLog,
    ) -> Result<VoiceRequestLogRecord, VoiceServiceError>;
}
