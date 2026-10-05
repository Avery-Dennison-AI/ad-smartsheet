import mongoose from 'mongoose';
import Sheet, { type ISheet } from '../models/Sheet';
import Workspace, { type IWorkspace } from '../models/Workspace';
import User, { type IUser } from '../models/User';
import { getMemberRole } from './workspaceService';
import { AppError } from '../utils/AppError';

export type SheetRole = 'viewer' | 'editor' | 'admin' | 'owner';

const ROLE_ORDER: SheetRole[] = ['viewer', 'editor', 'admin', 'owner'];

export const ROLE_LEVEL: Record<SheetRole, number> = {
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
 * Pure function that calculates the effective role for a user on a sheet.
 * No DB access — all data must be pre-loaded.
 *
 * Effective role = highest of workspace role + sheet-direct role.
 * - Guests may access via workspace OR sheet membership (capped at editor by default, or maxGuestRole).
 * - Expired guests → null.
 * - Inactive users → null.
 * - No access anywhere → null.
 */
export function calculateEffectiveRole(
  user: { role: string; isActive: boolean; guestExpiresAt?: Date | null },
  workspace: { members: Array<{ user: any; role: string }> } | null,
  sheet: { members: Array<{ userId: any; role: string }>; workspaceId?: any } | null,
  userId: string,
  maxGuestRole?: 'editor' | 'viewer',
): SheetRole | null {
  // 1. Inactive user → null
  if (!user.isActive) return null;

  // 2. Expired guest → null
  if (user.role === 'guest' && user.guestExpiresAt && user.guestExpiresAt < new Date()) return null;

  const isGuest = user.role === 'guest';
  // Use org policy maxGuestRole if provided, otherwise default to editor
  const GUEST_MAX: SheetRole = maxGuestRole === 'viewer' ? 'viewer' : 'editor';

  // 3. Workspace role
  const wsMember = workspace?.members.find(m => String(m.user) === String(userId));
  let wsRole = wsMember ? (wsMember.role as SheetRole) : null;
  if (isGuest && wsRole) {
    // Cap guest workspace role at maxGuestRole
    wsRole = ROLE_LEVEL[wsRole] > ROLE_LEVEL[GUEST_MAX] ? GUEST_MAX : wsRole;
  }

  // 4. Sheet-level direct role
  const sheetMember = sheet?.members.find(m => String(m.userId) === String(userId));
  let sheetRole = sheetMember ? (sheetMember.role as SheetRole) : null;
  if (isGuest && sheetRole) {
    // Cap guest sheet role at maxGuestRole
    sheetRole = ROLE_LEVEL[sheetRole] > ROLE_LEVEL[GUEST_MAX] ? GUEST_MAX : sheetRole;
  }

  // 5. Return highest, with guest requiring at least one explicit share
  if (isGuest) {
    // Guest must have explicit share on workspace OR sheet
    if (!wsRole && !sheetRole) return null;
    // Take highest non-null role (same logic as non-guests)
    const candidates = [wsRole, sheetRole].filter(Boolean) as SheetRole[];
    const result = candidates.reduce((best, r) => ROLE_LEVEL[r] > ROLE_LEVEL[best] ? r : best);
    // Final cap for guests
    return ROLE_LEVEL[result] > ROLE_LEVEL[GUEST_MAX] ? GUEST_MAX : result;
  }

  // Non-guest: take highest of workspace role and sheet role
  if (!wsRole && !sheetRole) return null;
  const candidates = [wsRole, sheetRole].filter(Boolean) as SheetRole[];
  return candidates.reduce((best, r) => ROLE_LEVEL[r] > ROLE_LEVEL[best] ? r : best);
}

/**
 * Returns the effective role for a user on a sheet.
 * Loads sheet, workspace, and optionally user from DB once and delegates to calculateEffectiveRole.
 * Accepts an optional preloaded user to avoid duplicate DB queries when req.user is available.
 */
export async function getEffectiveRole(
  userId: string,
  sheetId: string,
  preloadedUser?: { role: string; isActive: boolean; guestExpiresAt?: Date | null } | null,
): Promise<SheetRole | null> {
  if (!mongoose.Types.ObjectId.isValid(sheetId)) return null;

  const sheet = await Sheet.findById(sheetId).select('workspaceId members');
  if (!sheet) return null;

  // Use preloaded user if provided, otherwise load from DB
  let userData: { role: string; isActive: boolean; guestExpiresAt?: Date | null };
  if (preloadedUser) {
    userData = preloadedUser;
  } else {
    const user = await User.findById(userId).select('role guestExpiresAt isActive');
    if (!user) return null;
    userData = { role: user.role, isActive: user.isActive, guestExpiresAt: user.guestExpiresAt };
  }

  // Get workspace
  const workspace = await Workspace.findById(sheet.workspaceId).select('members');

  return calculateEffectiveRole(
    userData,
    workspace ? { members: workspace.members.map(m => ({ user: m.user, role: m.role })) } : null,
    { members: sheet.members.map(m => ({ userId: m.userId, role: m.role })) },
    userId,
  );
}

export interface SheetAccessResult {
  sheet: ISheet;
  workspace: IWorkspace;
  effectiveRole: SheetRole;
}

/**
 * Validates sheet access. Throws 404 if no access (or sheet not found),
 * 403 if the user's role is below the required role.
 * Accepts an optional preloaded user to avoid duplicate DB queries.
 */
export async function requireSheetAccess(
  userId: string,
  sheetId: string,
  requiredRole: SheetRole = 'viewer',
  preloadedUser?: { role: string; isActive: boolean; guestExpiresAt?: Date | null } | null,
): Promise<SheetAccessResult> {
  if (!mongoose.Types.ObjectId.isValid(sheetId)) {
    throw new AppError('Invalid sheet ID', 400);
  }

  const sheet = await Sheet.findById(sheetId);
  if (!sheet) throw new AppError('Sheet not found', 404);

  const workspace = await Workspace.findById(sheet.workspaceId);
  if (!workspace) throw new AppError('Sheet not found', 404);

  // Use preloaded user if provided, otherwise load from DB
  let userData: { role: string; isActive: boolean; guestExpiresAt?: Date | null };
  if (preloadedUser) {
    userData = preloadedUser;
  } else {
    const user = await User.findById(userId).select('role guestExpiresAt isActive');
    if (!user) throw new AppError('Sheet not found', 404);
    userData = { role: user.role, isActive: user.isActive, guestExpiresAt: user.guestExpiresAt };
  }

  // Fetch org policy for guest cap (only needed for guests)
  let maxGuestRole: 'editor' | 'viewer' | undefined;
  if (userData.role === 'guest') {
    const orgPolicyService = await import('./orgPolicyService');
    const policy = await orgPolicyService.getOrgPolicy();
    maxGuestRole = policy.maxGuestRole;
  }

  const effectiveRole = calculateEffectiveRole(
    userData,
    { members: workspace.members.map(m => ({ user: m.user, role: m.role })) },
    { members: sheet.members.map(m => ({ userId: m.userId, role: m.role })) },
    userId,
    maxGuestRole,
  );

  if (!effectiveRole) {
    throw new AppError('Sheet not found', 404);
  }

  if (!hasMinRole(effectiveRole, requiredRole)) {
    throw new AppError('Access denied', 403);
  }

  return { sheet, workspace, effectiveRole };
}
