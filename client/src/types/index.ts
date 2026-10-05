// Standard response envelope returned by the Express backend.
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// ─── User Management Types ──────────────────────────────────────────────────

export type UserRole = 'admin' | 'member' | 'guest';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  guestExpiresAt: string | null;
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
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
  id: string;
  fullName: string;
  email: string;
  role: WorkspaceRole;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  color: WorkspaceColor;
  owner: string; // user id
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

// ─── Sheet Types ──────────────────────────────────────────────────────────────

export interface SheetCreatedBy {
  id: string;
  fullName: string;
  email: string;
}

export interface Sheet {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdBy: SheetCreatedBy;
  createdAt: string;
  updatedAt: string;
  workspaceName?: string;
  userRole?: WorkspaceRole;
}

export interface SheetMetaItem {
  sheet: {
    id: string;
    name: string;
    updatedAt: string;
    workspaceId: string;
  };
  workspace: {
    id: string;
    name: string;
  };
  lastOpenedAt: string | null;
  isFavorite: boolean;
}

// ─── Grid Types ──────────────────────────────────────────────────────────────

export type ColumnType = 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'contact';

export interface DropdownOption {
  label: string;
  color: string;
}

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  isPrimary: boolean;
  order: number;
  options?: DropdownOption[];
  formatting?: CellFormatting;
  width?: number;
}

export interface GridRow {
  id: string;
  order: number;
  cells: Record<string, string | number | boolean | null>;
  formatting?: Record<string, CellFormatting>;
  height?: number;
  parentId: string | null;
  depth: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CellFormatting {
  fontFamily?: string | null;
  fontSize?: number | null;
  bold?: boolean | null;
  italic?: boolean | null;
  underline?: boolean | null;
  strikethrough?: boolean | null;
  textAlign?: 'left' | 'center' | 'right' | null;
  verticalAlign?: 'top' | 'middle' | 'bottom' | null;
  textColor?: string | null;
  fillColor?: string | null;
  wrapText?: boolean | null;
}

export interface GridState {
  columns: Column[];
  rows: GridRow[];
}

// ─── Sheet Sharing Types ──────────────────────────────────────────────────

export type SheetRole = 'viewer' | 'editor' | 'admin';

export interface DirectSheetMember {
  id: string;
  fullName: string;
  email: string;
  role: SheetRole;
  userRole: UserRole;
  guestExpiresAt: string | null;
}

export interface WorkspaceSheetMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface SheetMembersResult {
  directMembers: DirectSheetMember[];
  workspaceMembers: WorkspaceSheetMember[];
}

export interface SharedWithMeItem {
  sheet: {
    id: string;
    name: string;
    updatedAt: string;
    workspaceId: string;
  };
  workspace: {
    id: string;
    name: string;
  };
  lastOpenedAt: string | null;
  isFavorite: boolean;
  role: string;
}

// ─── Organization Policy Types ──────────────────────────────────────────────

export interface OrgPolicy {
  _id?: string;
  whoCanCreateWorkspaces: 'all' | 'admins';
  whoCanInviteGuests: 'admins' | 'admins_and_workspace_admins';
  guestAccessExpiry: 'optional' | 'required';
  defaultGuestExpiryDays: number;
  allowedGuestEmailDomains: string[];
  maxGuestRole: 'editor' | 'viewer';
}

