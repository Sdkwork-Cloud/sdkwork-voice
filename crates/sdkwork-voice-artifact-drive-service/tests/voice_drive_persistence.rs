use sdkwork_drive_storage_local::LocalDriveObjectStore;
use sdkwork_drive_workspace_service::application::space_service::DriveSpaceService;
use sdkwork_drive_workspace_service::application::workspace_service::DriveWorkspaceService;
use sdkwork_drive_workspace_service::infrastructure::sql::space_store::SqlSpaceStore;
use sdkwork_drive_workspace_service::infrastructure::sql::uploader_store::SqlUploaderStore;
use sdkwork_drive_workspace_service::infrastructure::sql::workspace_store::SqlDriveWorkspaceStore;
use sdkwork_drive_workspace_service::uploader::{
    DriveUploaderService, UploaderActor, UploaderTarget,
};
use sdkwork_drive_workspace_service::DriveServiceError;
use sdkwork_voice_artifact_drive_service::{
    persist_voice_generated_artifacts_to_drive, plan_voice_drive_uploads,
    DriveWorkspaceVoiceBytesPersister, DriveWorkspaceVoiceUploadExecutor, GeneratedArtifactActor,
    VoiceDriveUploadExecutor, VoiceGeneratedArtifact, VoiceGeneratedArtifactBatch,
    VoiceGeneratedArtifactBytes, VoiceGeneratedArtifactBytesBatch, VoiceGeneratedArtifactKind,
    VOICE_DRIVE_AI_GENERATED_SPACE_TYPE,
};

#[test]
fn plans_ai_generated_artifacts_for_drive_ai_space_and_preserves_batch_order() {
    let batch = VoiceGeneratedArtifactBatch {
        tenant_id: "tenant-ai".to_string(),
        organization_id: Some("org-ai".to_string()),
        task_id: "task-image-batch".to_string(),
        actor: GeneratedArtifactActor::User {
            user_id: "user-ai".to_string(),
        },
        provider_code: "volcengine".to_string(),
        model: Some("seedream".to_string()),
        artifacts: vec![
            VoiceGeneratedArtifact {
                artifact_id: "artifact-image-1".to_string(),
                provider_asset_id: Some("provider-image-1".to_string()),
                kind: VoiceGeneratedArtifactKind::Image,
                file_name: "image-1.png".to_string(),
                content_type: "image/png".to_string(),
                content_length: 128,
                checksum_sha256_hex: Some(format!("sha256:{}", "a".repeat(64))),
                source_uri: "provider://volcengine/image/1".to_string(),
            },
            VoiceGeneratedArtifact {
                artifact_id: "artifact-image-2".to_string(),
                provider_asset_id: Some("provider-image-2".to_string()),
                kind: VoiceGeneratedArtifactKind::Image,
                file_name: "image-2.png".to_string(),
                content_type: "image/png".to_string(),
                content_length: 256,
                checksum_sha256_hex: Some(format!("sha256:{}", "b".repeat(64))),
                source_uri: "provider://volcengine/image/2".to_string(),
            },
        ],
        now_epoch_ms: 1_800_000_000_000,
    };

    let plan = plan_voice_drive_uploads(batch).expect("batch should produce a drive upload plan");

    assert_eq!(plan.drive_space_type, VOICE_DRIVE_AI_GENERATED_SPACE_TYPE);
    assert_eq!(plan.uploads.len(), 2);
    assert_eq!(plan.uploads[0].artifact_index, 0);
    assert_eq!(plan.uploads[1].artifact_index, 1);
    assert_eq!(plan.uploads[0].sync_status, "pending_upload");
    assert_eq!(plan.uploads[0].command.upload_profile_code, "image");
    assert_eq!(plan.uploads[0].command.app_id, "sdkwork-voice");
    assert_eq!(
        plan.uploads[0].command.app_resource_type,
        "voice_generation_task"
    );
    assert_eq!(plan.uploads[0].command.app_resource_id, "task-image-batch");
    assert_eq!(
        plan.uploads[0].command.scene.as_deref(),
        Some("ai_generated")
    );
    assert_eq!(
        plan.uploads[0].command.source.as_deref(),
        Some("provider:volcengine")
    );
    assert!(matches!(
        plan.uploads[0].command.actor,
        UploaderActor::User { .. }
    ));
    assert!(matches!(
        plan.uploads[0].command.target,
        UploaderTarget::Space { ref space_id, .. } if space_id == "space-ai-generated-user-user-ai"
    ));
}

#[test]
fn supports_anonymous_generated_audio_uploads_into_app_owned_ai_space() {
    let batch = VoiceGeneratedArtifactBatch {
        tenant_id: "tenant-anon".to_string(),
        organization_id: None,
        task_id: "task-sfx".to_string(),
        actor: GeneratedArtifactActor::Anonymous {
            anonymous_id: "anon-session-001".to_string(),
        },
        provider_code: "elevenlabs".to_string(),
        model: Some("eleven_text_to_sound_v2".to_string()),
        artifacts: vec![VoiceGeneratedArtifact {
            artifact_id: "artifact-sfx".to_string(),
            provider_asset_id: None,
            kind: VoiceGeneratedArtifactKind::SoundEffect,
            file_name: "effect.wav".to_string(),
            content_type: "audio/wav".to_string(),
            content_length: 64,
            checksum_sha256_hex: None,
            source_uri: "https://provider.example/effect.wav".to_string(),
        }],
        now_epoch_ms: 1_800_000_000_000,
    };

    let plan = plan_voice_drive_uploads(batch).expect("anonymous upload should be supported");

    assert_eq!(plan.uploads.len(), 1);
    assert_eq!(plan.uploads[0].actor_type, "anonymous");
    assert_eq!(
        plan.uploads[0].anonymous_id.as_deref(),
        Some("anon-session-001")
    );
    assert_eq!(plan.uploads[0].command.upload_profile_code, "audio");
    assert!(matches!(
        plan.uploads[0].command.actor,
        UploaderActor::Anonymous { ref anonymous_id } if anonymous_id == "anon-session-001"
    ));
    assert!(matches!(
        plan.uploads[0].command.target,
        UploaderTarget::Space { ref space_id, .. } if space_id == "space-ai-generated-app-sdkwork-voice-anonymous"
    ));
}

#[test]
fn maps_video_and_music_to_drive_media_profiles() {
    let batch = VoiceGeneratedArtifactBatch {
        tenant_id: "tenant-media".to_string(),
        organization_id: None,
        task_id: "task-media".to_string(),
        actor: GeneratedArtifactActor::System {
            operator_id: "voice-worker".to_string(),
        },
        provider_code: "suno".to_string(),
        model: Some("suno-v5".to_string()),
        artifacts: vec![
            VoiceGeneratedArtifact {
                artifact_id: "artifact-video".to_string(),
                provider_asset_id: None,
                kind: VoiceGeneratedArtifactKind::Video,
                file_name: "clip.mp4".to_string(),
                content_type: "video/mp4".to_string(),
                content_length: 1024,
                checksum_sha256_hex: None,
                source_uri: "provider://video/clip".to_string(),
            },
            VoiceGeneratedArtifact {
                artifact_id: "artifact-music".to_string(),
                provider_asset_id: None,
                kind: VoiceGeneratedArtifactKind::Music,
                file_name: "song.mp3".to_string(),
                content_type: "audio/mpeg".to_string(),
                content_length: 2048,
                checksum_sha256_hex: None,
                source_uri: "provider://suno/song".to_string(),
            },
        ],
        now_epoch_ms: 1_800_000_000_000,
    };

    let plan = plan_voice_drive_uploads(batch).expect("mixed generated media should be planned");

    assert_eq!(plan.uploads[0].command.upload_profile_code, "video");
    assert_eq!(plan.uploads[1].command.upload_profile_code, "audio");
    assert_eq!(plan.uploads[1].logical_path, "task-media/0001-song.mp3");
}

#[tokio::test]
async fn executes_drive_upload_preparation_through_drive_uploader_service() {
    let batch = VoiceGeneratedArtifactBatch {
        tenant_id: "tenant-exec".to_string(),
        organization_id: Some("org-exec".to_string()),
        task_id: "task-exec".to_string(),
        actor: GeneratedArtifactActor::User {
            user_id: "user-exec".to_string(),
        },
        provider_code: "openai".to_string(),
        model: Some("gpt-4o-mini-tts".to_string()),
        artifacts: vec![VoiceGeneratedArtifact {
            artifact_id: "artifact-audio".to_string(),
            provider_asset_id: Some("provider-audio".to_string()),
            kind: VoiceGeneratedArtifactKind::Audio,
            file_name: "speech.mp3".to_string(),
            content_type: "audio/mpeg".to_string(),
            content_length: 512,
            checksum_sha256_hex: None,
            source_uri: "provider://openai/audio/1".to_string(),
        }],
        now_epoch_ms: 1_800_000_000_000,
    };
    let executor = InMemoryVoiceDriveUploadExecutor::default();

    let result = persist_voice_generated_artifacts_to_drive(batch, &executor)
        .await
        .expect("voice artifacts should be prepared through drive uploader");

    assert_eq!(result.uploaded.len(), 1);
    assert_eq!(result.uploaded[0].artifact_id, "artifact-audio");
    assert_eq!(
        result.uploaded[0].drive_space_type,
        VOICE_DRIVE_AI_GENERATED_SPACE_TYPE
    );
    assert_eq!(
        result.uploaded[0].drive_space_id,
        "space-ai-generated-user-user-exec"
    );
    assert_eq!(
        result.uploaded[0].drive_upload_item_id,
        "voice-drive-upload-task-exec-0000"
    );
    assert_eq!(executor.created_spaces.borrow().len(), 1);
    assert_eq!(executor.prepared_uploads.borrow().len(), 1);
}

#[tokio::test]
async fn sql_executor_creates_ai_generated_space_and_drive_upload_item() {
    let pool = create_drive_pool().await;
    let executor = DriveWorkspaceVoiceUploadExecutor::new(
        DriveUploaderService::new(SqlUploaderStore::new(pool.clone())),
        DriveSpaceService::new(SqlSpaceStore::new(pool.clone())),
    );
    let batch = VoiceGeneratedArtifactBatch {
        tenant_id: "tenant-sql".to_string(),
        organization_id: None,
        task_id: "task-sql".to_string(),
        actor: GeneratedArtifactActor::User {
            user_id: "user-sql".to_string(),
        },
        provider_code: "openai".to_string(),
        model: None,
        artifacts: vec![VoiceGeneratedArtifact {
            artifact_id: "artifact-sql".to_string(),
            provider_asset_id: None,
            kind: VoiceGeneratedArtifactKind::Audio,
            file_name: "speech.mp3".to_string(),
            content_type: "audio/mpeg".to_string(),
            content_length: 512,
            checksum_sha256_hex: None,
            source_uri: "provider://openai/audio/sql".to_string(),
        }],
        now_epoch_ms: 1_800_000_000_000,
    };

    let result = persist_voice_generated_artifacts_to_drive(batch, &executor)
        .await
        .expect("sql drive executor should persist upload facts");

    assert_eq!(
        result.uploaded[0].drive_space_id,
        "space-ai-generated-user-user-sql"
    );

    let space_type: String =
        sqlx::query_scalar("SELECT space_type FROM dr_drive_space WHERE id=?1")
            .bind("space-ai-generated-user-user-sql")
            .fetch_one(&pool)
            .await
            .expect("ai-generated space should exist");
    assert_eq!(space_type, "ai_generated");

    let upload: (String, String, String) = sqlx::query_as(
        "SELECT upload_profile_code, space_id, app_resource_type
         FROM dr_drive_upload_item
         WHERE id=?1",
    )
    .bind("voice-drive-upload-task-sql-0000")
    .fetch_one(&pool)
    .await
    .expect("drive upload item should exist");
    assert_eq!(
        upload,
        (
            "audio".to_string(),
            "space-ai-generated-user-user-sql".to_string(),
            "voice_generation_task".to_string()
        )
    );
}

#[tokio::test]
async fn bytes_persister_writes_multiple_generated_images_to_drive_storage_and_workspace() {
    let pool = create_drive_pool().await;
    let root = std::env::temp_dir().join(format!(
        "sdkwork-voice-drive-bytes-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("system clock should be after epoch")
            .as_nanos()
    ));
    let persister = DriveWorkspaceVoiceBytesPersister::new(
        DriveSpaceService::new(SqlSpaceStore::new(pool.clone())),
        DriveWorkspaceService::new(SqlDriveWorkspaceStore::new(pool.clone())),
        LocalDriveObjectStore::new(&root),
        "bucket-voice",
        "provider-voice",
    );
    let batch = VoiceGeneratedArtifactBytesBatch {
        tenant_id: "tenant-bytes".to_string(),
        organization_id: None,
        task_id: "task-bytes".to_string(),
        actor: GeneratedArtifactActor::Anonymous {
            anonymous_id: "anon-bytes".to_string(),
        },
        provider_code: "volcengine".to_string(),
        model: Some("image-model".to_string()),
        artifacts: vec![
            VoiceGeneratedArtifactBytes {
                artifact: VoiceGeneratedArtifact {
                    artifact_id: "artifact-image-a".to_string(),
                    provider_asset_id: Some("provider-image-a".to_string()),
                    kind: VoiceGeneratedArtifactKind::Image,
                    file_name: "image-a.png".to_string(),
                    content_type: "image/png".to_string(),
                    content_length: 4,
                    checksum_sha256_hex: None,
                    source_uri: "provider://volcengine/image/a".to_string(),
                },
                bytes: vec![1, 2, 3, 4],
            },
            VoiceGeneratedArtifactBytes {
                artifact: VoiceGeneratedArtifact {
                    artifact_id: "artifact-image-b".to_string(),
                    provider_asset_id: Some("provider-image-b".to_string()),
                    kind: VoiceGeneratedArtifactKind::Image,
                    file_name: "image-b.png".to_string(),
                    content_type: "image/png".to_string(),
                    content_length: 3,
                    checksum_sha256_hex: None,
                    source_uri: "provider://volcengine/image/b".to_string(),
                },
                bytes: vec![5, 6, 7],
            },
        ],
        now_epoch_ms: 1_800_000_000_000,
    };

    let result = persister
        .persist(batch)
        .await
        .expect("generated image bytes should persist to drive");

    assert_eq!(result.stored.len(), 2);
    assert_eq!(result.stored[0].sync_status, "uploaded");
    assert_eq!(result.stored[1].artifact_index, 1);

    for stored in &result.stored {
        let object_path = root.join(&stored.bucket).join(&stored.object_key);
        assert!(
            object_path.exists(),
            "drive object should exist: {object_path:?}"
        );
    }

    let space_type: String =
        sqlx::query_scalar("SELECT space_type FROM dr_drive_space WHERE id=?1")
            .bind("space-ai-generated-app-sdkwork-voice-anonymous")
            .fetch_one(&pool)
            .await
            .expect("ai generated anonymous space should be created");
    assert_eq!(space_type, "ai_generated");

    let object_count: i64 = sqlx::query_scalar("SELECT COUNT(1) FROM dr_drive_storage_object")
        .fetch_one(&pool)
        .await
        .expect("storage objects should be queryable");
    assert_eq!(object_count, 2);

    let _ = std::fs::remove_dir_all(root);
}

#[tokio::test]
async fn bytes_persister_uses_actual_bytes_for_drive_length_and_checksum() {
    let pool = create_drive_pool().await;
    let root = std::env::temp_dir().join(format!(
        "sdkwork-voice-drive-byte-metadata-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("system clock should be after epoch")
            .as_nanos()
    ));
    let persister = DriveWorkspaceVoiceBytesPersister::new(
        DriveSpaceService::new(SqlSpaceStore::new(pool.clone())),
        DriveWorkspaceService::new(SqlDriveWorkspaceStore::new(pool.clone())),
        LocalDriveObjectStore::new(&root),
        "bucket-voice",
        "provider-voice",
    );
    let batch = VoiceGeneratedArtifactBytesBatch {
        tenant_id: "tenant-byte-metadata".to_string(),
        organization_id: None,
        task_id: "task-byte-metadata".to_string(),
        actor: GeneratedArtifactActor::User {
            user_id: "user-byte-metadata".to_string(),
        },
        provider_code: "openai".to_string(),
        model: Some("audio-model".to_string()),
        artifacts: vec![VoiceGeneratedArtifactBytes {
            artifact: VoiceGeneratedArtifact {
                artifact_id: "artifact-audio-metadata".to_string(),
                provider_asset_id: None,
                kind: VoiceGeneratedArtifactKind::Audio,
                file_name: "speech.mp3".to_string(),
                content_type: "audio/mpeg".to_string(),
                content_length: 999,
                checksum_sha256_hex: None,
                source_uri: "provider://openai/audio/metadata".to_string(),
            },
            bytes: vec![9, 8, 7, 6],
        }],
        now_epoch_ms: 1_800_000_000_000,
    };

    let result = persister
        .persist(batch)
        .await
        .expect("generated bytes should persist with actual object metadata");

    assert_eq!(result.stored.len(), 1);
    assert_eq!(result.stored[0].content_length, 4);
    assert_eq!(
        result.stored[0].checksum_sha256_hex,
        "sha256:63d987d1c6d69751c17297f410f5b3547a65d096a8993b35bcb4f9cad054f176"
    );

    let stored_metadata: (i64, String) = sqlx::query_as(
        "SELECT content_length, checksum_sha256_hex
         FROM dr_drive_storage_object
         WHERE tenant_id=?1 AND node_id=?2",
    )
    .bind("tenant-byte-metadata")
    .bind(&result.stored[0].drive_node_id)
    .fetch_one(&pool)
    .await
    .expect("drive storage object metadata should be queryable");
    assert_eq!(
        stored_metadata,
        (
            4,
            "sha256:63d987d1c6d69751c17297f410f5b3547a65d096a8993b35bcb4f9cad054f176".to_string()
        )
    );

    let _ = std::fs::remove_dir_all(root);
}

#[tokio::test]
async fn bytes_persister_rejects_provider_checksum_mismatch() {
    let pool = create_drive_pool().await;
    let root = std::env::temp_dir().join(format!(
        "sdkwork-voice-drive-byte-checksum-mismatch-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("system clock should be after epoch")
            .as_nanos()
    ));
    let persister = DriveWorkspaceVoiceBytesPersister::new(
        DriveSpaceService::new(SqlSpaceStore::new(pool.clone())),
        DriveWorkspaceService::new(SqlDriveWorkspaceStore::new(pool.clone())),
        LocalDriveObjectStore::new(&root),
        "bucket-voice",
        "provider-voice",
    );
    let batch = VoiceGeneratedArtifactBytesBatch {
        tenant_id: "tenant-checksum-mismatch".to_string(),
        organization_id: None,
        task_id: "task-checksum-mismatch".to_string(),
        actor: GeneratedArtifactActor::System {
            operator_id: "voice-worker".to_string(),
        },
        provider_code: "openai".to_string(),
        model: Some("audio-model".to_string()),
        artifacts: vec![VoiceGeneratedArtifactBytes {
            artifact: VoiceGeneratedArtifact {
                artifact_id: "artifact-checksum-mismatch".to_string(),
                provider_asset_id: None,
                kind: VoiceGeneratedArtifactKind::Audio,
                file_name: "speech.mp3".to_string(),
                content_type: "audio/mpeg".to_string(),
                content_length: 4,
                checksum_sha256_hex: Some(format!("sha256:{}", "0".repeat(64))),
                source_uri: "provider://openai/audio/checksum-mismatch".to_string(),
            },
            bytes: vec![9, 8, 7, 6],
        }],
        now_epoch_ms: 1_800_000_000_000,
    };

    let error = persister
        .persist(batch)
        .await
        .expect_err("checksum mismatch must fail before writing drive metadata");
    let message = format!("{error}");
    assert!(
        message.contains("checksum_sha256_hex does not match generated bytes"),
        "unexpected error: {message}"
    );

    let object_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(1)
         FROM dr_drive_storage_object
         WHERE tenant_id='tenant-checksum-mismatch'",
    )
    .fetch_one(&pool)
    .await
    .expect("storage objects should be queryable");
    assert_eq!(object_count, 0);

    let _ = std::fs::remove_dir_all(root);
}

#[derive(Default)]
struct InMemoryVoiceDriveUploadExecutor {
    created_spaces: std::cell::RefCell<Vec<(String, String, String, String)>>,
    prepared_uploads: std::cell::RefCell<Vec<String>>,
}

async fn create_drive_pool() -> sqlx::AnyPool {
    use sdkwork_drive_config::DatabaseEngine;
    use sdkwork_drive_workspace_service::infrastructure::sql::install_any_schema;
    use sqlx::any::AnyPoolOptions;

    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory drive pool should be created");
    install_any_schema(&pool, DatabaseEngine::Sqlite)
        .await
        .expect("drive sqlite schema should be installed");
    seed_storage_provider(&pool).await;
    pool
}

async fn seed_storage_provider(pool: &sqlx::AnyPool) {
    sqlx::query(
        "INSERT INTO dr_drive_storage_provider (
            id, provider_kind, name, endpoint_url, region, bucket, path_style,
            strict_tls, credential_ref, server_side_encryption_mode,
            default_storage_class, status, version, created_by, updated_by
        ) VALUES (
            'provider-voice', 's3_compatible', 'Voice Provider',
            'https://s3.example.com', 'us-east-1', 'bucket-voice', 1,
            1, 'plain:test-access-key:test-secret-key', 'AES256',
            'STANDARD', 'active', 1, 'test', 'test'
        )",
    )
    .execute(pool)
    .await
    .expect("seed drive storage provider should succeed");
}

#[async_trait::async_trait(?Send)]
impl VoiceDriveUploadExecutor for InMemoryVoiceDriveUploadExecutor {
    async fn ensure_ai_generated_space(
        &self,
        tenant_id: &str,
        space_id: &str,
        owner_subject_type: &str,
        owner_subject_id: &str,
        _operator_id: &str,
    ) -> Result<String, DriveServiceError> {
        self.created_spaces.borrow_mut().push((
            tenant_id.to_string(),
            space_id.to_string(),
            owner_subject_type.to_string(),
            owner_subject_id.to_string(),
        ));
        Ok(space_id.to_string())
    }

    async fn prepare_upload(
        &self,
        command: sdkwork_drive_workspace_service::uploader::PrepareUploaderUploadCommand,
    ) -> Result<sdkwork_drive_workspace_service::uploader::DriveUploadItem, DriveServiceError> {
        self.prepared_uploads.borrow_mut().push(command.id.clone());
        Ok(sdkwork_drive_workspace_service::uploader::DriveUploadItem {
            id: command.id,
            task_id: command.task_id,
            tenant_id: command.tenant_id,
            organization_id: command.organization_id,
            user_id: match command.actor {
                UploaderActor::User { user_id } => Some(user_id),
                _ => None,
            },
            actor_type: "user".to_string(),
            actor_id: "user-exec".to_string(),
            app_id: command.app_id,
            app_resource_type: command.app_resource_type,
            app_resource_id: command.app_resource_id,
            scene: command.scene,
            source: command.source,
            upload_profile_code: command.upload_profile_code,
            file_fingerprint: command.file_fingerprint,
            space_id: match command.target {
                UploaderTarget::Space { space_id, .. } => space_id,
                UploaderTarget::AutoUploadSpace { .. } => "auto".to_string(),
                UploaderTarget::AiGeneratedSpace { .. } => "ai-generated".to_string(),
            },
            node_id: "drive-node-audio".to_string(),
            upload_session_id: Some("drive-session-audio".to_string()),
            storage_provider_id: Some("drive-provider".to_string()),
            storage_upload_id: Some("drive-session-audio".to_string()),
            object_bucket: None,
            object_key: None,
            original_file_name: command.original_file_name,
            file_extension: Some("mp3".to_string()),
            content_type: command.content_type,
            content_type_group: "audio".to_string(),
            detected_content_type: None,
            content_length: command.content_length,
            checksum_sha256_hex: None,
            chunk_size_bytes: command.chunk_size_bytes,
            total_parts: 1,
            uploaded_parts_count: 0,
            uploaded_bytes: 0,
            status: "prepared".to_string(),
            retention_mode: "long_term".to_string(),
            retention_expires_at_epoch_ms: None,
            cleanup_action: None,
            hard_delete_after_epoch_ms: None,
            cleanup_status: "active".to_string(),
            post_process_status: "not_required".to_string(),
        })
    }
}
