import {
  VOICE_LOCAL_API_PROXY_DEFAULT_POSTGRES_SCHEMA,
  type VoiceLocalApiProxyStorageConfig,
} from "./types.ts";
import {
  buildVoiceLocalApiProxySchemaStatements,
  createVoiceLocalApiProxySchemaTableNames,
} from "./schema.ts";

export interface VoiceLocalApiProxyPostgresqlSchema {
  dialect: "postgresql";
  postgresUrl: string;
  schemaName: string;
  statements: string[];
  tableNames: string[];
}

export function buildVoiceLocalApiProxyPostgresqlSchema(
  storage: Extract<VoiceLocalApiProxyStorageConfig, { dialect: "postgresql" }>,
): VoiceLocalApiProxyPostgresqlSchema {
  const schemaName = storage.schema || VOICE_LOCAL_API_PROXY_DEFAULT_POSTGRES_SCHEMA;
  return {
    dialect: "postgresql",
    postgresUrl: storage.postgresUrl,
    schemaName,
    statements: buildVoiceLocalApiProxySchemaStatements("postgresql", { schemaName }),
    tableNames: createVoiceLocalApiProxySchemaTableNames(),
  };
}
