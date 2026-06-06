import type { FieldError } from './field-error';

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
  traceId?: string;
  /** Server-owned request correlation id. */
  requestId?: string;
  errors?: FieldError[];
}
