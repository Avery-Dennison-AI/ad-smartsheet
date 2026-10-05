import apiClient from './apiClient';
import type { AdminUser, UserListResponse, InvitationItem, InvitationPreview } from '@/types';

// ─── User Management ────────────────────────────────────────────────────────

export async function fetchUsers(params: {
  search?: string;
  status?: 'active' | 'deactivated' | 'deleted' | 'all';
  page?: number;
  limit?: number;
}): Promise<UserListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const { data } = await apiClient.get(`/api/admin/users?${query.toString()}`);
  return data.data as UserListResponse;
}

export async function updateUserRole(
  userId: string,
  role: 'admin' | 'member',
): Promise<AdminUser> {
  const { data } = await apiClient.patch(`/api/admin/users/${userId}`, { role });
  return data.data as AdminUser;
}

export async function updateUserStatus(
  userId: string,
  isActive: boolean,
): Promise<AdminUser> {
  const { data } = await apiClient.patch(`/api/admin/users/${userId}`, { isActive });
  return data.data as AdminUser;
}

export async function deleteUser(
  userId: string,
  transferToUserId?: string,
): Promise<void> {
  await apiClient.delete(`/api/admin/users/${userId}`, {
    data: transferToUserId ? { transferToUserId } : undefined,
  });
}

export async function getUserOwnedWorkspaces(
  userId: string,
): Promise<Array<{ _id: string; name: string }>> {
  const { data } = await apiClient.get(`/api/admin/users/${userId}/owned-workspaces`);
  return data.data as Array<{ _id: string; name: string }>;
}

// ─── Invitations ────────────────────────────────────────────────────────────

export async function createInvitation(data: {
  email: string;
  fullName?: string;
  role: 'admin' | 'member' | 'guest';
  guestExpiresAt?: string;
}): Promise<{ invitation: InvitationItem; invitePath: string }> {
  const { data: res } = await apiClient.post('/api/admin/invitations', data);
  return res.data as { invitation: InvitationItem; invitePath: string };
}

export async function fetchInvitations(): Promise<InvitationItem[]> {
  const { data } = await apiClient.get('/api/admin/invitations');
  return data.data as InvitationItem[];
}

export async function regenerateInvitation(
  invitationId: string,
): Promise<{ invitation: InvitationItem; invitePath: string }> {
  const { data } = await apiClient.post(`/api/admin/invitations/${invitationId}/regenerate`);
  return data.data as { invitation: InvitationItem; invitePath: string };
}

export async function revokeInvitation(invitationId: string): Promise<InvitationItem> {
  const { data } = await apiClient.post(`/api/admin/invitations/${invitationId}/revoke`);
  return data.data as InvitationItem;
}

// ─── Public Invitation Endpoints ────────────────────────────────────────────

export async function getInvitationPreview(token: string): Promise<InvitationPreview> {
  const { data } = await apiClient.get(`/api/invite/${token}`);
  return data.data as InvitationPreview;
}

export async function acceptInvitation(
  token: string,
  payload: { fullName: string; password: string; confirmPassword: string },
): Promise<{ user: { id: string; fullName: string; email: string; role: string } }> {
  const { data } = await apiClient.post(`/api/invite/${token}/accept`, payload);
  return data.data as { user: { id: string; fullName: string; email: string; role: string } };
}
