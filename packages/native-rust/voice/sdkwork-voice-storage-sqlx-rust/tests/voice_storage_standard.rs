use sdkwork_voice_storage_sqlx::{
    voice_artifact_tables, voice_database_tables, voice_initial_migration_sql, voice_request_tables,
    voice_route_tables, voice_storage_capability_manifest,
};

#[test]
fn exposes_voice_database_table_catalog() {
    let tables = voice_database_tables();
    assert_eq!(
        tables,
        vec![
            "voice_provider_route",
            "voice_provider_route_capability",
            "voice_audio_artifact",
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
        "CREATE TABLE IF NOT EXISTS voice_audio_artifact",
        "CREATE TABLE IF NOT EXISTS voice_request_log",
        "media_resource_json TEXT NOT NULL",
        "CREATE INDEX IF NOT EXISTS idx_voice_request_log_capability_created",
    ] {
        assert!(sql.contains(expected), "voice migration must contain `{expected}`");
    }
}

#[test]
fn manifest_maps_repositories_to_voice_tables() {
    let manifest = voice_storage_capability_manifest();

    assert_eq!(manifest.name, "voice-storage");
    assert_eq!(manifest.route_tables, voice_route_tables());
    assert_eq!(manifest.artifact_tables, voice_artifact_tables());
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
        .any(|binding| binding.repository_name == "VoiceRequestLogRepository"));
}
