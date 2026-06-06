export interface MediaResource {
  id: string;
  kind: 'audio' | 'voice';
  mimeType: string;
  uri: string;
  title?: string;
  durationMs?: number;
  /** Int64-compatible byte size serialized as a string. */
  sizeBytes?: string;
  metadata?: Record<string, unknown>;
}
