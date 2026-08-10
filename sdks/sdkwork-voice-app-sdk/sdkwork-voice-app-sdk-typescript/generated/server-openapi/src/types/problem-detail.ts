import type { FieldError } from './field-error';
import type { SdkWorkPlatformErrorCode } from './sdk-work-platform-error-code';

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code: SdkWorkPlatformErrorCode;
  /** Server-owned request correlation id. */
  traceId: string;
  /** Optional stable localization key such as errors.result.40001. */
  i18nKey?: string;
  /** Optional effective BCP 47 locale used by framework message mapping. */
  locale?: string;
  errors?: FieldError[];
}
