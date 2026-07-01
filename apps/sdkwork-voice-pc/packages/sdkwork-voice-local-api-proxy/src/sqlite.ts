import type { VoiceLocalApiProxyStorageConfig } from "./types.ts";
import {
  buildVoiceLocalApiProxySchemaStatements,
  createVoiceLocalApiProxySchemaTableNames,
} from "./schema.ts";

export interface VoiceLocalApiProxySqliteSchema {
  databasePath: string;
  dialect: "sqlite";
  statements: string[];
  tableNames: string[];
}

export function buildVoiceLocalApiProxySqliteSchema(
  storage: Extract<VoiceLocalApiProxyStorageConfig, { dialect: "sqlite" }>,
): VoiceLocalApiProxySqliteSchema {
  return {
    databasePath: storage.sqlitePath,
    dialect: "sqlite",
    statements: buildVoiceLocalApiProxySchemaStatements("sqlite"),
    tableNames: createVoiceLocalApiProxySchemaTableNames(),
  };
}
