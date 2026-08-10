-- sdkwork:migration
-- id: 0001_organization_id_not_null
-- engine: postgres
-- module: sdkwork-voice
-- purpose: Enforce organization_id NOT NULL DEFAULT on all tables in the
--   consolidated baseline. NULL rows (pre-standard data anomalies) are
--   backfilled with the platform sentinel before NOT NULL is set, and
--   NOT NULL columns without an explicit default receive the sentinel
--   default, keeping existing deployments consistent with fresh baseline
--   installs.
-- reversible: false
-- rollback: forward-fix (sentinel backfill is the canonical fix; NULL
--   organization rows are data anomalies)
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 30s

BEGIN;

ALTER TABLE voice_generation_task ADD COLUMN IF NOT EXISTS organization_id BIGINT NOT NULL DEFAULT 0;
UPDATE voice_generation_task SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE voice_generation_task ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE voice_generation_task ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE voice_artifact_drive_sync ADD COLUMN IF NOT EXISTS organization_id BIGINT NOT NULL DEFAULT 0;
UPDATE voice_artifact_drive_sync SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE voice_artifact_drive_sync ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE voice_artifact_drive_sync ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE voice_profile ADD COLUMN IF NOT EXISTS organization_id BIGINT NOT NULL DEFAULT 0;
UPDATE voice_profile SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE voice_profile ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE voice_profile ALTER COLUMN organization_id SET NOT NULL;

COMMIT;
