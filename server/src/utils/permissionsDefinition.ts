/**
 * Shared permission matrix definitions for the Roles & Permissions feature.
 * Server-facing version — mirrors client/src/utils/permissionsDefinition.ts.
 */

export interface OrgRoleRow {
  action: string;
  admin: boolean | string;
  member: boolean | string;
  guest: boolean | string;
  tooltip?: string;
}

export interface WorkspaceSheetRoleRow {
  action: string;
  owner: boolean | string;
  admin: boolean | string;
  editor: boolean | string;
  viewer: boolean | string;
  tooltip?: string;
}

/** Organization-level role permissions matrix. */
export const ORG_ROLE_MATRIX: OrgRoleRow[] = [
  { action: 'Manage users', admin: true, member: false, guest: false },
  { action: 'Invite members', admin: true, member: false, guest: false },
  { action: 'Invite guests', admin: true, member: false, guest: false, tooltip: 'Controlled by org policy' },
  { action: 'Create workspaces', admin: true, member: true, guest: false, tooltip: 'Can be restricted to admins only via org policy' },
  { action: 'Access Administration', admin: true, member: false, guest: false },
  { action: 'See full user directory', admin: true, member: true, guest: false },
];

/** Workspace/sheet-level role permissions matrix. */
export const WORKSPACE_SHEET_ROLE_MATRIX: WorkspaceSheetRoleRow[] = [
  { action: 'View sheets', owner: true, admin: true, editor: true, viewer: true },
  { action: 'Edit cells and rows', owner: true, admin: true, editor: true, viewer: false },
  { action: 'Manage columns', owner: true, admin: true, editor: true, viewer: false },
  { action: 'Format cells', owner: true, admin: true, editor: true, viewer: false },
  { action: 'Create sheets', owner: true, admin: true, editor: false, viewer: false },
  { action: 'Rename/duplicate sheets', owner: true, admin: true, editor: false, viewer: false },
  { action: 'Delete sheets', owner: true, admin: true, editor: false, viewer: false },
  { action: 'Share sheets', owner: true, admin: true, editor: false, viewer: false },
  { action: 'Manage workspace members', owner: true, admin: true, editor: false, viewer: false },
  { action: 'Edit workspace settings', owner: true, admin: true, editor: false, viewer: false },
  { action: 'Delete workspace', owner: true, admin: false, editor: false, viewer: false },
];
