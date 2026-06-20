//! SDKWork Voice database pool bootstrap via `sdkwork-database`.

use sdkwork_database_config::{DatabaseConfig, DatabaseEngine};
use sdkwork_database_sqlx::{create_pool_from_config, DatabasePool, PoolError};

pub use sdkwork_voice_database_host::{
    bootstrap_voice_database, bootstrap_voice_database_from_env, VoiceDatabaseHost,
};

pub type VoiceDatabasePool = DatabasePool;

pub async fn connect_voice_database_pool_from_env() -> Result<VoiceDatabasePool, PoolError> {
    let config = DatabaseConfig::from_env("VOICE")?;
    create_pool_from_config(config).await
}

pub async fn connect_voice_database_pool_from_url(
    database_url: &str,
) -> Result<VoiceDatabasePool, PoolError> {
    let normalized = database_url.trim();
    let engine = DatabaseEngine::from_url(normalized).ok_or_else(|| {
        PoolError::InvalidUrl(format!("unsupported voice database url: {normalized}"))
    })?;
    create_pool_from_config(DatabaseConfig {
        engine,
        url: normalized.to_string(),
        max_connections: 5,
        ..DatabaseConfig::default()
    })
    .await
}

pub async fn connect_and_bootstrap_voice_database_from_env() -> Result<VoiceDatabaseHost, String> {
    let pool = connect_voice_database_pool_from_env()
        .await
        .map_err(|error| error.to_string())?;
    bootstrap_voice_database(pool).await
}

pub async fn connect_and_bootstrap_voice_database_from_url(
    database_url: &str,
) -> Result<VoiceDatabaseHost, String> {
    let pool = connect_voice_database_pool_from_url(database_url)
        .await
        .map_err(|error| error.to_string())?;
    bootstrap_voice_database(pool).await
}
