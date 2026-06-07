export interface MediaChecksum {
  algorithm: 'sha256' | 'md5' | 'etag';
  value: string;
}
