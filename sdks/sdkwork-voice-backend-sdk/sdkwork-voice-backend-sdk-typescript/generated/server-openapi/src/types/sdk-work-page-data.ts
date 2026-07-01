import type { PageInfo } from './page-info';

export interface SdkWorkPageData {
  items: Record<string, unknown>[];
  pageInfo: PageInfo;
}
