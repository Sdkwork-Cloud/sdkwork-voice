CREATE TABLE IF NOT EXISTS voice_provider_route (
  id BIGINT PRIMARY KEY,
  route_key VARCHAR(128) NOT NULL,
  route_name VARCHAR(128) NOT NULL,
  provider_id VARCHAR(64) NOT NULL,
  client_protocol VARCHAR(64) NOT NULL,
  upstream_protocol VARCHAR(64) NOT NULL,
  upstream_config_json TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  managed_by VARCHAR(32) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  version BIGINT NOT NULL DEFAULT 0,
  CONSTRAINT uk_voice_provider_route_key UNIQUE (route_key)
);

CREATE TABLE IF NOT EXISTS voice_provider_route_capability (
  id BIGINT PRIMARY KEY,
  route_id BIGINT NOT NULL,
  capability VARCHAR(64) NOT NULL,
  operation_set_json TEXT NOT NULL,
  streaming BOOLEAN NOT NULL DEFAULT FALSE,
  timeout_ms BIGINT,
  request_policy_ref VARCHAR(128),
  response_policy_ref VARCHAR(128),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  version BIGINT NOT NULL DEFAULT 0,
  CONSTRAINT uk_voice_route_capability UNIQUE (route_id, capability)
);

CREATE TABLE IF NOT EXISTS voice_audio_artifact (
  id BIGINT PRIMARY KEY,
  artifact_no VARCHAR(64) NOT NULL,
  request_id VARCHAR(64),
  kind VARCHAR(32) NOT NULL,
  title VARCHAR(256),
  voice_id VARCHAR(128),
  format VARCHAR(32),
  duration_seconds INTEGER,
  media_resource_json TEXT NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  version BIGINT NOT NULL DEFAULT 0,
  CONSTRAINT uk_voice_audio_artifact_no UNIQUE (artifact_no)
);

CREATE TABLE IF NOT EXISTS voice_request_log (
  id BIGINT PRIMARY KEY,
  request_id VARCHAR(64) NOT NULL,
  trace_id VARCHAR(64) NOT NULL,
  route_id BIGINT,
  capability VARCHAR(64) NOT NULL,
  operation_id VARCHAR(128) NOT NULL,
  consumer VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL,
  latency_ms BIGINT,
  duration_ms BIGINT,
  audio_bytes BIGINT,
  request_preview TEXT,
  response_preview TEXT,
  error_summary TEXT,
  created_at TIMESTAMP NOT NULL,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  version BIGINT NOT NULL DEFAULT 0,
  CONSTRAINT uk_voice_request_log_request_id UNIQUE (request_id)
);

CREATE INDEX IF NOT EXISTS idx_voice_provider_route_provider ON voice_provider_route (provider_id, enabled);
CREATE INDEX IF NOT EXISTS idx_voice_route_capability_route ON voice_provider_route_capability (route_id, capability);
CREATE INDEX IF NOT EXISTS idx_voice_audio_artifact_request ON voice_audio_artifact (request_id);
CREATE INDEX IF NOT EXISTS idx_voice_audio_artifact_voice ON voice_audio_artifact (voice_id, status);
CREATE INDEX IF NOT EXISTS idx_voice_request_log_route_created ON voice_request_log (route_id, created_at);
CREATE INDEX IF NOT EXISTS idx_voice_request_log_capability_created ON voice_request_log (capability, created_at);
