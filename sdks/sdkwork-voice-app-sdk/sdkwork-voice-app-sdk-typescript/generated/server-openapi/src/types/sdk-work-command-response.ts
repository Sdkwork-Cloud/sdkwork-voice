import type { SdkWorkCommandData } from './sdk-work-command-data';

export interface SdkWorkCommandResponse {
  code: 0;
  data: unknown & SdkWorkCommandData;
  /** Server-owned request correlation id. */
  traceId: string;
}
