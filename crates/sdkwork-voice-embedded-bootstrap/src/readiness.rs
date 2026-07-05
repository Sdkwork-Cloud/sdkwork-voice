use std::sync::Arc;

use sdkwork_database_sqlx::DatabasePool;
use sdkwork_web_bootstrap::{PgPoolReadinessCheck, ReadinessCheck, SqliteReadinessCheck};

/// Builds a `/readyz` probe that verifies the voice database pool is reachable.
pub fn voice_database_readiness_check(pool: &DatabasePool) -> Arc<dyn ReadinessCheck> {
    match pool {
        DatabasePool::Sqlite(sqlite_pool, _) => {
            Arc::new(SqliteReadinessCheck::new(sqlite_pool.clone()))
        }
        DatabasePool::Postgres(pg_pool, _) => Arc::new(PgPoolReadinessCheck::new(pg_pool.clone())),
    }
}
