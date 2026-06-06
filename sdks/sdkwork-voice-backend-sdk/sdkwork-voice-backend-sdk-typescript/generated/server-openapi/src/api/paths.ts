export const BACKEND_API_PREFIX = '/backend/v3/api';

export function backendApiPath(path: string): string {
  if (!path) {
    return BACKEND_API_PREFIX;
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalizedPrefixRaw = (BACKEND_API_PREFIX || '').trim();
  const normalizedPrefix = normalizedPrefixRaw
    ? `/${normalizedPrefixRaw.replace(/^\/+|\/+$/g, '')}`
    : '';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!normalizedPrefix || normalizedPrefix === '/') {
    return normalizedPath;
  }
  if (normalizedPath === normalizedPrefix || normalizedPath.startsWith(`${normalizedPrefix}/`)) {
    return normalizedPath;
  }
  return `${normalizedPrefix}${normalizedPath}`;
}
