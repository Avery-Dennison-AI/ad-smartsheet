// Standard response envelope returned by the Express backend.
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// ─── User Management Types ──────────────────────────────────────────────────

export type UserRole = 'admin' | 'member';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Invitation Types ───────────────────────────────────────────────────────

export type InvitationStatus = 'pending' | 'expired' | 'accepted' | 'revoked';

export interface InvitationItem {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  status: InvitationStatus;
  invitedBy: { fullName: string; email: string } | string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface InvitationPreview {
  email: string;
  fullName: string | null;
  role: UserRole;
}

// ─── Workspace Types ────────────────────────────────────────────────────────

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';

export type WorkspaceColor = 'teal' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';

export interface WorkspaceMember {
  user: { _id: string; fullName: string; email: string };
  role: WorkspaceRole;
}

export interface Workspace {
  _id: string;
  name: string;
  description?: string;
  color: WorkspaceColor;
  owner: string; // user id
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

