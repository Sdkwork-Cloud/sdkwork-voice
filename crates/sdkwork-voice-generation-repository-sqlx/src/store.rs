use async_trait::async_trait;
use sdkwork_utils_rust::{format_datetime, now};
use sdkwork_voice_contract::VoiceServiceError;
use sdkwork_voice_service::{
    NewVoiceArtifactDriveSync, NewVoiceAudioArtifact, NewVoiceProviderRoute,
    NewVoiceProviderWebhookEvent, NewVoiceRequestLog, NewVoiceTask, NewVoiceTaskEvent,
    VoiceArtifactDriveSyncListPage, VoiceArtifactDriveSyncListQuery, VoiceArtifactDriveSyncRecord,
    VoiceArtifactDriveSyncUploadUpdate, VoiceAudioArtifactListPage, VoiceAudioArtifactListQuery,
    VoiceAudioArtifactRecord, VoiceProviderRouteListPage, VoiceProviderRouteListQuery,
    VoiceProviderRouteRecord, VoiceProviderRouteUpdate, VoiceProviderWebhookEventListPage,
    VoiceProviderWebhookEventListQuery, VoiceProviderWebhookEventRecord, VoiceRepositoryPort,
    VoiceRequestLogListPage, VoiceRequestLogListQuery, VoiceRequestLogRecord,
    VoiceTaskEventListPage, VoiceTaskEventListQuery, VoiceTaskEventRecord, VoiceTaskListPage,
    VoiceTaskListQuery, VoiceTaskProviderUpdate, VoiceTaskRecord, VoiceWebhookDeliveryListPage,
    VoiceWebhookDeliveryListQuery, VoiceWebhookDeliveryRecord,
};
use sqlx::{AnyPool, Row};

#[derive(Clone, Debug)]
pub struct SqlVoiceStore {
    pool: AnyPool,
}

impl SqlVoiceStore {
    pub fn new(pool: AnyPool) -> Self {
        Self { pool }
    }
}

fn store_error(context: &str) -> impl Fn(sqlx::Error) -> VoiceServiceError + '_ {
    move |error| VoiceServiceError::storage(format!("{context}: {error}"))
}

fn now_text() -> String {
    format_datetime(now(), None)
}

fn list_limit(_page: i32, page_size: i32) -> i64 {
    i64::from(page_size.max(1)) + 1
}

fn list_offset(page: i32, page_size: i32) -> i64 {
    i64::from((page.max(1) - 1) * page_size.max(1))
}

#[async_trait]
impl VoiceRepositoryPort for SqlVoiceStore {
    async fn insert_task(&self, task: NewVoiceTask) -> Result<VoiceTaskRecord, VoiceServiceError> {
        let created_at = now_text();
        sqlx::query(
            "INSERT INTO voice_generation_task (
                id, task_no, tenant_id, organization_id, user_id, operation_type,
                provider_code, provider_route_id, model, idempotency_key, status, progress,
                request_json, normalized_options_json, created_at, updated_at
             ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, 'queued', 0,
                $11, $12, $13, $13
             )",
        )
        .bind(task.id)
        .bind(&task.task_no)
        .bind(task.tenant_id)
        .bind(task.organization_id)
        .bind(task.user_id)
        .bind(&task.operation_type)
        .bind(&task.provider_code)
        .bind(task.provider_route_id)
        .bind(&task.model)
        .bind(&task.idempotency_key)
        .bind(&task.request_json)
        .bind(&task.normalized_options_json)
        .bind(&created_at)
        .execute(&self.pool)
        .await
        .map_err(store_error("failed to insert voice task"))?;

        self.get_task_by_id(task.tenant_id, task.id)
            .await?
            .ok_or_else(|| VoiceServiceError::storage("inserted voice task not found"))
    }

    async fn get_task_by_id(
        &self,
        tenant_id: i64,
        task_id: i64,
    ) -> Result<Option<VoiceTaskRecord>, VoiceServiceError> {
        let row = if tenant_id == 0 {
            sqlx::query(TASK_SELECT_SQL)
                .bind(task_id)
                .fetch_optional(&self.pool)
                .await
                .map_err(store_error("failed to get voice task"))?
        } else {
            sqlx::query(TASK_SELECT_BY_TENANT_SQL)
                .bind(task_id)
                .bind(tenant_id)
                .fetch_optional(&self.pool)
                .await
                .map_err(store_error("failed to get voice task"))?
        };
        row.as_ref().map(map_task_row).transpose()
    }

    async fn get_task_by_idempotency(
        &self,
        tenant_id: i64,
        operation_type: &str,
        idempotency_key: &str,
    ) -> Result<Option<VoiceTaskRecord>, VoiceServiceError> {
        let row = sqlx::query(TASK_SELECT_BY_IDEMPOTENCY_SQL)
            .bind(tenant_id)
            .bind(operation_type)
            .bind(idempotency_key)
            .fetch_optional(&self.pool)
            .await
            .map_err(store_error("failed to get voice task by idempotency"))?;
        row.as_ref().map(map_task_row).transpose()
    }

    async fn list_tasks(
        &self,
        query: VoiceTaskListQuery,
    ) -> Result<VoiceTaskListPage, VoiceServiceError> {
        let limit = list_limit(query.page, query.page_size);
        let offset = list_offset(query.page, query.page_size);
        let rows = sqlx::query(TASK_LIST_SQL)
            .bind(query.tenant_id)
            .bind(query.organization_id)
            .bind(query.user_id)
            .bind(query.operation_type.as_deref())
            .bind(query.status.as_deref())
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
            .map_err(store_error("failed to list voice tasks"))?;
        let has_more = rows.len() as i32 > query.page_size;
        let items = rows
            .iter()
            .take(query.page_size as usize)
            .map(map_task_row)
            .collect::<Result<Vec<_>, _>>()?;
        Ok(VoiceTaskListPage { items, has_more })
    }

    async fn update_task_status(
        &self,
        task_id: i64,
        status: &str,
        error_code: Option<&str>,
        error_message: Option<&str>,
    ) -> Result<VoiceTaskRecord, VoiceServiceError> {
        let updated_at = now_text();
        sqlx::query(
            "UPDATE voice_generation_task
             SET status=$2, error_code=$3, error_message=$4, updated_at=$5, version=version+1
             WHERE id=$1 AND deleted=FALSE",
        )
        .bind(task_id)
        .bind(status)
        .bind(error_code)
        .bind(error_message)
        .bind(&updated_at)
        .execute(&self.pool)
        .await
        .map_err(store_error("failed to update voice task status"))?;
        self.get_task_by_id(0, task_id)
            .await?
            .ok_or_else(|| VoiceServiceError::not_found("voice task not found"))
    }

    async fn update_task_provider_state(
        &self,
        update: VoiceTaskProviderUpdate,
    ) -> Result<VoiceTaskRecord, VoiceServiceError> {
        let updated_at = now_text();
        sqlx::query(
            "UPDATE voice_generation_task
             SET status=$2,
                 provider_task_id=COALESCE($3, provider_task_id),
                 provider_response_json=COALESCE($4, provider_response_json),
                 result_json=COALESCE($5, result_json),
                 error_code=$6,
                 error_message=$7,
                 completed_at=COALESCE($8, completed_at),
                 updated_at=$9,
                 version=version+1
             WHERE id=$1 AND deleted=FALSE",
        )
        .bind(update.task_id)
        .bind(&update.status)
        .bind(update.provider_task_id.as_deref())
        .bind(update.provider_response_json.as_deref())
        .bind(update.result_json.as_deref())
        .bind(update.error_code.as_deref())
        .bind(update.error_message.as_deref())
        .bind(update.completed_at.as_deref())
        .bind(&updated_at)
        .execute(&self.pool)
        .await
        .map_err(store_error("failed to update voice task provider state"))?;
        self.get_task_by_id(0, update.task_id)
            .await?
            .ok_or_else(|| VoiceServiceError::not_found("voice task not found"))
    }

    async fn insert_audio_artifact(
        &self,
        artifact: NewVoiceAudioArtifact,
    ) -> Result<VoiceAudioArtifactRecord, VoiceServiceError> {
        let created_at = now_text();
        sqlx::query(
            "INSERT INTO voice_audio_artifact (
                id, artifact_no, task_id, kind, artifact_type, provider_code,
                provider_asset_id, artifact_index, format, mime_type, media_resource_json,
                status, created_at, updated_at
             ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11,
                $12, $13, $13
             )",
        )
        .bind(artifact.id)
        .bind(&artifact.artifact_no)
        .bind(artifact.task_id)
        .bind(&artifact.kind)
        .bind(artifact.artifact_type.as_deref())
        .bind(artifact.provider_code.as_deref())
        .bind(artifact.provider_asset_id.as_deref())
        .bind(artifact.artifact_index)
        .bind(artifact.format.as_deref())
        .bind(artifact.mime_type.as_deref())
        .bind(&artifact.media_resource_json)
        .bind(&artifact.status)
        .bind(&created_at)
        .execute(&self.pool)
        .await
        .map_err(store_error("failed to insert voice audio artifact"))?;
        self.get_audio_artifact_by_id(0, artifact.id)
            .await?
            .ok_or_else(|| VoiceServiceError::storage("inserted voice audio artifact not found"))
    }

    async fn insert_artifact_drive_sync(
        &self,
        sync: NewVoiceArtifactDriveSync,
    ) -> Result<VoiceArtifactDriveSyncRecord, VoiceServiceError> {
        let created_at = now_text();
        sqlx::query(
            "INSERT INTO voice_artifact_drive_sync (
                id, sync_no, task_id, artifact_id, tenant_id, organization_id, user_id,
                actor_type, provider_code, provider_asset_id, artifact_index, source_uri,
                source_hash, drive_space_type, sync_status, created_at, updated_at
             ) VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12,
                $13, $14, $15, $16, $16
             )",
        )
        .bind(sync.id)
        .bind(&sync.sync_no)
        .bind(sync.task_id)
        .bind(sync.artifact_id)
        .bind(sync.tenant_id)
        .bind(sync.organization_id)
        .bind(sync.user_id)
        .bind(&sync.actor_type)
        .bind(sync.provider_code.as_deref())
        .bind(sync.provider_asset_id.as_deref())
        .bind(sync.artifact_index)
        .bind(sync.source_uri.as_deref())
        .bind(sync.source_hash.as_deref())
        .bind(&sync.drive_space_type)
        .bind(&sync.sync_status)
        .bind(&created_at)
        .execute(&self.pool)
        .await
        .map_err(store_error(
            "failed to insert voice artifact drive sync row",
        ))?;
        self.get_artifact_drive_sync_by_id(sync.id)
            .await?
            .ok_or_else(|| {
                VoiceServiceError::storage("inserted voice artifact drive sync not found")
            })
    }

    async fn insert_task_event(
        &self,
        event: NewVoiceTaskEvent,
    ) -> Result<VoiceTaskEventRecord, VoiceServiceError> {
        let created_at = now_text();
        sqlx::query(
            "INSERT INTO voice_task_event (
                id, event_no, task_id, event_type, from_status, to_status,
                payload_json, received_at, status, created_at, updated_at
             ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, 'processed', $9, $9
             )",
        )
        .bind(event.id)
        .bind(&event.event_no)
        .bind(event.task_id)
        .bind(&event.event_type)
        .bind(&event.from_status)
        .bind(&event.to_status)
        .bind(&event.payload_json)
        .bind(&event.received_at)
        .bind(&created_at)
        .execute(&self.pool)
        .await
        .map_err(store_error("failed to insert voice task event"))?;
        self.get_task_event_by_id(event.id)
            .await?
            .ok_or_else(|| VoiceServiceError::storage("inserted voice task event not found"))
    }

    async fn list_task_events(
        &self,
        query: VoiceTaskEventListQuery,
    ) -> Result<VoiceTaskEventListPage, VoiceServiceError> {
        let limit = list_limit(query.page, query.page_size);
        let offset = list_offset(query.page, query.page_size);
        let rows = sqlx::query(TASK_EVENT_LIST_SQL)
            .bind(query.tenant_id)
            .bind(query.task_id)
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
            .map_err(store_error("failed to list voice task events"))?;
        let has_more = rows.len() as i32 > query.page_size;
        let items = rows
            .iter()
            .take(query.page_size as usize)
            .map(map_task_event_row)
            .collect::<Result<Vec<_>, _>>()?;
        Ok(VoiceTaskEventListPage { items, has_more })
    }

    async fn insert_provider_route(
        &self,
        route: NewVoiceProviderRoute,
    ) -> Result<VoiceProviderRouteRecord, VoiceServiceError> {
        let created_at = now_text();
        sqlx::query(
            "INSERT INTO voice_provider_route (
                id, route_key, route_name, provider_id, client_protocol, upstream_protocol,
                upstream_config_json, enabled, managed_by, notes, created_at, updated_at
             ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11, $11
             )",
        )
        .bind(route.id)
        .bind(&route.route_key)
        .bind(&route.route_name)
        .bind(&route.provider_id)
        .bind(&route.client_protocol)
        .bind(&route.upstream_protocol)
        .bind(&route.upstream_config_json)
        .bind(route.enabled)
        .bind(&route.managed_by)
        .bind(&route.notes)
        .bind(&created_at)
        .execute(&self.pool)
        .await
        .map_err(store_error("failed to insert provider route"))?;
        self.get_provider_route_by_id(route.id)
            .await?
            .ok_or_else(|| VoiceServiceError::storage("inserted provider route not found"))
    }

    async fn get_provider_route_by_id(
        &self,
        route_id: i64,
    ) -> Result<Option<VoiceProviderRouteRecord>, VoiceServiceError> {
        let row = sqlx::query(PROVIDER_ROUTE_SELECT_SQL)
            .bind(route_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(store_error("failed to get provider route"))?;
        row.as_ref().map(map_provider_route_row).transpose()
    }

    async fn list_provider_routes(
        &self,
        query: VoiceProviderRouteListQuery,
    ) -> Result<VoiceProviderRouteListPage, VoiceServiceError> {
        let limit = list_limit(query.page, query.page_size);
        let offset = list_offset(query.page, query.page_size);
        let rows = sqlx::query(PROVIDER_ROUTE_LIST_SQL)
            .bind(query.provider_id.as_deref())
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
            .map_err(store_error("failed to list provider routes"))?;
        let has_more = rows.len() as i32 > query.page_size;
        let items = rows
            .iter()
            .take(query.page_size as usize)
            .map(map_provider_route_row)
            .collect::<Result<Vec<_>, _>>()?;
        Ok(VoiceProviderRouteListPage { items, has_more })
    }

    async fn update_provider_route(
        &self,
        update: VoiceProviderRouteUpdate,
    ) -> Result<VoiceProviderRouteRecord, VoiceServiceError> {
        let updated_at = now_text();
        sqlx::query(
            "UPDATE voice_provider_route
             SET route_name=COALESCE($2, route_name),
                 upstream_config_json=COALESCE($3, upstream_config_json),
                 enabled=COALESCE($4, enabled),
                 notes=COALESCE($5, notes),
                 updated_at=$6,
                 version=version+1
             WHERE id=$1 AND deleted=FALSE",
        )
        .bind(update.id)
        .bind(update.route_name.as_deref())
        .bind(update.upstream_config_json.as_deref())
        .bind(update.enabled)
        .bind(update.notes.as_deref())
        .bind(&updated_at)
        .execute(&self.pool)
        .await
        .map_err(store_error("failed to update provider route"))?;
        self.get_provider_route_by_id(update.id)
            .await?
            .ok_or_else(|| VoiceServiceError::not_found("provider route not found"))
    }

    async fn delete_provider_route(&self, route_id: i64) -> Result<(), VoiceServiceError> {
        let updated_at = now_text();
        sqlx::query(
            "UPDATE voice_provider_route
             SET deleted=TRUE, updated_at=$2, version=version+1
             WHERE id=$1 AND deleted=FALSE",
        )
        .bind(route_id)
        .bind(&updated_at)
        .execute(&self.pool)
        .await
        .map_err(store_error("failed to delete provider route"))?;
        Ok(())
    }

    async fn list_audio_artifacts(
        &self,
        query: VoiceAudioArtifactListQuery,
    ) -> Result<VoiceAudioArtifactListPage, VoiceServiceError> {
        let limit = list_limit(query.page, query.page_size);
        let offset = list_offset(query.page, query.page_size);
        let rows = sqlx::query(AUDIO_ARTIFACT_LIST_SQL)
            .bind(query.tenant_id)
            .bind(query.task_id)
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
            .map_err(store_error("failed to list audio artifacts"))?;
        let has_more = rows.len() as i32 > query.page_size;
        let items = rows
            .iter()
            .take(query.page_size as usize)
            .map(map_audio_artifact_row)
            .collect::<Result<Vec<_>, _>>()?;
        Ok(VoiceAudioArtifactListPage { items, has_more })
    }

    async fn get_audio_artifact_by_id(
        &self,
        tenant_id: i64,
        artifact_id: i64,
    ) -> Result<Option<VoiceAudioArtifactRecord>, VoiceServiceError> {
        let row = if tenant_id == 0 {
            sqlx::query(AUDIO_ARTIFACT_SELECT_SQL)
                .bind(artifact_id)
                .fetch_optional(&self.pool)
                .await
                .map_err(store_error("failed to get audio artifact"))?
        } else {
            sqlx::query(AUDIO_ARTIFACT_SELECT_BY_TENANT_SQL)
                .bind(artifact_id)
                .bind(tenant_id)
                .fetch_optional(&self.pool)
                .await
                .map_err(store_error("failed to get audio artifact"))?
        };
        row.as_ref().map(map_audio_artifact_row).transpose()
    }

    async fn get_audio_artifact_by_task_index(
        &self,
        task_id: i64,
        artifact_index: i32,
    ) -> Result<Option<VoiceAudioArtifactRecord>, VoiceServiceError> {
        let row = sqlx::query(AUDIO_ARTIFACT_SELECT_BY_TASK_INDEX_SQL)
            .bind(task_id)
            .bind(artifact_index)
            .fetch_optional(&self.pool)
            .await
            .map_err(store_error("failed to get audio artifact by task index"))?;
        row.as_ref().map(map_audio_artifact_row).transpose()
    }

    async fn delete_audio_artifact(
        &self,
        tenant_id: i64,
        artifact_id: i64,
    ) -> Result<(), VoiceServiceError> {
        let existing = self
            .get_audio_artifact_by_id(tenant_id, artifact_id)
            .await?
            .ok_or_else(|| VoiceServiceError::not_found("audio artifact not found"))?;
        let _ = existing;
        let updated_at = now_text();
        sqlx::query(
            "UPDATE voice_audio_artifact
             SET deleted=TRUE, updated_at=$2, version=version+1
             WHERE id=$1 AND deleted=FALSE",
        )
        .bind(artifact_id)
        .bind(&updated_at)
        .execute(&self.pool)
        .await
        .map_err(store_error("failed to delete audio artifact"))?;
        Ok(())
    }

    async fn list_artifact_drive_sync(
        &self,
        query: VoiceArtifactDriveSyncListQuery,
    ) -> Result<VoiceArtifactDriveSyncListPage, VoiceServiceError> {
        let limit = list_limit(query.page, query.page_size);
        let offset = list_offset(query.page, query.page_size);
        let rows = sqlx::query(ARTIFACT_DRIVE_SYNC_LIST_SQL)
            .bind(query.tenant_id)
            .bind(query.task_id)
            .bind(query.sync_status.as_deref())
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
            .map_err(store_error("failed to list artifact drive sync rows"))?;
        let has_more = rows.len() as i32 > query.page_size;
        let items = rows
            .iter()
            .take(query.page_size as usize)
            .map(map_artifact_drive_sync_row)
            .collect::<Result<Vec<_>, _>>()?;
        Ok(VoiceArtifactDriveSyncListPage { items, has_more })
    }

    async fn get_artifact_drive_sync_by_id(
        &self,
        sync_id: i64,
    ) -> Result<Option<VoiceArtifactDriveSyncRecord>, VoiceServiceError> {
        let row = sqlx::query(ARTIFACT_DRIVE_SYNC_SELECT_SQL)
            .bind(sync_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(store_error("failed to get artifact drive sync row"))?;
        row.as_ref().map(map_artifact_drive_sync_row).transpose()
    }

    async fn retry_artifact_drive_sync(
        &self,
        sync_id: i64,
    ) -> Result<VoiceArtifactDriveSyncRecord, VoiceServiceError> {
        let updated_at = now_text();
        sqlx::query(
            "UPDATE voice_artifact_drive_sync
             SET sync_status='pending_upload', error_code=NULL, error_message=NULL,
                 updated_at=$2, version=version+1
             WHERE id=$1 AND deleted=FALSE",
        )
        .bind(sync_id)
        .bind(&updated_at)
        .execute(&self.pool)
        .await
        .map_err(store_error("failed to retry artifact drive sync"))?;
        self.get_artifact_drive_sync_by_id(sync_id)
            .await?
            .ok_or_else(|| VoiceServiceError::not_found("artifact drive sync not found"))
    }

    async fn mark_artifact_drive_sync_uploading(
        &self,
        sync_id: i64,
        drive_space_id: &str,
    ) -> Result<VoiceArtifactDriveSyncRecord, VoiceServiceError> {
        let updated_at = now_text();
        sqlx::query(
            "UPDATE voice_artifact_drive_sync
             SET sync_status='uploading',
                 drive_space_id=$2,
                 error_code=NULL,
                 error_message=NULL,
                 updated_at=$3,
                 version=version+1
             WHERE id=$1 AND deleted=FALSE
               AND sync_status IN ('pending_upload', 'failed')",
        )
        .bind(sync_id)
        .bind(drive_space_id)
        .bind(&updated_at)
        .execute(&self.pool)
        .await
        .map_err(store_error("failed to mark artifact drive sync uploading"))?;
        self.get_artifact_drive_sync_by_id(sync_id)
            .await?
            .ok_or_else(|| VoiceServiceError::not_found("artifact drive sync not found"))
    }

    async fn mark_artifact_drive_sync_uploaded(
        &self,
        update: VoiceArtifactDriveSyncUploadUpdate,
    ) -> Result<VoiceArtifactDriveSyncRecord, VoiceServiceError> {
        sqlx::query(
            "UPDATE voice_artifact_drive_sync
             SET sync_status='uploaded',
                 drive_space_id=$2,
                 drive_node_id=$3,
                 drive_upload_item_id=$4,
                 drive_upload_session_id=$5,
                 drive_resource_json=$6,
                 error_code=NULL,
                 error_message=NULL,
                 uploaded_at=$7,
                 updated_at=$7,
                 version=version+1
             WHERE id=$1 AND deleted=FALSE",
        )
        .bind(update.sync_id)
        .bind(&update.drive_space_id)
        .bind(&update.drive_node_id)
        .bind(update.drive_upload_item_id.as_deref())
        .bind(update.drive_upload_session_id.as_deref())
        .bind(update.drive_resource_json.as_deref())
        .bind(&update.uploaded_at)
        .execute(&self.pool)
        .await
        .map_err(store_error("failed to mark artifact drive sync uploaded"))?;
        self.get_artifact_drive_sync_by_id(update.sync_id)
            .await?
            .ok_or_else(|| VoiceServiceError::not_found("artifact drive sync not found"))
    }

    async fn mark_artifact_drive_sync_failed(
        &self,
        sync_id: i64,
        error_code: &str,
        error_message: &str,
    ) -> Result<VoiceArtifactDriveSyncRecord, VoiceServiceError> {
        let updated_at = now_text();
        sqlx::query(
            "UPDATE voice_artifact_drive_sync
             SET sync_status='failed',
                 error_code=$2,
                 error_message=$3,
                 updated_at=$4,
                 version=version+1
             WHERE id=$1 AND deleted=FALSE",
        )
        .bind(sync_id)
        .bind(error_code)
        .bind(error_message)
        .bind(&updated_at)
        .execute(&self.pool)
        .await
        .map_err(store_error("failed to mark artifact drive sync failed"))?;
        self.get_artifact_drive_sync_by_id(sync_id)
            .await?
            .ok_or_else(|| VoiceServiceError::not_found("artifact drive sync not found"))
    }

    async fn update_audio_artifact_media_resource(
        &self,
        artifact_id: i64,
        media_resource_json: &str,
    ) -> Result<VoiceAudioArtifactRecord, VoiceServiceError> {
        let updated_at = now_text();
        sqlx::query(
            "UPDATE voice_audio_artifact
             SET media_resource_json=$2, updated_at=$3, version=version+1
             WHERE id=$1 AND deleted=FALSE",
        )
        .bind(artifact_id)
        .bind(media_resource_json)
        .bind(&updated_at)
        .execute(&self.pool)
        .await
        .map_err(store_error(
            "failed to update audio artifact media resource",
        ))?;
        self.get_audio_artifact_by_id(0, artifact_id)
            .await?
            .ok_or_else(|| VoiceServiceError::not_found("audio artifact not found"))
    }

    async fn insert_provider_webhook_event(
        &self,
        event: NewVoiceProviderWebhookEvent,
    ) -> Result<VoiceProviderWebhookEventRecord, VoiceServiceError> {
        let created_at = now_text();
        sqlx::query(
            "INSERT INTO voice_provider_webhook_event (
                id, event_no, provider_code, event_id, task_id, provider_task_id,
                signature_status, payload_hash, payload_json, processing_status,
                received_at, created_at, updated_at
             ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, 'accepted',
                $10, $11, $11
             )",
        )
        .bind(event.id)
        .bind(&event.event_no)
        .bind(&event.provider_code)
        .bind(&event.event_id)
        .bind(event.task_id)
        .bind(&event.provider_task_id)
        .bind(&event.signature_status)
        .bind(&event.payload_hash)
        .bind(&event.payload_json)
        .bind(&event.received_at)
        .bind(&created_at)
        .execute(&self.pool)
        .await
        .map_err(store_error("failed to insert provider webhook event"))?;
        self.get_provider_webhook_event_by_id(event.id)
            .await?
            .ok_or_else(|| VoiceServiceError::storage("inserted provider webhook event not found"))
    }

    async fn list_provider_webhook_events(
        &self,
        query: VoiceProviderWebhookEventListQuery,
    ) -> Result<VoiceProviderWebhookEventListPage, VoiceServiceError> {
        let limit = list_limit(query.page, query.page_size);
        let offset = list_offset(query.page, query.page_size);
        let rows = sqlx::query(PROVIDER_WEBHOOK_EVENT_LIST_SQL)
            .bind(query.provider_code.as_deref())
            .bind(query.processing_status.as_deref())
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
            .map_err(store_error("failed to list provider webhook events"))?;
        let has_more = rows.len() as i32 > query.page_size;
        let items = rows
            .iter()
            .take(query.page_size as usize)
            .map(map_provider_webhook_event_row)
            .collect::<Result<Vec<_>, _>>()?;
        Ok(VoiceProviderWebhookEventListPage { items, has_more })
    }

    async fn get_provider_webhook_event_by_id(
        &self,
        event_id: i64,
    ) -> Result<Option<VoiceProviderWebhookEventRecord>, VoiceServiceError> {
        let row = sqlx::query(PROVIDER_WEBHOOK_EVENT_SELECT_SQL)
            .bind(event_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(store_error("failed to get provider webhook event"))?;
        row.as_ref().map(map_provider_webhook_event_row).transpose()
    }

    async fn update_provider_webhook_event_processing(
        &self,
        event_id: i64,
        processing_status: &str,
        error_summary: Option<&str>,
    ) -> Result<VoiceProviderWebhookEventRecord, VoiceServiceError> {
        let updated_at = now_text();
        let processed_at = now_text();
        sqlx::query(
            "UPDATE voice_provider_webhook_event
             SET processing_status=$2,
                 error_summary=$3,
                 processed_at=$4,
                 attempt_count=attempt_count + 1,
                 updated_at=$5,
                 version=version + 1
             WHERE id=$1 AND deleted=FALSE",
        )
        .bind(event_id)
        .bind(processing_status)
        .bind(error_summary)
        .bind(&processed_at)
        .bind(&updated_at)
        .execute(&self.pool)
        .await
        .map_err(store_error(
            "failed to update provider webhook event processing status",
        ))?;
        self.get_provider_webhook_event_by_id(event_id)
            .await?
            .ok_or_else(|| VoiceServiceError::not_found("provider webhook event not found"))
    }

    async fn get_task_by_provider_task(
        &self,
        provider_code: &str,
        provider_task_id: &str,
    ) -> Result<Option<VoiceTaskRecord>, VoiceServiceError> {
        let row = sqlx::query(TASK_BY_PROVIDER_TASK_SQL)
            .bind(provider_code)
            .bind(provider_task_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(store_error("failed to get voice task by provider task id"))?;
        row.as_ref().map(map_task_row).transpose()
    }

    async fn list_webhook_deliveries(
        &self,
        query: VoiceWebhookDeliveryListQuery,
    ) -> Result<VoiceWebhookDeliveryListPage, VoiceServiceError> {
        let limit = list_limit(query.page, query.page_size);
        let offset = list_offset(query.page, query.page_size);
        let rows = sqlx::query(WEBHOOK_DELIVERY_LIST_SQL)
            .bind(query.task_id)
            .bind(query.delivery_status.as_deref())
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
            .map_err(store_error("failed to list webhook deliveries"))?;
        let has_more = rows.len() as i32 > query.page_size;
        let items = rows
            .iter()
            .take(query.page_size as usize)
            .map(map_webhook_delivery_row)
            .collect::<Result<Vec<_>, _>>()?;
        Ok(VoiceWebhookDeliveryListPage { items, has_more })
    }

    async fn list_request_logs(
        &self,
        query: VoiceRequestLogListQuery,
    ) -> Result<VoiceRequestLogListPage, VoiceServiceError> {
        let limit = list_limit(query.page, query.page_size);
        let offset = list_offset(query.page, query.page_size);
        let rows = sqlx::query(REQUEST_LOG_LIST_SQL)
            .bind(query.tenant_id)
            .bind(query.operation_id.as_deref())
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
            .map_err(store_error("failed to list request logs"))?;
        let has_more = rows.len() as i32 > query.page_size;
        let items = rows
            .iter()
            .take(query.page_size as usize)
            .map(map_request_log_row)
            .collect::<Result<Vec<_>, _>>()?;
        Ok(VoiceRequestLogListPage { items, has_more })
    }

    async fn insert_request_log(
        &self,
        log: NewVoiceRequestLog,
    ) -> Result<VoiceRequestLogRecord, VoiceServiceError> {
        let created_at = now_text();
        sqlx::query(
            "INSERT INTO voice_request_log (
                id, request_id, trace_id, tenant_id, capability, operation_id, consumer,
                status, latency_ms, created_at
             ) VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10
             )",
        )
        .bind(log.id)
        .bind(&log.request_id)
        .bind(&log.trace_id)
        .bind(log.tenant_id)
        .bind(&log.capability)
        .bind(&log.operation_id)
        .bind(&log.consumer)
        .bind(&log.status)
        .bind(log.latency_ms)
        .bind(&created_at)
        .execute(&self.pool)
        .await
        .map_err(store_error("failed to insert request log"))?;
        let row = sqlx::query(REQUEST_LOG_SELECT_SQL)
            .bind(log.id)
            .fetch_optional(&self.pool)
            .await
            .map_err(store_error("failed to read inserted request log"))?;
        row.as_ref()
            .map(map_request_log_row)
            .transpose()?
            .ok_or_else(|| VoiceServiceError::storage("inserted request log not found"))
    }
}

impl SqlVoiceStore {
    async fn get_task_event_by_id(
        &self,
        event_id: i64,
    ) -> Result<Option<VoiceTaskEventRecord>, VoiceServiceError> {
        let row = sqlx::query(TASK_EVENT_SELECT_SQL)
            .bind(event_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(store_error("failed to get voice task event"))?;
        row.as_ref().map(map_task_event_row).transpose()
    }

    async fn get_provider_webhook_event_by_id(
        &self,
        event_id: i64,
    ) -> Result<Option<VoiceProviderWebhookEventRecord>, VoiceServiceError> {
        let row = sqlx::query(PROVIDER_WEBHOOK_EVENT_SELECT_SQL)
            .bind(event_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(store_error("failed to get provider webhook event"))?;
        row.as_ref().map(map_provider_webhook_event_row).transpose()
    }
}

const TASK_SELECT_SQL: &str = "
    SELECT id, task_no, tenant_id, organization_id, user_id, operation_type,
           provider_code, provider_route_id, model, provider_task_id, idempotency_key,
           status, progress, request_json, result_json, error_code, error_message,
           CAST(created_at AS TEXT) AS created_at, CAST(updated_at AS TEXT) AS updated_at,
           CAST(completed_at AS TEXT) AS completed_at
    FROM voice_generation_task
    WHERE id=$1 AND deleted=FALSE
    LIMIT 1";

const TASK_SELECT_BY_TENANT_SQL: &str = "
    SELECT id, task_no, tenant_id, organization_id, user_id, operation_type,
           provider_code, provider_route_id, model, provider_task_id, idempotency_key,
           status, progress, request_json, result_json, error_code, error_message,
           CAST(created_at AS TEXT) AS created_at, CAST(updated_at AS TEXT) AS updated_at,
           CAST(completed_at AS TEXT) AS completed_at
    FROM voice_generation_task
    WHERE id=$1 AND tenant_id=$2 AND deleted=FALSE
    LIMIT 1";

const TASK_SELECT_BY_IDEMPOTENCY_SQL: &str = "
    SELECT id, task_no, tenant_id, organization_id, user_id, operation_type,
           provider_code, provider_route_id, model, provider_task_id, idempotency_key,
           status, progress, request_json, result_json, error_code, error_message,
           CAST(created_at AS TEXT) AS created_at, CAST(updated_at AS TEXT) AS updated_at,
           CAST(completed_at AS TEXT) AS completed_at
    FROM voice_generation_task
    WHERE tenant_id=$1 AND operation_type=$2 AND idempotency_key=$3 AND deleted=FALSE
    LIMIT 1";

const TASK_BY_PROVIDER_TASK_SQL: &str = "
    SELECT id, task_no, tenant_id, organization_id, user_id, operation_type,
           provider_code, provider_route_id, model, provider_task_id, idempotency_key,
           status, progress, request_json, result_json, error_code, error_message,
           CAST(created_at AS TEXT) AS created_at, CAST(updated_at AS TEXT) AS updated_at,
           CAST(completed_at AS TEXT) AS completed_at
    FROM voice_generation_task
    WHERE provider_code=$1 AND provider_task_id=$2 AND deleted=FALSE
    LIMIT 1";

const TASK_LIST_SQL: &str = "
    SELECT id, task_no, tenant_id, organization_id, user_id, operation_type,
           provider_code, provider_route_id, model, provider_task_id, idempotency_key,
           status, progress, request_json, result_json, error_code, error_message,
           CAST(created_at AS TEXT) AS created_at, CAST(updated_at AS TEXT) AS updated_at,
           CAST(completed_at AS TEXT) AS completed_at
    FROM voice_generation_task
    WHERE tenant_id=$1
      AND ($2 IS NULL OR organization_id=$2)
      AND ($3 IS NULL OR user_id=$3)
      AND ($4 IS NULL OR operation_type=$4)
      AND ($5 IS NULL OR status=$5)
      AND deleted=FALSE
    ORDER BY created_at DESC, id DESC
    LIMIT $6 OFFSET $7";

const TASK_EVENT_SELECT_SQL: &str = "
    SELECT id, event_no, task_id, event_type, from_status, to_status,
           payload_json, status, CAST(received_at AS TEXT) AS received_at,
           CAST(created_at AS TEXT) AS created_at
    FROM voice_task_event
    WHERE id=$1 AND deleted=FALSE
    LIMIT 1";

const TASK_EVENT_LIST_SQL: &str = "
    SELECT e.id, e.event_no, e.task_id, e.event_type, e.from_status, e.to_status,
           e.payload_json, e.status, CAST(e.received_at AS TEXT) AS received_at,
           CAST(e.created_at AS TEXT) AS created_at
    FROM voice_task_event e
    INNER JOIN voice_generation_task t ON t.id = e.task_id AND t.deleted = FALSE
    WHERE t.tenant_id = $1
      AND ($2 IS NULL OR e.task_id = $2)
      AND e.deleted = FALSE
    ORDER BY e.created_at DESC, e.id DESC
    LIMIT $3 OFFSET $4";

const PROVIDER_ROUTE_SELECT_SQL: &str = "
    SELECT id, route_key, route_name, provider_id, client_protocol, upstream_protocol,
           upstream_config_json, enabled, managed_by, notes,
           CAST(created_at AS TEXT) AS created_at, CAST(updated_at AS TEXT) AS updated_at
    FROM voice_provider_route
    WHERE id=$1 AND deleted=FALSE
    LIMIT 1";

const PROVIDER_ROUTE_LIST_SQL: &str = "
    SELECT id, route_key, route_name, provider_id, client_protocol, upstream_protocol,
           upstream_config_json, enabled, managed_by, notes,
           CAST(created_at AS TEXT) AS created_at, CAST(updated_at AS TEXT) AS updated_at
    FROM voice_provider_route
    WHERE ($1 IS NULL OR provider_id=$1)
      AND deleted=FALSE
    ORDER BY created_at DESC, id DESC
    LIMIT $2 OFFSET $3";

const AUDIO_ARTIFACT_SELECT_SQL: &str = "
    SELECT id, artifact_no, task_id, request_id, kind, artifact_type, title, voice_id,
           provider_code, format, mime_type, duration_seconds, media_resource_json, status,
           CAST(created_at AS TEXT) AS created_at, CAST(updated_at AS TEXT) AS updated_at
    FROM voice_audio_artifact
    WHERE id=$1 AND deleted=FALSE
    LIMIT 1";

const AUDIO_ARTIFACT_LIST_SQL: &str = "
    SELECT a.id, a.artifact_no, a.task_id, a.request_id, a.kind, a.artifact_type, a.title, a.voice_id,
           a.provider_code, a.format, a.mime_type, a.duration_seconds, a.media_resource_json, a.status,
           CAST(a.created_at AS TEXT) AS created_at, CAST(a.updated_at AS TEXT) AS updated_at
    FROM voice_audio_artifact a
    INNER JOIN voice_generation_task t ON t.id = a.task_id AND t.deleted = FALSE
    WHERE t.tenant_id = $1
      AND ($2 IS NULL OR a.task_id = $2)
      AND a.deleted = FALSE
    ORDER BY a.created_at DESC, a.id DESC
    LIMIT $3 OFFSET $4";

const AUDIO_ARTIFACT_SELECT_BY_TENANT_SQL: &str = "
    SELECT a.id, a.artifact_no, a.task_id, a.request_id, a.kind, a.artifact_type, a.title, a.voice_id,
           a.provider_code, a.format, a.mime_type, a.duration_seconds, a.media_resource_json, a.status,
           CAST(a.created_at AS TEXT) AS created_at, CAST(a.updated_at AS TEXT) AS updated_at
    FROM voice_audio_artifact a
    INNER JOIN voice_generation_task t ON t.id = a.task_id AND t.deleted = FALSE
    WHERE a.id = $1 AND t.tenant_id = $2 AND a.deleted = FALSE
    LIMIT 1";

const AUDIO_ARTIFACT_SELECT_BY_TASK_INDEX_SQL: &str = "
    SELECT id, artifact_no, task_id, request_id, kind, artifact_type, title, voice_id,
           provider_code, format, mime_type, duration_seconds, media_resource_json, status,
           CAST(created_at AS TEXT) AS created_at, CAST(updated_at AS TEXT) AS updated_at
    FROM voice_audio_artifact
    WHERE task_id = $1 AND artifact_index = $2 AND deleted = FALSE
    LIMIT 1";

const ARTIFACT_DRIVE_SYNC_SELECT_SQL: &str = "
    SELECT id, sync_no, task_id, artifact_id, artifact_index, tenant_id, organization_id, user_id,
           sync_status, source_uri, drive_space_type, drive_space_id, drive_node_id,
           error_code, error_message,
           CAST(created_at AS TEXT) AS created_at, CAST(updated_at AS TEXT) AS updated_at
    FROM voice_artifact_drive_sync
    WHERE id=$1 AND deleted=FALSE
    LIMIT 1";

const ARTIFACT_DRIVE_SYNC_LIST_SQL: &str = "
    SELECT id, sync_no, task_id, artifact_id, artifact_index, tenant_id, organization_id, user_id,
           sync_status, source_uri, drive_space_type, drive_space_id, drive_node_id,
           error_code, error_message,
           CAST(created_at AS TEXT) AS created_at, CAST(updated_at AS TEXT) AS updated_at
    FROM voice_artifact_drive_sync
    WHERE tenant_id=$1
      AND ($2 IS NULL OR task_id=$2)
      AND ($3 IS NULL OR sync_status=$3)
      AND deleted=FALSE
    ORDER BY updated_at DESC, id DESC
    LIMIT $4 OFFSET $5";

const PROVIDER_WEBHOOK_EVENT_SELECT_SQL: &str = "
    SELECT id, event_no, provider_code, event_id, task_id, provider_task_id,
           signature_status, payload_hash, payload_json, processing_status,
           CAST(received_at AS TEXT) AS received_at, CAST(created_at AS TEXT) AS created_at
    FROM voice_provider_webhook_event
    WHERE id=$1 AND deleted=FALSE
    LIMIT 1";

const PROVIDER_WEBHOOK_EVENT_LIST_SQL: &str = "
    SELECT id, event_no, provider_code, event_id, task_id, provider_task_id,
           signature_status, payload_hash, payload_json, processing_status,
           CAST(received_at AS TEXT) AS received_at, CAST(created_at AS TEXT) AS created_at
    FROM voice_provider_webhook_event
    WHERE ($1 IS NULL OR provider_code=$1)
      AND ($2 IS NULL OR processing_status=$2)
      AND deleted=FALSE
    ORDER BY received_at DESC, id DESC
    LIMIT $3 OFFSET $4";

const WEBHOOK_DELIVERY_LIST_SQL: &str = "
    SELECT id, delivery_no, task_id, event_type, target_url, delivery_status,
           attempt_count, CAST(created_at AS TEXT) AS created_at
    FROM voice_webhook_delivery
    WHERE ($1 IS NULL OR task_id=$1)
      AND ($2 IS NULL OR delivery_status=$2)
      AND deleted=FALSE
    ORDER BY created_at DESC, id DESC
    LIMIT $3 OFFSET $4";

const REQUEST_LOG_LIST_SQL: &str = "
    SELECT id, request_id, trace_id, capability, operation_id, consumer, status,
           latency_ms, CAST(created_at AS TEXT) AS created_at
    FROM voice_request_log
    WHERE tenant_id = $1
      AND ($2 IS NULL OR operation_id = $2)
      AND deleted = FALSE
    ORDER BY created_at DESC, id DESC
    LIMIT $3 OFFSET $4";

const REQUEST_LOG_SELECT_SQL: &str = "
    SELECT id, request_id, trace_id, capability, operation_id, consumer, status,
           latency_ms, CAST(created_at AS TEXT) AS created_at
    FROM voice_request_log
    WHERE id = $1 AND deleted = FALSE
    LIMIT 1";

fn map_task_row(row: &sqlx::any::AnyRow) -> Result<VoiceTaskRecord, VoiceServiceError> {
    Ok(VoiceTaskRecord {
        id: row.get("id"),
        task_no: row.get("task_no"),
        tenant_id: row.get("tenant_id"),
        organization_id: row.get("organization_id"),
        user_id: row.get("user_id"),
        operation_type: row.get("operation_type"),
        provider_code: row.get("provider_code"),
        provider_route_id: row.get("provider_route_id"),
        model: row.get("model"),
        provider_task_id: row.get("provider_task_id"),
        idempotency_key: row.get("idempotency_key"),
        status: row.get("status"),
        progress: row.get("progress"),
        request_json: row.get("request_json"),
        result_json: row.get("result_json"),
        error_code: row.get("error_code"),
        error_message: row.get("error_message"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
        completed_at: row.get("completed_at"),
    })
}

fn map_task_event_row(row: &sqlx::any::AnyRow) -> Result<VoiceTaskEventRecord, VoiceServiceError> {
    Ok(VoiceTaskEventRecord {
        id: row.get("id"),
        event_no: row.get("event_no"),
        task_id: row.get("task_id"),
        event_type: row.get("event_type"),
        from_status: row.get("from_status"),
        to_status: row.get("to_status"),
        payload_json: row.get("payload_json"),
        status: row.get("status"),
        received_at: row.get("received_at"),
        created_at: row.get("created_at"),
    })
}

fn map_provider_route_row(
    row: &sqlx::any::AnyRow,
) -> Result<VoiceProviderRouteRecord, VoiceServiceError> {
    Ok(VoiceProviderRouteRecord {
        id: row.get("id"),
        route_key: row.get("route_key"),
        route_name: row.get("route_name"),
        provider_id: row.get("provider_id"),
        client_protocol: row.get("client_protocol"),
        upstream_protocol: row.get("upstream_protocol"),
        upstream_config_json: row.get("upstream_config_json"),
        enabled: row.get("enabled"),
        managed_by: row.get("managed_by"),
        notes: row.get("notes"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    })
}

fn map_audio_artifact_row(
    row: &sqlx::any::AnyRow,
) -> Result<VoiceAudioArtifactRecord, VoiceServiceError> {
    Ok(VoiceAudioArtifactRecord {
        id: row.get("id"),
        artifact_no: row.get("artifact_no"),
        task_id: row.get("task_id"),
        request_id: row.get("request_id"),
        kind: row.get("kind"),
        artifact_type: row.get("artifact_type"),
        title: row.get("title"),
        voice_id: row.get("voice_id"),
        provider_code: row.get("provider_code"),
        format: row.get("format"),
        mime_type: row.get("mime_type"),
        duration_seconds: row.get("duration_seconds"),
        media_resource_json: row.get("media_resource_json"),
        status: row.get("status"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    })
}

fn map_artifact_drive_sync_row(
    row: &sqlx::any::AnyRow,
) -> Result<VoiceArtifactDriveSyncRecord, VoiceServiceError> {
    Ok(VoiceArtifactDriveSyncRecord {
        id: row.get("id"),
        sync_no: row.get("sync_no"),
        task_id: row.get("task_id"),
        artifact_id: row.get("artifact_id"),
        artifact_index: row.get("artifact_index"),
        tenant_id: row.get("tenant_id"),
        organization_id: row.get("organization_id"),
        user_id: row.get("user_id"),
        sync_status: row.get("sync_status"),
        source_uri: row.get("source_uri"),
        drive_space_type: row.get("drive_space_type"),
        drive_space_id: row.get("drive_space_id"),
        drive_node_id: row.get("drive_node_id"),
        error_code: row.get("error_code"),
        error_message: row.get("error_message"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    })
}

fn map_provider_webhook_event_row(
    row: &sqlx::any::AnyRow,
) -> Result<VoiceProviderWebhookEventRecord, VoiceServiceError> {
    Ok(VoiceProviderWebhookEventRecord {
        id: row.get("id"),
        event_no: row.get("event_no"),
        provider_code: row.get("provider_code"),
        event_id: row.get("event_id"),
        task_id: row.get("task_id"),
        provider_task_id: row.get("provider_task_id"),
        signature_status: row.get("signature_status"),
        payload_hash: row.get("payload_hash"),
        payload_json: row.get("payload_json"),
        processing_status: row.get("processing_status"),
        received_at: row.get("received_at"),
        created_at: row.get("created_at"),
    })
}

fn map_webhook_delivery_row(
    row: &sqlx::any::AnyRow,
) -> Result<VoiceWebhookDeliveryRecord, VoiceServiceError> {
    Ok(VoiceWebhookDeliveryRecord {
        id: row.get("id"),
        delivery_no: row.get("delivery_no"),
        task_id: row.get("task_id"),
        event_type: row.get("event_type"),
        target_url: row.get("target_url"),
        delivery_status: row.get("delivery_status"),
        attempt_count: row.get("attempt_count"),
        created_at: row.get("created_at"),
    })
}

fn map_request_log_row(
    row: &sqlx::any::AnyRow,
) -> Result<VoiceRequestLogRecord, VoiceServiceError> {
    Ok(VoiceRequestLogRecord {
        id: row.get("id"),
        request_id: row.get("request_id"),
        trace_id: row.get("trace_id"),
        capability: row.get("capability"),
        operation_id: row.get("operation_id"),
        consumer: row.get("consumer"),
        status: row.get("status"),
        latency_ms: row.get("latency_ms"),
        created_at: row.get("created_at"),
    })
}
