export interface AppbaseVoiceMigrationAuditFinding {
  kind: "path" | "content";
  path: string;
  line?: number;
  pattern?: string;
  reason: string;
}

export interface AppbaseVoiceMigrationAuditResult {
  appbaseRoot: string;
  ok: boolean;
  findings: AppbaseVoiceMigrationAuditFinding[];
}

export const DEFAULT_APPBASE_ROOT: string;
export const disallowedPathRelatives: readonly string[];
export const disallowedFilePatterns: readonly unknown[];

export function auditAppbaseVoiceMigration(options?: {
  appbaseRoot?: string;
}): Promise<AppbaseVoiceMigrationAuditResult>;
export function formatAuditFindings(result: AppbaseVoiceMigrationAuditResult): string;
