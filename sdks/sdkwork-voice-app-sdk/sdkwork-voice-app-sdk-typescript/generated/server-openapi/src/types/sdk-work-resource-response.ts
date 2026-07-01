import type { SdkWorkResourceData } from './sdk-work-resource-data';

export interface SdkWorkResourceResponse {
  code: 0;
  data: unknown & SdkWorkResourceData;
  /** Server-owned request correlation id. */
  traceId: string;
}
