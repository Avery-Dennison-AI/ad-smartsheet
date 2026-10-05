import mongoose from 'mongoose';
import Workspace, { type IWorkspace, type WorkspaceRole } from '../models/Workspace';
import User from '../models/User';
import { AppError } from '../utils/AppError';
import { escapeRegex } from '../utils/escapeRegex';
import { deleteSheetsByWorkspace } from './sheetService';

const MEMBER_POPULATE = '_id fullName email';

/** Extracts the string ID from a member's user field, whether it is a raw ObjectId or a populated document. */
export function getMemberId(user: unknown): string {
  if (typeof user === 'string') return user;
  if (user && typeof user === 'object' && '_id' in user) {
    return String((user as { _id: unknown })._id);
  }
  return String(user);
}

/** Extracts the calling user's role from the members array. */
export function getMemberRole(workspace: IWorkspace, userId: string): WorkspaceRole | null {
  const member = workspace.members.find(
    (m) => getMemberId(m.user) === userId,
  );
  return member ? member.role : null;
}

/** Creates a workspace and adds the creator as owner in the members array. */
export async function createWorkspace(
  userId: string,
  data: { name: string; description?: string; color: string },
): Promise<IWorkspace> {
  const workspace = await Workspace.create({
    name: data.name,
    description: data.description || undefined,
    color: data.color,
    owner: new mongoose.Types.ObjectId(userId),
    members: [{ user: new mongoose.Types.ObjectId(userId), role: 'owner' }],
  });

  const populated = await Workspace.findById(workspace._id).populate('members.user', MEMBER_POPULATE);
  if (!populated) throw new AppError('Failed to create workspace', 500);
  return populated;
}

/** Finds all workspaces where the user is a member, sorted by name. */
export async function listUserWorkspaces(userId: string): Promise<IWorkspace[]> {
  const workspaces = await Workspace.find({ 'members.user': new mongoose.Types.ObjectId(userId) })
    .sort({ name: 1 })
    .populate('members.user', MEMBER_POPULATE);
  return workspaces;
}

/** Fetches one workspace the user is a member of; throws 404 if not found or not a member. */
export async function getWorkspace(workspaceId: string, userId: string): Promise<IWorkspace> {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    throw new AppError('Invalid workspace ID', 400);
  }

  const workspace = await Workspace.findById(workspaceId).populate('members.user', MEMBER_POPULATE);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const role = getMemberRole(workspace, userId);
  if (!role) throw new AppError('Workspace not found', 404);

  return workspace;
}

/** Updates workspace metadata. Only owner or admin can update. */
export async function updateWorkspace(
  workspaceId: string,
  userId: string,
  data: { name?: string; description?: string; color?: string },
): Promise<IWorkspace> {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    throw new AppError('Invalid workspace ID', 400);
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const role = getMemberRole(workspace, userId);
  if (!role) throw new AppError('Workspace not found', 404);
  if (role !== 'owner' && role !== 'admin') {
    throw new AppError('Only workspace owners or admins can update settings', 403);
  }

  const updateFields: Record<string, unknown> = {};
  if (data.name !== undefined) updateFields.name = data.name;
  if (data.description !== undefined) updateFields.description = data.description;
  if (data.color !== undefined) updateFields.color = data.color;

  const updated = await Workspace.findByIdAndUpdate(
    workspaceId,
    { $set: updateFields },
    { new: true, runValidators: true },
  ).populate('members.user', MEMBER_POPULATE);

  if (!updated) throw new AppError('Workspace not found', 404);
  return updated;
}

/** Deletes a workspace. Only the owner can delete. */
export async function deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    throw new AppError('Invalid workspace ID', 400);
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const role = getMemberRole(workspace, userId);
  if (!role) throw new AppError('Workspace not found', 404);
  if (role !== 'owner') {
    throw new AppError('Only the workspace owner can delete this workspace', 403);
  }

  // Clean up all sheets and user meta for this workspace before deleting it
  await deleteSheetsByWorkspace(workspaceId);
  await Workspace.findByIdAndDelete(workspaceId);
}

/** Adds a member to a workspace. Only owner/admin can add. */
export async function addMember(
  workspaceId: string,
  actorId: string,
  data: { userId: string; role: WorkspaceRole },
): Promise<IWorkspace> {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    throw new AppError('Invalid workspace ID', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(data.userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const actorRole = getMemberRole(workspace, actorId);
  if (!actorRole) throw new AppError('Workspace not found', 404);
  if (actorRole !== 'owner' && actorRole !== 'admin') {
    throw new AppError('Only workspace owners or admins can add members', 403);
  }

  // Check target user exists and is active
  const targetUser = await User.findById(data.userId).select('_id isActive');
  if (!targetUser || !targetUser.isActive) {
    throw new AppError('User not found or inactive', 404);
  }

  // Check not already a member
  const alreadyMember = workspace.members.some(
    (m) => getMemberId(m.user) === data.userId,
  );
  if (alreadyMember) {
    throw new AppError('User is already a member of this workspace', 409);
  }

  const updated = await Workspace.findByIdAndUpdate(
    workspaceId,
    { $push: { members: { user: new mongoose.Types.ObjectId(data.userId), role: data.role } } },
    { new: true, runValidators: true },
  ).populate('members.user', MEMBER_POPULATE);

  if (!updated) throw new AppError('Workspace not found', 404);
  return updated;
}

/** Removes a member from a workspace. Cannot remove owner. Owner/admin can remove others; any member can remove themselves. */
export async function removeMember(
  workspaceId: string,
  actorId: string,
  targetUserId: string,
): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    throw new AppError('Invalid workspace ID', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const actorRole = getMemberRole(workspace, actorId);
  if (!actorRole) throw new AppError('Workspace not found', 404);

  // Cannot remove the owner
  if (targetUserId === workspace.owner.toString()) {
    throw new AppError('Cannot remove the workspace owner', 403);
  }

  // Any member can remove themselves
  const isSelfRemoval = actorId === targetUserId;
  if (!isSelfRemoval && actorRole !== 'owner' && actorRole !== 'admin') {
    throw new AppError('Only workspace owners or admins can remove other members', 403);
  }

  // Verify target is actually a member
  const targetIsMember = workspace.members.some(
    (m) => getMemberId(m.user) === targetUserId,
  );
  if (!targetIsMember) {
    throw new AppError('User is not a member of this workspace', 404);
  }

  await Workspace.findByIdAndUpdate(workspaceId, {
    $pull: { members: { user: new mongoose.Types.ObjectId(targetUserId) } },
  });
}

/** Updates a member's role. Only owner/admin can change roles; cannot change owner's role. */
export async function updateMemberRole(
  workspaceId: string,
  actorId: string,
  targetUserId: string,
  role: WorkspaceRole,
): Promise<IWorkspace> {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    throw new AppError('Invalid workspace ID', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const actorRole = getMemberRole(workspace, actorId);
  if (!actorRole) throw new AppError('Workspace not found', 404);
  if (actorRole !== 'owner' && actorRole !== 'admin') {
    throw new AppError('Only workspace owners or admins can change member roles', 403);
  }

  // Cannot change owner's role
  if (targetUserId === workspace.owner.toString()) {
    throw new AppError('Cannot change the workspace owner\'s role', 403);
  }

  // Find the target member
  const memberIndex = workspace.members.findIndex(
    (m) => getMemberId(m.user) === targetUserId,
  );
  if (memberIndex === -1) {
    throw new AppError('User is not a member of this workspace', 404);
  }

  const updated = await Workspace.findOneAndUpdate(
    { _id: workspaceId, 'members.user': new mongoose.Types.ObjectId(targetUserId) },
    { $set: { 'members.$.role': role } },
    { new: true, runValidators: true },
  ).populate('members.user', MEMBER_POPULATE);

  if (!updated) throw new AppError('Workspace not found', 404);
  return updated;
}

/** Searches for active users not already members of the workspace. Returns max 10 results. */
export async function searchUsersToAdd(
  workspaceId: string,
  actorId: string,
  query: string,
): Promise<{ _id: string; fullName: string; email: string; orgRole?: string }[]> {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    throw new AppError('Invalid workspace ID', 400);
  }

  const workspace = await Workspace.findById(workspaceId).select('members');
  if (!workspace) throw new AppError('Workspace not found', 404);

  // Permission check: only owner or admin can search for members
  const actorRole = getMemberRole(workspace, actorId);
  if (!actorRole) throw new AppError('Workspace not found', 404);
  if (actorRole !== 'owner' && actorRole !== 'admin') {
    throw new AppError('You do not have permission to search members for this workspace', 403);
  }

  const memberIds = workspace.members.map((m) => getMemberId(m.user));
  const regex = new RegExp(escapeRegex(query), 'i');

  const users = await User.find({
    _id: { $nin: memberIds },
    isActive: true,
    $or: [
      { fullName: { $regex: regex } },
      { email: { $regex: regex } },
    ],
  })
    .select('_id fullName email orgRole')
    .limit(10);

  return users.map((u) => ({
    _id: u._id.toString(),
    fullName: u.fullName,
    email: u.email,
    orgRole: u.orgRole,
  }));
}

/** General user search with guest scoping. Guests only see users who share a workspace or sheet. */
export async function searchUsersGlobal(
  actorId: string,
  query: string,
): Promise<{ _id: string; fullName: string; email: string; orgRole: string }[]> {
  const regex = new RegExp(escapeRegex(query), 'i');
  const baseQuery = {
    isActive: true,
    $or: [
      { fullName: { $regex: regex } },
      { email: { $regex: regex } },
    ],
  };

  // Check if actor is a guest
  const actor = await User.findById(actorId).select('orgRole');
  const isGuest = actor?.orgRole === 'guest';

  if (isGuest) {
    // Guest: find users who share a workspace or sheet with the requester
    // Find workspaces the guest belongs to (should be none, but check anyway)
    const sharedWorkspaces = await Workspace.find({ 'members.user': new mongoose.Types.ObjectId(actorId) })
      .select('members');
    const wsUserIds = new Set<string>();
    for (const ws of sharedWorkspaces) {
      for (const m of ws.members) {
        wsUserIds.add(getMemberId(m.user));
      }
    }

    // Find sheets directly shared with the guest
    const Sheet = (await import('../models/Sheet')).default;
    const sharedSheets = await Sheet.find({ 'members.userId': new mongoose.Types.ObjectId(actorId) })
      .select('members workspaceId');
    
    // Also get workspace members from workspaces that contain shared sheets
    const sharedWsIds = [...new Set(sharedSheets.map(s => s.workspaceId.toString()))];
    if (sharedWsIds.length > 0) {
      const relatedWorkspaces = await Workspace.find({ _id: { $in: sharedWsIds } }).select('members');
      for (const ws of relatedWorkspaces) {
        for (const m of ws.members) {
          wsUserIds.add(getMemberId(m.user));
        }
      }
    }

    // Also add direct sheet co-members
    for (const sheet of sharedSheets) {
      for (const m of sheet.members) {
        wsUserIds.add(m.userId.toString());
      }
    }

    wsUserIds.delete(actorId); // exclude self

    const scopedQuery = {
      ...baseQuery,
      _id: { $in: [...wsUserIds].map(id => new mongoose.Types.ObjectId(id)) },
    };

    const users = await User.find(scopedQuery)
      .select('_id fullName email orgRole')
      .limit(10);

    return users.map((u) => ({
      _id: u._id.toString(),
      fullName: u.fullName,
      email: u.email,
      orgRole: u.orgRole,
    }));
  }

  // Non-guests: full directory search
  const users = await User.find(baseQuery)
    .select('_id fullName email orgRole')
    .limit(10);

  return users.map((u) => ({
    _id: u._id.toString(),
    fullName: u.fullName,
    email: u.email,
    orgRole: u.orgRole,
  }));
}
