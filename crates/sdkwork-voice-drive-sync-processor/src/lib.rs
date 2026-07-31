use std::path::PathBuf;
use std::sync::Arc;

use async_trait::async_trait;
use sdkwork_database_sqlx::DatabasePool;
use sdkwork_drive_storage_local::LocalDriveObjectStore;
use sdkwork_drive_workspace_service::application::space_service::DriveSpaceService;
use sdkwork_drive_workspace_service::application::workspace_service::DriveWorkspaceService;
use sdkwork_drive_workspace_service::bootstrap::bootstrap_drive_database;
use sdkwork_drive_workspace_service::infrastructure::sql::space_store::SqlSpaceStore;
use sdkwork_drive_workspace_service::infrastructure::sql::workspace_store::SqlDriveWorkspaceStore;
use sdkwork_utils_rust::{format_datetime, now, sha256_hash};
use sdkwork_voice_artifact_drive_service::{
    DriveWorkspaceVoiceBytesPersister, GeneratedArtifactActor, VoiceGeneratedArtifact,
    VoiceGeneratedArtifactBytes, VoiceGeneratedArtifactBytesBatch, VoiceGeneratedArtifactKind,
};
use sdkwork_voice_contract::VoiceServiceError;
use sdkwork_voice_service::{
    VoiceArtifactDriveSyncProcessorPort, VoiceArtifactDriveSyncRecord,
    VoiceArtifactDriveSyncUploadUpdate, VoiceRuntimePorts, VoiceTaskRecord,
};
use serde_json::json;
use sqlx::PgPool;

pub struct VoiceDriveSyncProcessor {
    http_client: reqwest::Client,
    drive_pool: PgPool,
    object_store_root: PathBuf,
    object_store_bucket: String,
    object_store_provider: String,
}

impl VoiceDriveSyncProcessor {
    pub async fn try_from_pool(
        database_pool: DatabasePool,
        drive_pool: PgPool,
    ) -> Result<Option<Self>, String> {
        if !drive_sync_enabled_from_env() {
            return Ok(None);
        }

        if database_pool.as_postgres().is_none() {
            return Err(
                "voice drive sync authoritative persistence requires PostgreSQL".to_string(),
            );
        }
        let _host = bootstrap_drive_database(database_pool)
            .await
            .map_err(|error| error.to_string())?;
        let object_store_root = object_store_root_from_env();
        std::fs::create_dir_all(&object_store_root).map_err(|error| error.to_string())?;

        Ok(Some(Self {
            http_client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(120))
                .build()
                .map_err(|error| error.to_string())?,
            drive_pool,
            object_store_root,
            object_store_bucket: std::env::var("VOICE_DRIVE_OBJECT_STORE_BUCKET")
                .unwrap_or_else(|_| "voice-generated".to_owned()),
            object_store_provider: std::env::var("VOICE_DRIVE_OBJECT_STORE_PROVIDER")
                .unwrap_or_else(|_| "voice-local".to_owned()),
        }))
    }

    pub fn into_arc(self) -> Arc<Self> {
        Arc::new(self)
    }
}

#[async_trait]
impl VoiceArtifactDriveSyncProcessorPort for VoiceDriveSyncProcessor {
    async fn process_sync(
        &self,
        sync_id: i64,
        ports: &VoiceRuntimePorts<'_>,
    ) -> Result<VoiceArtifactDriveSyncRecord, VoiceServiceError> {
        let sync = ports
            .repository
            .get_artifact_drive_sync_by_id(sync_id)
            .await?
            .ok_or_else(|| VoiceServiceError::not_found("artifact drive sync not found"))?;
        let source_uri = sync
            .source_uri
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .ok_or_else(|| {
                VoiceServiceError::invalid_state(
                    "artifact drive sync is missing source_uri and cannot be processed",
                )
            })?;

        let artifact = ports
            .repository
            .get_audio_artifact_by_id(sync.tenant_id, sync.artifact_id)
            .await?
            .ok_or_else(|| VoiceServiceError::not_found("audio artifact not found"))?;
        let task = ports
            .repository
            .get_task_by_id(0, sync.task_id)
            .await?
            .ok_or_else(|| VoiceServiceError::not_found("voice task not found"))?;

        let planned_space_id = format!("space-ai-generated-{}", actor_space_suffix(&task));
        ports
            .repository
            .mark_artifact_drive_sync_uploading(sync_id, &planned_space_id)
            .await?;

        let bytes = fetch_source_bytes(&self.http_client, source_uri).await?;
        let content_type = artifact
            .mime_type
            .clone()
            .unwrap_or_else(|| "application/octet-stream".to_owned());
        let file_name = artifact
            .format
            .as_ref()
            .map(|format| format!("artifact-{sync_id}.{format}"))
            .unwrap_or_else(|| format!("artifact-{sync_id}.bin"));

        let persister = DriveWorkspaceVoiceBytesPersister::new(
            DriveSpaceService::new(SqlSpaceStore::new(self.drive_pool.clone())),
            DriveWorkspaceService::new(SqlDriveWorkspaceStore::new(self.drive_pool.clone())),
            LocalDriveObjectStore::new(&self.object_store_root),
            &self.object_store_bucket,
            &self.object_store_provider,
        );

        let batch = VoiceGeneratedArtifactBytesBatch {
            tenant_id: sync.tenant_id.to_string(),
            organization_id: if sync.organization_id == 0 {
                None
            } else {
                Some(sync.organization_id.to_string())
            },
            task_id: sync.task_id.to_string(),
            actor: actor_from_task(&task),
            provider_code: artifact
                .provider_code
                .clone()
                .unwrap_or_else(|| task.provider_code.clone()),
            model: task.model.clone(),
            artifacts: vec![VoiceGeneratedArtifactBytes {
                artifact: VoiceGeneratedArtifact {
                    artifact_id: sync.artifact_id.to_string(),
                    provider_asset_id: None,
                    kind: map_artifact_kind(&artifact.kind),
                    file_name,
                    content_type: content_type.clone(),
                    content_length: i64::try_from(bytes.len()).map_err(|_| {
                        VoiceServiceError::validation(
                            "generated artifact bytes length exceeds supported range",
                        )
                    })?,
                    checksum_sha256_hex: Some(format!("sha256:{}", sha256_hash(&bytes))),
                    source_uri: source_uri.to_owned(),
                },
                bytes,
            }],
            now_epoch_ms: now().timestamp_millis(),
        };

        let stored = persister.persist(batch).await.map_err(map_drive_error)?;
        let uploaded = stored
            .stored
            .first()
            .ok_or_else(|| VoiceServiceError::storage("drive sync produced no stored artifact"))?;

        let drive_resource = json!({
            "kind": artifact.kind,
            "source": "drive",
            "driveSpaceId": uploaded.drive_space_id,
            "driveNodeId": uploaded.drive_node_id,
            "mimeType": content_type,
            "uri": format!(
                "drive://spaces/{}/nodes/{}",
                uploaded.drive_space_id, uploaded.drive_node_id
            ),
        });
        let uploaded_at = format_datetime(now(), None);
        ports
            .repository
            .update_audio_artifact_media_resource(sync.artifact_id, &drive_resource.to_string())
            .await?;

        ports
            .repository
            .mark_artifact_drive_sync_uploaded(VoiceArtifactDriveSyncUploadUpdate {
                sync_id,
                drive_space_id: uploaded.drive_space_id.clone(),
                drive_node_id: uploaded.drive_node_id.clone(),
                drive_upload_item_id: None,
                drive_upload_session_id: None,
                drive_resource_json: Some(drive_resource.to_string()),
                uploaded_at,
            })
            .await
    }
}

fn drive_sync_enabled_from_env() -> bool {
    matches!(
        std::env::var("VOICE_DRIVE_SYNC_ENABLED")
            .unwrap_or_else(|_| "true".to_owned())
            .trim()
            .to_ascii_lowercase()
            .as_str(),
        "1" | "true" | "yes" | "on"
    )
}

fn object_store_root_from_env() -> PathBuf {
    std::env::var("VOICE_DRIVE_OBJECT_STORE_ROOT")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from(".data/voice-drive-objects"))
}

fn actor_from_task(task: &VoiceTaskRecord) -> GeneratedArtifactActor {
    if task.user_id > 0 {
        GeneratedArtifactActor::User {
            user_id: task.user_id.to_string(),
        }
    } else {
        GeneratedArtifactActor::Anonymous {
            anonymous_id: format!("tenant-{}", task.tenant_id),
        }
    }
}

fn actor_space_suffix(task: &VoiceTaskRecord) -> String {
    if task.user_id > 0 {
        format!("user-{}", task.user_id)
    } else {
        format!("tenant-{}", task.tenant_id)
    }
}

fn map_artifact_kind(kind: &str) -> VoiceGeneratedArtifactKind {
    match kind {
        "image" => VoiceGeneratedArtifactKind::Image,
        "video" => VoiceGeneratedArtifactKind::Video,
        "music" => VoiceGeneratedArtifactKind::Music,
        "sound_effect" => VoiceGeneratedArtifactKind::SoundEffect,
        "transcript" => VoiceGeneratedArtifactKind::Transcript,
        "translation" => VoiceGeneratedArtifactKind::Translation,
        _ => VoiceGeneratedArtifactKind::Audio,
    }
}

async fn fetch_source_bytes(
    client: &reqwest::Client,
    source_uri: &str,
) -> Result<Vec<u8>, VoiceServiceError> {
    if let Some(payload) = source_uri.strip_prefix("data:") {
        return decode_data_url(payload);
    }

    if source_uri.starts_with("http://") || source_uri.starts_with("https://") {
        validate_fetch_url(source_uri)?;
        let response = client.get(source_uri).send().await.map_err(|error| {
            VoiceServiceError::transport(format!("source fetch failed: {error}"))
        })?;
        if !response.status().is_success() {
            return Err(VoiceServiceError::transport(format!(
                "source fetch returned HTTP {}",
                response.status()
            )));
        }
        let content_length = response.content_length().unwrap_or(0);
        const MAX_SOURCE_BYTES: u64 = 100 * 1024 * 1024;
        if content_length > MAX_SOURCE_BYTES {
            return Err(VoiceServiceError::validation(format!(
                "source payload exceeds {MAX_SOURCE_BYTES} bytes"
            )));
        }
        let bytes = response.bytes().await.map_err(|error| {
            VoiceServiceError::transport(format!("source read failed: {error}"))
        })?;
        if bytes.len() as u64 > MAX_SOURCE_BYTES {
            return Err(VoiceServiceError::validation(format!(
                "source payload exceeds {MAX_SOURCE_BYTES} bytes"
            )));
        }
        return Ok(bytes.to_vec());
    }

    Err(VoiceServiceError::invalid_state(format!(
        "unsupported artifact source_uri scheme: {source_uri}"
    )))
}

fn validate_fetch_url(source_uri: &str) -> Result<(), VoiceServiceError> {
    let parsed = reqwest::Url::parse(source_uri)
        .map_err(|error| VoiceServiceError::validation(format!("invalid source_uri: {error}")))?;
    let host = parsed
        .host_str()
        .ok_or_else(|| VoiceServiceError::validation("source_uri host is required"))?;
    if host.eq_ignore_ascii_case("localhost") {
        return Ok(());
    }
    if let Ok(address) = host.parse::<std::net::IpAddr>() {
        if is_private_or_loopback_ip(address) {
            return Err(VoiceServiceError::validation(
                "source_uri must not target private or loopback addresses",
            ));
        }
    }
    Ok(())
}

fn is_private_or_loopback_ip(address: std::net::IpAddr) -> bool {
    match address {
        std::net::IpAddr::V4(ipv4) => {
            ipv4.is_private()
                || ipv4.is_loopback()
                || ipv4.is_link_local()
                || ipv4.is_unspecified()
                || ipv4.octets()[0] == 127
        }
        std::net::IpAddr::V6(ipv6) => ipv6.is_loopback() || ipv6.is_unspecified(),
    }
}

fn decode_data_url(payload: &str) -> Result<Vec<u8>, VoiceServiceError> {
    let (_, encoded) = payload
        .split_once(',')
        .ok_or_else(|| VoiceServiceError::validation("invalid data URL payload"))?;
    use base64::Engine;
    base64::engine::general_purpose::STANDARD
        .decode(encoded)
        .map_err(|error| {
            VoiceServiceError::validation(format!("invalid data URL encoding: {error}"))
        })
}

fn map_drive_error(
    error: sdkwork_voice_artifact_drive_service::VoiceDrivePersistenceError,
) -> VoiceServiceError {
    VoiceServiceError::storage(error.to_string())
}
