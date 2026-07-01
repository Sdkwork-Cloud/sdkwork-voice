import type { SdkWorkPageData } from './sdk-work-page-data';

export interface SdkWorkListResponse {
  code: 0;
  data: unknown & SdkWorkPageData;
  /** Server-owned request correlation id. */
  traceId: string;
}
