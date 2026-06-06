export interface VoiceApiResult {
  code: string;
  message: string;
  /** Server-owned request correlation id. */
  requestId: string;
  data: Record<string, unknown>;
}
