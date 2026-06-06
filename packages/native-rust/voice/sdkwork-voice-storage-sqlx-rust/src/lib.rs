pub const VOICE_STORAGE_SCHEMA_VERSION: &str = "2026-06-06";
pub const VOICE_INITIAL_MIGRATION: &str = "0001_voice_core.sql";

use sqlx::{AnyPool, Row};

const VOICE_INITIAL_MIGRATION_SQL: &str = include_str!("../migrations/0001_voice_core.sql");

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum VoiceArtifactDriveSyncStatus {
    Deleted,
    Failed,
    PendingUpload,
    Skipped,
    Uploaded,
    Uploading,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NewVoiceArtifactDriveSync {
    pub id: i64,
    pub sync_no: String,
    pub task_id: i64,
    pub artifact_id: i64,
    pub tenant_id: i64,
    pub organization_id: i64,
    pub user_id: i64,
    pub anonymous_id: Option<String>,
    pub actor_type: String,
    pub provider_code: Option<String>,
    pub provider_asset_id: Option<String>,
    pub artifact_index: i64,
    pub source_uri: Option<String>,
    pub source_hash: Option<String>,
    pub drive_space_type: String,
    pub scheduled_at: String,
    pub created_at: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoiceArtifactDriveSyncRecord {
    pub id: i64,
    pub sync_no: String,
    pub task_id: i64,
    pub artifact_id: i64,
    pub tenant_id: i64,
    pub organization_id: i64,
    pub user_id: i64,
    pub anonymous_id: Option<String>,
    pub actor_type: String,
    pub provider_code: Option<String>,
    pub provider_asset_id: Option<String>,
    pub artifact_index: i64,
    pub source_uri: Option<String>,
    pub source_hash: Option<String>,
    pub drive_space_type: String,
    pub drive_space_id: Option<String>,
    pub drive_node_id: Option<String>,
    pub drive_upload_item_id: Option<String>,
    pub drive_upload_session_id: Option<String>,
    pub drive_resource_json: Option<String>,
    pub sync_status: VoiceArtifactDriveSyncStatus,
    pub error_code: Option<String>,
    pub error_message: Option<String>,
    pub scheduled_at: Option<String>,
    pub uploaded_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone, Debug)]
pub struct SqlVoiceArtifactDriveSyncRepository {
    pool: AnyPool,
}

impl SqlVoiceArtifactDriveSyncRepository {
    pub fn new(pool: AnyPool) -> Self {
        Self { pool }
    }

    pub async fn insert_pending(
        &self,
        row: NewVoiceArtifactDriveSync,
    ) -> Result<VoiceArtifactDriveSyncRecord, sqlx::Error> {
        sqlx::query(
            "INSERT INTO voice_artifact_drive_sync (
                id, sync_no, task_id, artifact_id, tenant_id, organization_id, user_id,
                anonymous_id, actor_type, provider_code, provider_asset_id, artifact_index,
                source_uri, source_hash, drive_space_type, sync_status, scheduled_at,
                created_at, updated_at
             ) VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12,
                $13, $14, $15, 'pending_upload', $16,
                $17, $17
             )",
        )
        .bind(row.id)
        .bind(&row.sync_no)
        .bind(row.task_id)
        .bind(row.artifact_id)
        .bind(row.tenant_id)
        .bind(row.organization_id)
        .bind(row.user_id)
        .bind(&row.anonymous_id)
        .bind(&row.actor_type)
        .bind(&row.provider_code)
        .bind(&row.provider_asset_id)
        .bind(row.artifact_index)
        .bind(&row.source_uri)
        .bind(&row.source_hash)
        .bind(&row.drive_space_type)
        .bind(&row.scheduled_at)
        .bind(&row.created_at)
        .execute(&self.pool)
        .await?;

        self.get_by_id(row.id)
            .await?
            .ok_or(sqlx::Error::RowNotFound)
    }

    pub async fn mark_uploading(
        &self,
        id: i64,
        drive_space_id: &str,
        drive_upload_item_id: Option<&str>,
        drive_upload_session_id: Option<&str>,
        updated_at: &str,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            "UPDATE voice_artifact_drive_sync
             SET sync_status='uploading',
                 drive_space_id=$2,
                 drive_upload_item_id=$3,
                 drive_upload_session_id=$4,
                 error_code=NULL,
                 error_message=NULL,
                 updated_at=$5,
                 version=version + 1
             WHERE id=$1 AND deleted=FALSE",
        )
        .bind(id)
        .bind(drive_space_id)
        .bind(drive_upload_item_id)
        .bind(drive_upload_session_id)
        .bind(updated_at)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn mark_uploaded(
        &self,
        id: i64,
        drive_space_id: &str,
        drive_node_id: &str,
        drive_upload_item_id: Option<&str>,
        drive_upload_session_id: Option<&str>,
        drive_resource_json: Option<&str>,
        uploaded_at: &str,
    ) -> Result<(), sqlx::Error> {
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
                 version=version + 1
             WHERE id=$1 AND deleted=FALSE",
        )
        .bind(id)
        .bind(drive_space_id)
        .bind(drive_node_id)
        .bind(drive_upload_item_id)
        .bind(drive_upload_session_id)
        .bind(drive_resource_json)
        .bind(uploaded_at)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn mark_failed(
        &self,
        id: i64,
        error_code: &str,
        error_message: &str,
        updated_at: &str,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            "UPDATE voice_artifact_drive_sync
             SET sync_status='failed',
                 error_code=$2,
                 error_message=$3,
                 updated_at=$4,
                 version=version + 1
             WHERE id=$1 AND deleted=FALSE",
        )
        .bind(id)
        .bind(error_code)
        .bind(error_message)
        .bind(updated_at)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn list_by_task(
        &self,
        task_id: i64,
    ) -> Result<Vec<VoiceArtifactDriveSyncRecord>, sqlx::Error> {
        let rows = sqlx::query(VOICE_ARTIFACT_DRIVE_SYNC_SELECT_BY_TASK_SQL)
            .bind(task_id)
            .fetch_all(&self.pool)
            .await?;
        rows.iter().map(map_voice_artifact_drive_sync_row).collect()
    }

    pub async fn get_by_id(
        &self,
        id: i64,
    ) -> Result<Option<VoiceArtifactDriveSyncRecord>, sqlx::Error> {
        let row = sqlx::query(VOICE_ARTIFACT_DRIVE_SYNC_SELECT_BY_ID_SQL)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        row.as_ref()
            .map(map_voice_artifact_drive_sync_row)
            .transpose()
    }
}

const VOICE_ARTIFACT_DRIVE_SYNC_SELECT_BY_ID_SQL: &str = "
    SELECT
        id, sync_no, task_id, artifact_id, tenant_id, organization_id, user_id,
        anonymous_id, actor_type, provider_code, provider_asset_id, artifact_index,
        source_uri, source_hash, drive_space_type, drive_space_id, drive_node_id,
        drive_upload_item_id, drive_upload_session_id, drive_resource_json,
        sync_status, error_code, error_message, CAST(scheduled_at AS TEXT) AS scheduled_at,
        CAST(uploaded_at AS TEXT) AS uploaded_at, CAST(created_at AS TEXT) AS created_at,
        CAST(updated_at AS TEXT) AS updated_at
    FROM voice_artifact_drive_sync
    WHERE id=$1 AND deleted=FALSE
    LIMIT 1";

const VOICE_ARTIFACT_DRIVE_SYNC_SELECT_BY_TASK_SQL: &str = "
    SELECT
        id, sync_no, task_id, artifact_id, tenant_id, organization_id, user_id,
        anonymous_id, actor_type, provider_code, provider_asset_id, artifact_index,
        source_uri, source_hash, drive_space_type, drive_space_id, drive_node_id,
        drive_upload_item_id, drive_upload_session_id, drive_resource_json,
        sync_status, error_code, error_message, CAST(scheduled_at AS TEXT) AS scheduled_at,
        CAST(uploaded_at AS TEXT) AS uploaded_at, CAST(created_at AS TEXT) AS created_at,
        CAST(updated_at AS TEXT) AS updated_at
    FROM voice_artifact_drive_sync
    WHERE task_id=$1 AND deleted=FALSE
    ORDER BY artifact_index ASC, id ASC";

fn map_voice_artifact_drive_sync_row(
    row: &sqlx::any::AnyRow,
) -> Result<VoiceArtifactDriveSyncRecord, sqlx::Error> {
    Ok(VoiceArtifactDriveSyncRecord {
        id: row.get("id"),
        sync_no: row.get("sync_no"),
        task_id: row.get("task_id"),
        artifact_id: row.get("artifact_id"),
        tenant_id: row.get("tenant_id"),
        organization_id: row.get("organization_id"),
        user_id: row.get("user_id"),
        anonymous_id: row.get("anonymous_id"),
        actor_type: row.get("actor_type"),
        provider_code: row.get("provider_code"),
        provider_asset_id: row.get("provider_asset_id"),
        artifact_index: row.get("artifact_index"),
        source_uri: row.get("source_uri"),
        source_hash: row.get("source_hash"),
        drive_space_type: row.get("drive_space_type"),
        drive_space_id: row.get("drive_space_id"),
        drive_node_id: row.get("drive_node_id"),
        drive_upload_item_id: row.get("drive_upload_item_id"),
        drive_upload_session_id: row.get("drive_upload_session_id"),
        drive_resource_json: row.get("drive_resource_json"),
        sync_status: parse_voice_artifact_drive_sync_status(row.get("sync_status"))?,
        error_code: row.get("error_code"),
        error_message: row.get("error_message"),
        scheduled_at: row.get("scheduled_at"),
        uploaded_at: row.get("uploaded_at"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    })
}

fn parse_voice_artifact_drive_sync_status(
    value: String,
) -> Result<VoiceArtifactDriveSyncStatus, sqlx::Error> {
    match value.as_str() {
        "deleted" => Ok(VoiceArtifactDriveSyncStatus::Deleted),
        "failed" => Ok(VoiceArtifactDriveSyncStatus::Failed),
        "pending_upload" => Ok(VoiceArtifactDriveSyncStatus::PendingUpload),
        "skipped" => Ok(VoiceArtifactDriveSyncStatus::Skipped),
        "uploaded" => Ok(VoiceArtifactDriveSyncStatus::Uploaded),
        "uploading" => Ok(VoiceArtifactDriveSyncStatus::Uploading),
        _ => Err(sqlx::Error::Decode(
            format!("unknown voice_artifact_drive_sync.sync_status: {value}").into(),
        )),
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoiceRepositoryBinding {
    pub domain: &'static str,
    pub repository_name: &'static str,
    pub tables: Vec<&'static str>,
    pub requires_transaction: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoiceStorageCapabilityManifest {
    pub name: &'static str,
    pub schema_version: &'static str,
    pub tables: Vec<&'static str>,
    pub route_tables: Vec<&'static str>,
    pub task_tables: Vec<&'static str>,
    pub artifact_tables: Vec<&'static str>,
    pub artifact_sync_tables: Vec<&'static str>,
    pub webhook_tables: Vec<&'static str>,
    pub request_tables: Vec<&'static str>,
    pub migrations: Vec<&'static str>,
    pub repository_bindings: Vec<VoiceRepositoryBinding>,
}

pub fn voice_route_tables() -> Vec<&'static str> {
    vec!["voice_provider_route", "voice_provider_route_capability"]
}

pub fn voice_artifact_tables() -> Vec<&'static str> {
    vec!["voice_audio_artifact"]
}

pub fn voice_artifact_sync_tables() -> Vec<&'static str> {
    vec!["voice_artifact_drive_sync"]
}

pub fn voice_task_tables() -> Vec<&'static str> {
    vec!["voice_generation_task", "voice_task_event"]
}

pub fn voice_webhook_tables() -> Vec<&'static str> {
    vec!["voice_provider_webhook_event", "voice_webhook_delivery"]
}

pub fn voice_request_tables() -> Vec<&'static str> {
    vec!["voice_request_log"]
}

pub fn voice_database_tables() -> Vec<&'static str> {
    let mut tables = voice_route_tables();
    tables.extend(voice_task_tables());
    tables.extend(voice_artifact_tables());
    tables.extend(voice_artifact_sync_tables());
    tables.extend(voice_webhook_tables());
    tables.extend(voice_request_tables());
    tables
}

pub fn voice_initial_migration_sql() -> &'static str {
    VOICE_INITIAL_MIGRATION_SQL
}

pub fn voice_storage_capability_manifest() -> VoiceStorageCapabilityManifest {
    VoiceStorageCapabilityManifest {
        name: "voice-storage",
        schema_version: VOICE_STORAGE_SCHEMA_VERSION,
        tables: voice_database_tables(),
        route_tables: voice_route_tables(),
        task_tables: voice_task_tables(),
        artifact_tables: voice_artifact_tables(),
        artifact_sync_tables: voice_artifact_sync_tables(),
        webhook_tables: voice_webhook_tables(),
        request_tables: voice_request_tables(),
        migrations: vec![VOICE_INITIAL_MIGRATION],
        repository_bindings: vec![
            VoiceRepositoryBinding {
                domain: "voice",
                repository_name: "VoiceProviderRouteRepository",
                tables: voice_route_tables(),
                requires_transaction: true,
            },
            VoiceRepositoryBinding {
                domain: "voice",
                repository_name: "VoiceAudioArtifactRepository",
                tables: voice_artifact_tables(),
                requires_transaction: true,
            },
            VoiceRepositoryBinding {
                domain: "voice",
                repository_name: "VoiceArtifactDriveSyncRepository",
                tables: voice_artifact_sync_tables(),
                requires_transaction: true,
            },
            VoiceRepositoryBinding {
                domain: "voice",
                repository_name: "VoiceGenerationTaskRepository",
                tables: vec!["voice_generation_task"],
                requires_transaction: true,
            },
            VoiceRepositoryBinding {
                domain: "voice",
                repository_name: "VoiceTaskEventRepository",
                tables: vec!["voice_task_event"],
                requires_transaction: true,
            },
            VoiceRepositoryBinding {
                domain: "voice",
                repository_name: "VoiceProviderWebhookEventRepository",
                tables: vec!["voice_provider_webhook_event"],
                requires_transaction: true,
            },
            VoiceRepositoryBinding {
                domain: "voice",
                repository_name: "VoiceWebhookDeliveryRepository",
                tables: vec!["voice_webhook_delivery"],
                requires_transaction: true,
            },
            VoiceRepositoryBinding {
                domain: "voice",
                repository_name: "VoiceRequestLogRepository",
                tables: voice_request_tables(),
                requires_transaction: false,
            },
        ],
    }
}
