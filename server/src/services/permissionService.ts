import mongoose from 'mongoose';
import Sheet, { type ISheet } from '../models/Sheet';
import Workspace, { type IWorkspace } from '../models/Workspace';
import User, { type IUser } from '../models/User';
import { getMemberRole } from './workspaceService';
import { AppError } from '../utils/AppError';

export type SheetRole = 'viewer' | 'editor' | 'admin' | 'owner';

const ROLE_ORDER: SheetRole[] = ['viewer', 'editor', 'admin', 'owner'];

const ROLE_LEVEL: Record<SheetRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

/** Returns true if userRole meets or exceeds the required role. */
export function hasMinRole(userRole: SheetRole, required: SheetRole): boolean {
  return (ROLE_LEVEL[userRole] ?? 0) >= (ROLE_LEVEL[required] ?? 0);
}

/** Returns the higher of two roles. */
function higherRole(a: SheetRole, b: SheetRole): SheetRole {
  return (ROLE_LEVEL[a] ?? 0) >= (ROLE_LEVEL[b] ?? 0) ? a : b;
}

/**
 * Returns the effective role for a user on a sheet.
 *
 * Effective role = highest of workspace role + sheet-direct role.
 * - If user is a workspace member but has no direct sheet share → workspace role.
 * - If user has a direct sheet share but is not a workspace member → sheet role.
 * - If user has both → the higher of the two.
 * - Guest users (orgRole === 'guest') may only access sheets they are directly shared on.
 *   Their workspace membership alone gives NO access.
 * - Expired guests (guestExpiresAt in the past) → null (no access).
 * - No access anywhere → null.
 */
export async function getEffectiveRole(
  userId: string,
  sheetId: string,
): Promise<SheetRole | null> {
  if (!mongoose.Types.ObjectId.isValid(sheetId)) return null;

  const sheet = await Sheet.findById(sheetId).select('workspaceId members');
  if (!sheet) return null;

  // Load user to check guest status
  const user = await User.findById(userId).select('orgRole guestExpiresAt isActive');
  if (!user || !user.isActive) return null;

  // Check guest expiry
  if (user.orgRole === 'guest' && user.guestExpiresAt && user.guestExpiresAt < new Date()) {
    return null;
  }

  const isGuest = user.orgRole === 'guest';

  // Get workspace role
  const workspace = await Workspace.findById(sheet.workspaceId).select('members');
  let workspaceRole: SheetRole | null = null;
  if (workspace) {
    const wsRole = getMemberRole(workspace, userId);
    if (wsRole) {
      workspaceRole = wsRole as SheetRole;
    }
  }

  // Get sheet-direct role
  let sheetRole: SheetRole | null = null;
  const sheetMember = sheet.members.find(
    (m) => m.userId.toString() === userId,
  );
  if (sheetMember) {
    sheetRole = sheetMember.role as SheetRole;
  }

  // Guests can ONLY access sheets via direct sharing
  if (isGuest) {
    return sheetRole; // null if no direct share
  }

  // Non-guests: effective = highest of workspace and sheet roles
  if (workspaceRole && sheetRole) {
    return higherRole(workspaceRole, sheetRole);
  }
  if (workspaceRole) return workspaceRole;
  if (sheetRole) return sheetRole;

  return null;
}

export interface SheetAccessResult {
  sheet: ISheet;
  workspace: IWorkspace;
  effectiveRole: SheetRole;
}

/**
 * Validates sheet access. Throws 404 if no access (or sheet not found),
 * 403 if the user's role is below the required role.
 */
export async function requireSheetAccess(
  userId: string,
  sheetId: string,
  requiredRole: SheetRole = 'viewer',
): Promise<SheetAccessResult> {
  if (!mongoose.Types.ObjectId.isValid(sheetId)) {
    throw new AppError('Invalid sheet ID', 400);
  }

  const sheet = await Sheet.findById(sheetId);
  if (!sheet) throw new AppError('Sheet not found', 404);

  const workspace = await Workspace.findById(sheet.workspaceId);
  if (!workspace) throw new AppError('Sheet not found', 404);

  const effectiveRole = await getEffectiveRole(userId, sheetId);
  if (!effectiveRole) {
    throw new AppError('Sheet not found', 404);
  }

  if (!hasMinRole(effectiveRole, requiredRole)) {
    throw new AppError('Access denied', 403);
  }

  return { sheet, workspace, effectiveRole };
}
