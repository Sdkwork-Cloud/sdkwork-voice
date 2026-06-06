import { VOICE_LOCAL_API_PROXY_DEFAULT_POSTGRES_SCHEMA } from "./types.ts";

type VoiceLocalApiProxySchemaDialect = "sqlite" | "postgresql";

interface VoiceLocalApiProxySchemaTableDefinition {
  columns: Array<{
    name: string;
    postgresql: string;
    sqlite: string;
  }>;
  constraints?: string[];
  indexes?: Array<{
    columns: string;
    name: string;
  }>;
  name: string;
}

function jsonColumn(sqliteColumn = "TEXT NOT NULL", postgresqlColumn = "JSONB NOT NULL") {
  return { sqlite: sqliteColumn, postgresql: postgresqlColumn };
}

const VOICE_LOCAL_API_PROXY_SCHEMA_TABLES: readonly VoiceLocalApiProxySchemaTableDefinition[] = [
  {
    name: "vlap_schema_migrations",
    columns: [
      { name: "version", sqlite: "TEXT PRIMARY KEY", postgresql: "TEXT PRIMARY KEY" },
      { name: "checksum", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "applied_at_ms", sqlite: "INTEGER NOT NULL", postgresql: "BIGINT NOT NULL" },
    ],
  },
  {
    name: "vlap_config",
    columns: [
      { name: "config_id", sqlite: "TEXT PRIMARY KEY", postgresql: "TEXT PRIMARY KEY" },
      { name: "schema_version", sqlite: "INTEGER NOT NULL", postgresql: "INTEGER NOT NULL" },
      { name: "mode", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "bind_host", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "bind_port", sqlite: "INTEGER NOT NULL", postgresql: "INTEGER NOT NULL" },
      { name: "public_base_url", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "storage_config", ...jsonColumn() },
      { name: "capture_config", ...jsonColumn() },
      { name: "defaults_config", ...jsonColumn() },
      { name: "policies_config", ...jsonColumn() },
      { name: "runtime_config", ...jsonColumn() },
      { name: "updated_at_ms", sqlite: "INTEGER NOT NULL", postgresql: "BIGINT NOT NULL" },
    ],
  },
  {
    name: "vlap_routes",
    columns: [
      { name: "route_id", sqlite: "TEXT PRIMARY KEY", postgresql: "TEXT PRIMARY KEY" },
      { name: "route_name", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "enabled", sqlite: "INTEGER NOT NULL", postgresql: "BOOLEAN NOT NULL" },
      { name: "managed_by", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "provider_id", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "client_protocol", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "upstream_protocol", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "upstream_config", ...jsonColumn() },
      { name: "tags_json", ...jsonColumn() },
      { name: "notes", sqlite: "TEXT", postgresql: "TEXT" },
      { name: "updated_at_ms", sqlite: "INTEGER NOT NULL", postgresql: "BIGINT NOT NULL" },
    ],
  },
  {
    name: "vlap_route_capabilities",
    columns: [
      { name: "route_id", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "capability", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "enabled", sqlite: "INTEGER NOT NULL", postgresql: "BOOLEAN NOT NULL" },
      { name: "operation_set", ...jsonColumn() },
      { name: "streaming", sqlite: "INTEGER NOT NULL", postgresql: "BOOLEAN NOT NULL" },
      { name: "timeout_ms", sqlite: "INTEGER", postgresql: "BIGINT" },
      { name: "path_override", sqlite: "TEXT", postgresql: "TEXT" },
      { name: "method_override", sqlite: "TEXT", postgresql: "TEXT" },
      { name: "request_policy_ref", sqlite: "TEXT", postgresql: "TEXT" },
      { name: "response_policy_ref", sqlite: "TEXT", postgresql: "TEXT" },
    ],
    constraints: ["PRIMARY KEY (route_id, capability)"],
  },
  {
    name: "vlap_request_logs",
    columns: [
      { name: "request_id", sqlite: "TEXT PRIMARY KEY", postgresql: "TEXT PRIMARY KEY" },
      { name: "trace_id", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "route_id", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "capability", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "operation_id", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "consumer", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "status", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "latency_ms", sqlite: "INTEGER", postgresql: "BIGINT" },
      { name: "duration_ms", sqlite: "INTEGER", postgresql: "BIGINT" },
      { name: "audio_bytes", sqlite: "INTEGER", postgresql: "BIGINT" },
      { name: "request_preview", sqlite: "TEXT", postgresql: "TEXT" },
      { name: "response_preview", sqlite: "TEXT", postgresql: "TEXT" },
      { name: "error_summary", sqlite: "TEXT", postgresql: "TEXT" },
      { name: "created_at_ms", sqlite: "INTEGER NOT NULL", postgresql: "BIGINT NOT NULL" },
    ],
    indexes: [{ name: "idx_vlap_request_logs_route_created_at", columns: "route_id, created_at_ms DESC" }],
  },
  {
    name: "vlap_generation_tasks",
    columns: [
      { name: "task_id", sqlite: "TEXT PRIMARY KEY", postgresql: "TEXT PRIMARY KEY" },
      { name: "operation_type", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "provider_id", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "route_id", sqlite: "TEXT", postgresql: "TEXT" },
      { name: "model_id", sqlite: "TEXT", postgresql: "TEXT" },
      { name: "provider_task_id", sqlite: "TEXT", postgresql: "TEXT" },
      { name: "idempotency_key", sqlite: "TEXT", postgresql: "TEXT" },
      { name: "status", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "progress", sqlite: "INTEGER NOT NULL", postgresql: "INTEGER NOT NULL" },
      { name: "request_json", ...jsonColumn() },
      { name: "provider_request_json", ...jsonColumn("TEXT", "JSONB") },
      { name: "provider_response_json", ...jsonColumn("TEXT", "JSONB") },
      { name: "result_json", ...jsonColumn("TEXT", "JSONB") },
      { name: "error_summary", sqlite: "TEXT", postgresql: "TEXT" },
      { name: "created_at_ms", sqlite: "INTEGER NOT NULL", postgresql: "BIGINT NOT NULL" },
      { name: "updated_at_ms", sqlite: "INTEGER NOT NULL", postgresql: "BIGINT NOT NULL" },
    ],
    indexes: [
      { name: "idx_vlap_generation_tasks_status", columns: "operation_type, status, created_at_ms DESC" },
      { name: "idx_vlap_generation_tasks_provider_task", columns: "provider_id, provider_task_id" },
    ],
  },
  {
    name: "vlap_task_events",
    columns: [
      { name: "event_id", sqlite: "TEXT PRIMARY KEY", postgresql: "TEXT PRIMARY KEY" },
      { name: "task_id", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "event_type", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "from_status", sqlite: "TEXT", postgresql: "TEXT" },
      { name: "to_status", sqlite: "TEXT", postgresql: "TEXT" },
      { name: "provider_event_id", sqlite: "TEXT", postgresql: "TEXT" },
      { name: "payload_hash", sqlite: "TEXT", postgresql: "TEXT" },
      { name: "payload_json", ...jsonColumn() },
      { name: "created_at_ms", sqlite: "INTEGER NOT NULL", postgresql: "BIGINT NOT NULL" },
    ],
    indexes: [{ name: "idx_vlap_task_events_task", columns: "task_id, created_at_ms DESC" }],
  },
  {
    name: "vlap_audio_artifacts",
    columns: [
      { name: "artifact_id", sqlite: "TEXT PRIMARY KEY", postgresql: "TEXT PRIMARY KEY" },
      { name: "task_id", sqlite: "TEXT", postgresql: "TEXT" },
      { name: "request_id", sqlite: "TEXT", postgresql: "TEXT" },
      { name: "kind", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "media_resource_json", ...jsonColumn() },
      { name: "created_at_ms", sqlite: "INTEGER NOT NULL", postgresql: "BIGINT NOT NULL" },
    ],
    indexes: [{ name: "idx_vlap_audio_artifacts_request", columns: "request_id" }],
  },
  {
    name: "vlap_provider_webhook_events",
    columns: [
      { name: "event_id", sqlite: "TEXT PRIMARY KEY", postgresql: "TEXT PRIMARY KEY" },
      { name: "provider_id", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "provider_event_id", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "provider_task_id", sqlite: "TEXT", postgresql: "TEXT" },
      { name: "task_id", sqlite: "TEXT", postgresql: "TEXT" },
      { name: "signature_status", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "payload_hash", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "payload_json", ...jsonColumn() },
      { name: "processing_status", sqlite: "TEXT NOT NULL", postgresql: "TEXT NOT NULL" },
      { name: "created_at_ms", sqlite: "INTEGER NOT NULL", postgresql: "BIGINT NOT NULL" },
    ],
    indexes: [
      { name: "uk_vlap_provider_webhook_events_provider_event", columns: "provider_id, provider_event_id" },
      { name: "idx_vlap_provider_webhook_events_status", columns: "provider_id, processing_status, created_at_ms DESC" },
    ],
  },
] as const;

export const VOICE_LOCAL_API_PROXY_SCHEMA_TABLE_NAMES = VOICE_LOCAL_API_PROXY_SCHEMA_TABLES.map((table) => table.name);

function qualifyTableName(dialect: VoiceLocalApiProxySchemaDialect, tableName: string, schemaName?: string) {
  return dialect === "postgresql" && schemaName ? `${schemaName}.${tableName}` : tableName;
}

function buildCreateTableStatement(
  table: VoiceLocalApiProxySchemaTableDefinition,
  dialect: VoiceLocalApiProxySchemaDialect,
  schemaName?: string,
) {
  const qualifiedTableName = qualifyTableName(dialect, table.name, schemaName);
  const columns = table.columns.map(
    (column) => `  ${column.name} ${dialect === "sqlite" ? column.sqlite : column.postgresql}`,
  );
  const lines = table.constraints ? [...columns, ...table.constraints.map((item) => `  ${item}`)] : columns;
  return `CREATE TABLE IF NOT EXISTS ${qualifiedTableName} (\n${lines.join(",\n")}\n);`;
}

function buildCreateIndexStatement(
  tableName: string,
  index: NonNullable<VoiceLocalApiProxySchemaTableDefinition["indexes"]>[number],
  dialect: VoiceLocalApiProxySchemaDialect,
  schemaName?: string,
) {
  const qualifiedTableName = qualifyTableName(dialect, tableName, schemaName);
  return `CREATE INDEX IF NOT EXISTS ${index.name} ON ${qualifiedTableName} (${index.columns});`;
}

export function createVoiceLocalApiProxySchemaTableNames() {
  return [...VOICE_LOCAL_API_PROXY_SCHEMA_TABLE_NAMES];
}

export function buildVoiceLocalApiProxySchemaStatements(
  dialect: VoiceLocalApiProxySchemaDialect,
  options?: { schemaName?: string },
) {
  const statements: string[] = [];
  const schemaName = dialect === "postgresql"
    ? options?.schemaName || VOICE_LOCAL_API_PROXY_DEFAULT_POSTGRES_SCHEMA
    : undefined;

  if (dialect === "postgresql") {
    statements.push(`CREATE SCHEMA IF NOT EXISTS ${schemaName};`);
  }

  for (const table of VOICE_LOCAL_API_PROXY_SCHEMA_TABLES) {
    statements.push(buildCreateTableStatement(table, dialect, schemaName));
    for (const index of table.indexes ?? []) {
      statements.push(buildCreateIndexStatement(table.name, index, dialect, schemaName));
    }
  }

  return statements;
}
