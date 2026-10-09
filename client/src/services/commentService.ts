import apiClient from './apiClient';
import type { FormattedComment, ActivityEntry } from '@/types';

export interface ActivityResponse {
  entries: ActivityEntry[];
  nextCursor?: string;
}

/** Fetch all comments for a row (threaded). */
export async function fetchComments(
  sheetId: string,
  rowId: string,
): Promise<FormattedComment[]> {
  const { data } = await apiClient.get(`/api/sheets/${sheetId}/rows/${rowId}/comments`);
  // Server returns { success, data: <array> }; axios unwraps to { data: { success, data } }
  const payload = data.data ?? data;
  return Array.isArray(payload) ? payload : [];
}

/** Post a new comment. parentId is optional for replies. */
export async function postComment(
  sheetId: string,
  rowId: string,
  body: string,
  parentId?: string,
): Promise<FormattedComment> {
  const payload: { body: string; parentId?: string } = { body };
  if (parentId) payload.parentId = parentId;
  const { data } = await apiClient.post(`/api/sheets/${sheetId}/rows/${rowId}/comments`, payload);
  return data.data ?? data;
}

/** Patch (edit) an existing comment's body. */
export async function patchComment(
  commentId: string,
  body: string,
): Promise<FormattedComment> {
  const { data } = await apiClient.patch(`/api/comments/${commentId}`, { body });
  return data.data ?? data;
}

/** Soft-delete a comment. */
export async function deleteComment(commentId: string): Promise<void> {
  await apiClient.delete(`/api/comments/${commentId}`);
}

/** Fetch activity log for a row. `before` is an ISO timestamp cursor. */
export async function fetchRowActivity(
  sheetId: string,
  rowId: string,
  before?: string,
): Promise<ActivityResponse> {
  const params: Record<string, string> = {};
  if (before) params.before = before;
  const { data } = await apiClient.get(`/api/sheets/${sheetId}/rows/${rowId}/activity`, { params });
  return data.data ?? data;
}
