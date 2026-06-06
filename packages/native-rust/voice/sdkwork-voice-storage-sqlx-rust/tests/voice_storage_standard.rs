use sdkwork_voice_storage_sqlx::{
    voice_artifact_sync_tables, voice_artifact_tables, voice_database_tables,
    voice_initial_migration_sql, voice_request_tables, voice_route_tables,
    voice_storage_capability_manifest, voice_task_tables, voice_webhook_tables,
    NewVoiceArtifactDriveSync, SqlVoiceArtifactDriveSyncRepository, VoiceArtifactDriveSyncStatus,
};

#[test]
fn exposes_voice_database_table_catalog() {
    let tables = voice_database_tables();
    assert_eq!(
        tables,
        vec![
            "voice_provider_route",
            "voice_provider_route_capability",
            "voice_generation_task",
            "voice_task_event",
            "voice_audio_artifact",
            "voice_artifact_drive_sync",
            "voice_provider_webhook_event",
            "voice_webhook_delivery",
            "voice_request_log",
        ]
    );

    for table in tables {
        assert!(
            table.starts_with("voice_"),
            "voice storage must only expose voice-prefixed tables: {table}"
        );
        assert!(
            !table.starts_with("lap_")
                && !table.starts_with("studio_")
                && !table.starts_with("iam_"),
            "voice storage must not keep appbase/local-api-proxy table prefixes: {table}"
        );
    }
}

#[test]
fn migration_contains_voice_route_artifact_and_log_tables() {
    let sql = voice_initial_migration_sql();

    for expected in [
        "CREATE TABLE IF NOT EXISTS voice_provider_route",
        "CREATE TABLE IF NOT EXISTS voice_provider_route_capability",
        "CREATE TABLE IF NOT EXISTS voice_generation_task",
        "CREATE TABLE IF NOT EXISTS voice_task_event",
        "CREATE TABLE IF NOT EXISTS voice_audio_artifact",
        "CREATE TABLE IF NOT EXISTS voice_artifact_drive_sync",
        "CREATE TABLE IF NOT EXISTS voice_provider_webhook_event",
        "CREATE TABLE IF NOT EXISTS voice_webhook_delivery",
        "CREATE TABLE IF NOT EXISTS voice_request_log",
        "operation_type VARCHAR(32) NOT NULL",
        "provider_task_id VARCHAR(128)",
        "CONSTRAINT uk_voice_task_idempotency UNIQUE",
        "CONSTRAINT uk_voice_task_provider_task UNIQUE",
        "CONSTRAINT uk_voice_provider_webhook_event UNIQUE",
        "media_resource_json TEXT NOT NULL",
        "resource_snapshot_json TEXT",
        "CREATE INDEX IF NOT EXISTS idx_voice_request_log_capability_created",
        "CREATE INDEX IF NOT EXISTS idx_voice_generation_task_status",
        "CREATE INDEX IF NOT EXISTS idx_voice_task_event_task",
        "CREATE INDEX IF NOT EXISTS idx_voice_artifact_drive_sync_status",
        "CREATE INDEX IF NOT EXISTS idx_voice_artifact_drive_sync_task",
        "CREATE INDEX IF NOT EXISTS idx_voice_provider_webhook_event_status",
        "CREATE INDEX IF NOT EXISTS idx_voice_webhook_delivery_due",
    ] {
        assert!(
            sql.contains(expected),
            "voice migration must contain `{expected}`"
        );
    }
}

#[test]
fn manifest_maps_repositories_to_voice_tables() {
    let manifest = voice_storage_capability_manifest();

    assert_eq!(manifest.name, "voice-storage");
    assert_eq!(manifest.route_tables, voice_route_tables());
    assert_eq!(manifest.task_tables, voice_task_tables());
    assert_eq!(manifest.artifact_tables, voice_artifact_tables());
    assert_eq!(manifest.artifact_sync_tables, voice_artifact_sync_tables());
    assert_eq!(manifest.webhook_tables, voice_webhook_tables());
    assert_eq!(manifest.request_tables, voice_request_tables());
    assert_eq!(manifest.migrations, vec!["0001_voice_core.sql"]);
    assert!(manifest
        .repository_bindings
        .iter()
        .any(|binding| binding.repository_name == "VoiceProviderRouteRepository"));
    assert!(manifest
        .repository_bindings
        .iter()
        .any(|binding| binding.repository_name == "VoiceAudioArtifactRepository"));
    assert!(manifest
        .repository_bindings
        .iter()
        .any(|binding| binding.repository_name == "VoiceArtifactDriveSyncRepository"));
    assert!(manifest
        .repository_bindings
        .iter()
        .any(|binding| binding.repository_name == "VoiceGenerationTaskRepository"));
    assert!(manifest
        .repository_bindings
        .iter()
        .any(|binding| binding.repository_name == "VoiceTaskEventRepository"));
    assert!(manifest
        .repository_bindings
        .iter()
        .any(|binding| binding.repository_name == "VoiceProviderWebhookEventRepository"));
    assert!(manifest
        .repository_bindings
        .iter()
        .any(|binding| binding.repository_name == "VoiceWebhookDeliveryRepository"));
    assert!(manifest
        .repository_bindings
        .iter()
        .any(|binding| binding.repository_name == "VoiceRequestLogRepository"));
}

#[test]
fn artifact_drive_sync_table_tracks_ai_generation_upload_consistency() {
    let sql = voice_initial_migration_sql();

    for expected in [
        "sync_no VARCHAR(64) NOT NULL",
        "artifact_index INTEGER NOT NULL DEFAULT 0",
        "actor_type VARCHAR(32) NOT NULL",
        "anonymous_id VARCHAR(128)",
        "drive_space_type VARCHAR(32) NOT NULL",
        "drive_space_id VARCHAR(128)",
        "drive_node_id VARCHAR(128)",
        "drive_upload_item_id VARCHAR(128)",
        "drive_upload_session_id VARCHAR(128)",
        "drive_resource_json TEXT",
        "sync_status VARCHAR(32) NOT NULL",
        "CONSTRAINT uk_voice_artifact_drive_sync_no UNIQUE",
        "CONSTRAINT uk_voice_artifact_drive_sync_task_index UNIQUE",
    ] {
        assert!(
            sql.contains(expected),
            "voice artifact drive sync migration must contain `{expected}`"
        );
    }
}

#[tokio::test]
async fn artifact_drive_sync_repository_tracks_pending_uploading_uploaded_and_failed_states() {
    let pool = create_voice_pool().await;
    seed_task_and_artifacts(&pool).await;
    let repository = SqlVoiceArtifactDriveSyncRepository::new(pool.clone());

    let first = repository
        .insert_pending(NewVoiceArtifactDriveSync {
            id: 1,
            sync_no: "voice-drive-sync-task-1-0000".to_string(),
            task_id: 10,
            artifact_id: 101,
            tenant_id: 200,
            organization_id: 300,
            user_id: 400,
            anonymous_id: None,
            actor_type: "user".to_string(),
            provider_code: Some("openai".to_string()),
            provider_asset_id: Some("asset-a".to_string()),
            artifact_index: 0,
            source_uri: Some("provider://openai/speech/0000".to_string()),
            source_hash: Some("sha256:source-a".to_string()),
            drive_space_type: "ai_generated".to_string(),
            scheduled_at: "2026-06-06T08:00:00Z".to_string(),
            created_at: "2026-06-06T08:00:00Z".to_string(),
        })
        .await
        .expect("pending drive sync should insert");
    let second = repository
        .insert_pending(NewVoiceArtifactDriveSync {
            id: 2,
            sync_no: "voice-drive-sync-task-1-0001".to_string(),
            task_id: 10,
            artifact_id: 102,
            tenant_id: 200,
            organization_id: 300,
            user_id: 400,
            anonymous_id: None,
            actor_type: "user".to_string(),
            provider_code: Some("volcengine".to_string()),
            provider_asset_id: Some("asset-b".to_string()),
            artifact_index: 1,
            source_uri: Some("https://provider.example/video.mp4".to_string()),
            source_hash: None,
            drive_space_type: "ai_generated".to_string(),
            scheduled_at: "2026-06-06T08:00:01Z".to_string(),
            created_at: "2026-06-06T08:00:01Z".to_string(),
        })
        .await
        .expect("second pending drive sync should insert");

    assert_eq!(
        first.sync_status,
        VoiceArtifactDriveSyncStatus::PendingUpload
    );
    assert_eq!(second.artifact_index, 1);

    repository
        .mark_uploading(
            1,
            "space-ai-user-400",
            Some("upload-item-1"),
            Some("upload-session-1"),
            "2026-06-06T08:00:02Z",
        )
        .await
        .expect("sync row should move to uploading");
    repository
        .mark_uploaded(
            1,
            "space-ai-user-400",
            "drive-node-1",
            Some("upload-item-1"),
            Some("upload-session-1"),
            Some("{\"uri\":\"drive://spaces/space-ai-user-400/nodes/drive-node-1\"}"),
            "2026-06-06T08:00:03Z",
        )
        .await
        .expect("sync row should move to uploaded");
    repository
        .mark_failed(
            2,
            "PROVIDER_DOWNLOAD_FAILED",
            "provider URL expired",
            "2026-06-06T08:00:04Z",
        )
        .await
        .expect("sync row should move to failed");

    let rows = repository
        .list_by_task(10)
        .await
        .expect("sync rows should be queryable by task");
    assert_eq!(rows.len(), 2);
    assert_eq!(rows[0].artifact_index, 0);
    assert_eq!(rows[0].sync_status, VoiceArtifactDriveSyncStatus::Uploaded);
    assert_eq!(rows[0].drive_space_type, "ai_generated");
    assert_eq!(rows[0].drive_node_id.as_deref(), Some("drive-node-1"));
    assert_eq!(
        rows[0].drive_resource_json.as_deref(),
        Some("{\"uri\":\"drive://spaces/space-ai-user-400/nodes/drive-node-1\"}")
    );
    assert_eq!(rows[1].artifact_index, 1);
    assert_eq!(rows[1].sync_status, VoiceArtifactDriveSyncStatus::Failed);
    assert_eq!(
        rows[1].error_code.as_deref(),
        Some("PROVIDER_DOWNLOAD_FAILED")
    );
}

async fn create_voice_pool() -> sqlx::AnyPool {
    use sqlx::any::AnyPoolOptions;

    sqlx::any::install_default_drivers();
    let pool = AnyPoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite in-memory voice pool should be created");
    sqlx::raw_sql(voice_initial_migration_sql())
        .execute(&pool)
        .await
        .expect("voice schema should install");
    pool
}

async fn seed_task_and_artifacts(pool: &sqlx::AnyPool) {
    sqlx::query(
        "INSERT INTO voice_generation_task (
            id, task_no, tenant_id, organization_id, user_id, operation_type,
            provider_code, model, status, progress, request_json,
            created_at, updated_at
         ) VALUES (
            10, 'task-1', 200, 300, 400, 'speech',
            'openai', 'gpt-4o-mini-tts', 'succeeded', 100, '{}',
            '2026-06-06T08:00:00Z', '2026-06-06T08:00:00Z'
         )",
    )
    .execute(pool)
    .await
    .expect("voice task seed should insert");
    for (id, artifact_no, artifact_index) in [
        (101_i64, "artifact-a", 0_i64),
        (102_i64, "artifact-b", 1_i64),
    ] {
        sqlx::query(
            "INSERT INTO voice_audio_artifact (
                id, artifact_no, task_id, kind, provider_code, artifact_index,
                mime_type, media_resource_json, status, created_at, updated_at
             ) VALUES (
                $1, $2, 10, 'audio', 'openai', $3,
                'audio/mpeg', '{}', 'generated',
                '2026-06-06T08:00:00Z', '2026-06-06T08:00:00Z'
             )",
        )
        .bind(id)
        .bind(artifact_no)
        .bind(artifact_index)
        .execute(pool)
        .await
        .expect("voice artifact seed should insert");
    }
}
