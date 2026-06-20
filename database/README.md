# VOICE Database Module

Canonical lifecycle assets for `sdkwork-voice` per `DATABASE_FRAMEWORK_SPEC.md`.

## Commands

```bash
pnpm run db:materialize:contract
pnpm run db:validate
```

Legacy SQL: `crates/sdkwork-voice-generation-repository-sqlx/migrations/0001_voice_core.sql` → `database/ddl/baseline/postgres/0001_voice_legacy_baseline.sql`

Runtime bootstrap: `sdkwork-voice-database-host` / `connect_and_bootstrap_voice_database_from_env()`.
