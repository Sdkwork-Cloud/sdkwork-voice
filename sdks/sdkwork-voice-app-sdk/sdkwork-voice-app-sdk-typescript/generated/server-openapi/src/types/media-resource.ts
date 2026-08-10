import type { MediaAccess } from './media-access';
import type { MediaAiProvenance } from './media-ai-provenance';
import type { MediaChecksum } from './media-checksum';
import type { MediaKind } from './media-kind';
import type { MediaSource } from './media-source';

export interface MediaResource {
  id?: string;
  kind: MediaKind;
  source: MediaSource;
  /** Delivery URL. May be temporary or signed. */
  url?: string | null;
  publicUrl?: string | null;
  uri?: string | null;
  objectBlobId?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  /** Int64-compatible byte size serialized as a string. */
  sizeBytes?: string | null;
  checksum?: MediaChecksum;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  altText?: string | null;
  title?: string | null;
  poster?: MediaResource;
  thumbnails?: MediaResource[];
  variants?: MediaResource[];
  access?: MediaAccess;
  ai?: MediaAiProvenance;
  metadata?: Record<string, unknown>;
}
