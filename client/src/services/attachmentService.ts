import apiClient from './apiClient';
import type { FormattedAttachment, AttachmentConfig } from '@/types';

/** Fetch client-side validation config (allowed types, size limits). */
export async function fetchAttachmentConfig(): Promise<AttachmentConfig> {
  const { data } = await apiClient.get('/api/attachments/config');
  return data.data ?? data;
}

/** List all non-deleted attachments for a row. */
export async function listAttachments(
  sheetId: string,
  rowId: string,
): Promise<FormattedAttachment[]> {
  const { data } = await apiClient.get(`/api/sheets/${sheetId}/rows/${rowId}/attachments`);
  const payload = data.data ?? data;
  return Array.isArray(payload) ? payload : [];
}

/**
 * Upload one or more files as attachments to a row.
 * Calls `onProgress(fileIndex, percent)` for each file as it uploads.
 */
export async function uploadAttachments(
  sheetId: string,
  rowId: string,
  files: File[],
  onProgress?: (fileIndex: number, percent: number) => void,
): Promise<FormattedAttachment[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const { data } = await apiClient.post(
    `/api/sheets/${sheetId}/rows/${rowId}/attachments`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (!onProgress || !progressEvent.total) return;
        // With multipart, we can only track overall progress, not per-file.
        // Report overall percentage mapped to the last file index.
        const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        onProgress(files.length - 1, pct);
      },
    },
  );

  const payload = data.data ?? data;
  return Array.isArray(payload) ? payload : [];
}

/** Soft-delete an attachment. */
export async function deleteAttachment(id: string): Promise<void> {
  await apiClient.delete(`/api/attachments/${id}`);
}

/** Returns the direct download URL for an attachment. */
export function getDownloadUrl(id: string): string {
  return `/api/attachments/${id}/download`;
}

/** Returns the preview URL for an attachment (inline for images/PDFs). */
export function getPreviewUrl(id: string): string {
  return `/api/attachments/${id}/preview`;
}
