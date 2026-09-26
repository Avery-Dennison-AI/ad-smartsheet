/**
 * Builds a same-origin URL for server-hosted assets (uploads).
 * All asset requests go through /api/uploads/* which the backend serves statically.
 */
export function getAssetUrl(filePath: string | null | undefined): string {
  if (!filePath) return '';
  const normalized = String(filePath).replace(/^\//, '');
  return `/api/${normalized}`;
}
