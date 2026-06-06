use sdkwork_voice_storage_sqlx::{
    voice_artifact_sync_tables, voice_artifact_tables, voice_database_tables,
    voice_initial_migration_sql, voice_request_tables, voice_route_tables,
    voice_storage_capability_manifest, voice_task_tables, voice_webhook_tables,
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
            !table.starts_with("lap_") && !table.starts_with("studio_") && !table.starts_with("iam_"),
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
        assert!(sql.contains(expected), "voice migration must contain `{expected}`");
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
