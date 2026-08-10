export interface FieldError {
  field: string;
  message: string;
  code?: number;
  i18nKey?: string;
  params?: Record<string, string | number | number | boolean>;
}
