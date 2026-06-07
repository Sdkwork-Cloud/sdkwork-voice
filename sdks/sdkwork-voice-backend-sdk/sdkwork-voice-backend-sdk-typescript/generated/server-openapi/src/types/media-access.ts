export interface MediaAccess {
  visibility: 'private' | 'tenant' | 'organization' | 'public' | 'signed';
  expiresAt?: string;
}
