pub const VOICE_STORAGE_SCHEMA_VERSION: &str = "2026-06-06";
pub const VOICE_INITIAL_MIGRATION: &str = "0001_voice_core.sql";

const VOICE_INITIAL_MIGRATION_SQL: &str = include_str!("../migrations/0001_voice_core.sql");

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
