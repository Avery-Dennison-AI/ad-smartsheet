import mongoose from 'mongoose';
import Sheet from '../models/Sheet';
import Workspace from '../models/Workspace';
import User from '../models/User';
import { requireSheetAccess, hasMinRole } from './permissionService';
import type { SheetRole } from './permissionService';
import { getMemberId, getMemberRole } from './workspaceService';
import { AppError } from '../utils/AppError';

const MEMBER_POPULATE = '_id fullName email role guestExpiresAt';

export interface DirectMemberInfo {
  id: string;
  fullName: string;
  email: string;
  role: string;
  userRole: string;
  guestExpiresAt: Date | null;
}

export interface WorkspaceMemberInfo {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface SheetMembersResult {
  directMembers: DirectMemberInfo[];
  workspaceMembers: WorkspaceMemberInfo[];
}

/** Gets sheet members (direct + workspace) for display. Requires viewer+ effective role. */
export async function getSheetMembers(
  sheetId: string,
  userId: string,
): Promise<SheetMembersResult> {
  const { sheet, workspace } = await requireSheetAccess(userId, sheetId, 'viewer');

  // Populate direct members
  const populatedSheet = await Sheet.findById(sheet._id)
    .populate('members.userId', MEMBER_POPULATE);

  const directMembers: DirectMemberInfo[] = [];
  if (populatedSheet) {
    for (const m of populatedSheet.members) {
      const user = m.userId as unknown as { _id: mongoose.Types.ObjectId; fullName: string; email: string; role: string; guestExpiresAt?: Date };
      if (!user || typeof user === 'string') continue;
      directMembers.push({
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: m.role,
        userRole: user.role || 'member',
        guestExpiresAt: user.guestExpiresAt || null,
      });
    }
  }

  // Get workspace members
  const populatedWorkspace = await Workspace.findById(workspace._id)
    .populate('members.user', '_id fullName email');

  const workspaceMembers: WorkspaceMemberInfo[] = [];
  if (populatedWorkspace) {
    for (const m of populatedWorkspace.members) {
      const user = m.user as unknown as { _id: mongoose.Types.ObjectId; fullName: string; email: string };
      if (!user || typeof user === 'string') continue;
      workspaceMembers.push({
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: m.role,
      });
    }
  }

  return { directMembers, workspaceMembers };
}

/** Adds or updates a direct share on a sheet. Requires admin+ effective role. */
export async function addOrUpdateSheetMember(
  sheetId: string,
  actorId: string,
  data: { userId: string; role: 'viewer' | 'editor' | 'admin' },
): Promise<SheetMembersResult> {
  if (!mongoose.Types.ObjectId.isValid(data.userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  // Check actor has admin+ access
  const { effectiveRole } = await requireSheetAccess(actorId, sheetId, 'admin');

  // Guests may only be shared as viewer or editor, never admin
  const targetUser = await User.findById(data.userId).select('_id isActive role');
  if (!targetUser || !targetUser.isActive) {
    throw new AppError('User not found or inactive', 404);
  }

  // Enforce org policy maxGuestRole cap for guests
  let assignedRole = data.role;
  if (targetUser.role === 'guest') {
    if (assignedRole === 'admin') {
      throw new AppError('Guests can be at most editor', 400);
    }
    // Cap at org policy maxGuestRole
    const orgPolicyService = await import('./orgPolicyService');
    const policy = await orgPolicyService.getOrgPolicy();
    const roleLevel: Record<string, number> = { viewer: 1, editor: 2 };
    const maxLevel = roleLevel[policy.maxGuestRole] ?? 2;
    const requestedLevel = roleLevel[assignedRole] ?? 0;
    if (requestedLevel > maxLevel) {
      assignedRole = policy.maxGuestRole as 'viewer' | 'editor';
    }
  }

  // Upsert the member entry
  const existingIdx = await Sheet.findOne({
    _id: sheetId,
    'members.userId': new mongoose.Types.ObjectId(data.userId),
  }).select('_id');

  if (existingIdx) {
    // Update existing
    await Sheet.findOneAndUpdate(
      { _id: sheetId, 'members.userId': new mongoose.Types.ObjectId(data.userId) },
      { $set: { 'members.$.role': assignedRole } },
    );
  } else {
    // Add new
    await Sheet.findByIdAndUpdate(sheetId, {
      $push: { members: { userId: new mongoose.Types.ObjectId(data.userId), role: assignedRole } },
    });
  }

  return getSheetMembers(sheetId, actorId);
}

/** Updates a direct member's role. Requires admin+ effective role. */
export async function updateSheetMemberRole(
  sheetId: string,
  actorId: string,
  targetUserId: string,
  role: 'viewer' | 'editor' | 'admin',
): Promise<SheetMembersResult> {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new AppError('Invalid user ID', 400);
  }

  await requireSheetAccess(actorId, sheetId, 'admin');

  // Guests may only be viewer or editor
  const targetUser = await User.findById(targetUserId).select('_id role');
  if (!targetUser) throw new AppError('User not found', 404);
  if (targetUser.role === 'guest' && role === 'admin') {
    throw new AppError('Guests can be at most editor', 400);
  }

  const result = await Sheet.findOneAndUpdate(
    { _id: sheetId, 'members.userId': new mongoose.Types.ObjectId(targetUserId) },
    { $set: { 'members.$.role': role } },
    { new: true },
  );

  if (!result) throw new AppError('User is not a direct member of this sheet', 404);

  return getSheetMembers(sheetId, actorId);
}

/** Removes a direct share. Requires admin+ effective role. */
export async function removeSheetMember(
  sheetId: string,
  actorId: string,
  targetUserId: string,
): Promise<SheetMembersResult> {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new AppError('Invalid user ID', 400);
  }

  await requireSheetAccess(actorId, sheetId, 'admin');

  await Sheet.findByIdAndUpdate(sheetId, {
    $pull: { members: { userId: new mongoose.Types.ObjectId(targetUserId) } },
  });

  return getSheetMembers(sheetId, actorId);
}

/** Returns sheets directly shared with the user where they are NOT a workspace member. */
export async function getSharedWithMe(userId: string) {
  const sheets = await Sheet.find({ 'members.userId': new mongoose.Types.ObjectId(userId) })
    .sort({ updatedAt: -1 })
    .populate('createdBy', '_id fullName email');

  const results: Array<{
    sheet: { id: string; name: string; updatedAt: Date; workspaceId: string };
    workspace: { id: string; name: string };
    lastOpenedAt: null;
    isFavorite: boolean;
    role: string;
  }> = [];

  for (const sheet of sheets) {
    // Check if user is also a workspace member — if so, skip (it's a workspace sheet)
    const workspace = await Workspace.findById(sheet.workspaceId).select('members name');
    if (!workspace) continue;

    const wsRole = getMemberRole(workspace, userId);
    if (wsRole) continue; // user is a workspace member, not "shared with me"

    // Find the user's direct role on this sheet
    const memberEntry = sheet.members.find((m) => m.userId.toString() === userId);
    const role = memberEntry?.role || 'viewer';

    results.push({
      sheet: {
        id: sheet._id.toString(),
        name: sheet.name,
        updatedAt: sheet.updatedAt,
        workspaceId: sheet.workspaceId.toString(),
      },
      workspace: {
        id: workspace._id.toString(),
        name: workspace.name,
      },
      lastOpenedAt: null,
      isFavorite: false,
      role,
    });
  }

  return results;
}
