use std::sync::Arc;

use sdkwork_database_sqlx::DatabasePool;
use sdkwork_web_bootstrap::{PgPoolReadinessCheck, ReadinessCheck};

/// Builds a `/readyz` probe that verifies the voice database pool is reachable.
pub fn voice_database_readiness_check(pool: &DatabasePool) -> Arc<dyn ReadinessCheck> {
    let postgres_pool = pool
        .as_postgres()
        .expect("voice runtime is configured for PostgreSQL")
        .clone();
    Arc::new(PgPoolReadinessCheck::new(postgres_pool))
}
