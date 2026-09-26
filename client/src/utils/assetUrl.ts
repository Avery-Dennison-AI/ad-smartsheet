const API_BASE = import.meta.env.VITE_API_URL; // already ends with /api

export function getAssetUrl(filePath: string | null | undefined): string {
  if (!API_BASE) throw new Error('VITE_API_URL is not set');
  if (!filePath) return '';
  return `${API_BASE.replace(/\/$/, '')}/${String(filePath).replace(/^\//, '')}`;
}
