import mongoose from 'mongoose';
import User from '../models/User';
import type { UserRole } from '../models/User';
import Workspace from '../models/Workspace';
import Sheet from '../models/Sheet';
import UserSheetMeta from '../models/UserSheetMeta';
import Invitation from '../models/Invitation';
import { AppError } from '../utils/AppError';
import { escapeRegex } from '../utils/escapeRegex';

export async function listUsers(params: {
  search?: string;
  status?: 'active' | 'deactivated' | 'deleted' | 'all';
  page: number;
  limit: number;
}) {
  const { search, status = 'all', page, limit } = params;
  const query: Record<string, unknown> = {};

  if (search) {
    const escaped = escapeRegex(search);
    query.$or = [
      { fullName: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
    ];
  }

  if (status === 'active') {
    query.isActive = true;
    query.isDeleted = { $ne: true };
  } else if (status === 'deactivated') {
    query.isActive = false;
    query.isDeleted = { $ne: true };
  } else if (status === 'deleted') {
    query.isDeleted = true;
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('_id fullName email deletedEmail role guestExpiresAt isActive isDeleted deletedAt lastLoginAt createdAt')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    users: users.map((u) => ({
      id: u._id,
      fullName: u.fullName,
      // Show original email for deleted users (display purposes)
      email: u.isDeleted && u.deletedEmail ? u.deletedEmail : u.email,
      role: u.role,
      guestExpiresAt: u.guestExpiresAt || null,
      isActive: u.isActive,
      isDeleted: u.isDeleted,
      deletedAt: u.deletedAt,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateUser(
  targetId: string,
  requesterId: mongoose.Types.ObjectId,
  data: { role?: UserRole; guestExpiresAt?: Date | null; isActive?: boolean },
) {
  if (targetId === requesterId.toString()) {
    if (data.isActive === false) throw new AppError('You cannot deactivate your own account', 400);
    if (data.role) throw new AppError('You cannot change your own role', 400);
  }

  // Guard: at least one active admin must remain
  if (data.role && data.role !== 'admin' || data.isActive === false) {
    const target = await User.findById(targetId).select('role isActive');
    if (!target) throw new AppError('User not found', 404);

    if (target.role === 'admin') {
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true, isDeleted: { $ne: true } });
      if (activeAdminCount <= 1) {
        throw new AppError(
          'Cannot perform this action: the system must always have at least one active admin',
          400,
        );
      }
    }
  }

  // Build update object
  const updates: Record<string, unknown> = {};
  if (data.role !== undefined) updates.role = data.role;
  if (data.isActive !== undefined) updates.isActive = data.isActive;
  if (data.guestExpiresAt !== undefined) {
    updates.guestExpiresAt = data.guestExpiresAt || undefined;
  }

  // Clear guestExpiresAt when switching away from guest
  if (data.role && data.role !== 'guest') {
    updates.guestExpiresAt = undefined;
  }

  const user = await User.findByIdAndUpdate(targetId, { $set: updates }, { new: true, runValidators: true }).select(
    '_id fullName email role guestExpiresAt isActive isDeleted deletedAt lastLoginAt createdAt',
  );

  if (!user) throw new AppError('User not found', 404);

  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    guestExpiresAt: user.guestExpiresAt || null,
    isActive: user.isActive,
    isDeleted: user.isDeleted,
    deletedAt: user.deletedAt,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

/**
 * Returns workspaces owned by a given user.
 */
export async function getUserOwnedWorkspaces(userId: string): Promise<Array<{ _id: string; name: string }>> {
  const workspaces = await Workspace.find({ owner: userId }).select('_id name');
  return workspaces.map((w) => ({ _id: w._id.toString(), name: w.name }));
}

/**
 * Pure validation function for delete user guards.
 * Extracted for testability without DB calls.
 */
export function validateDeleteUser(
  target: { id: string; role: string; isDeleted: boolean; email: string },
  requesterId: string,
  activeAdminCount: number,
  ownedWorkspaces: Array<{ _id: string; name: string }>,
  transferTarget?: { id: string; role: string; isActive: boolean; isDeleted: boolean } | null,
  transferToUserId?: string,
): void {
  // Self-delete blocked
  if (target.id === requesterId) {
    throw new AppError('You cannot delete your own account', 403);
  }

  // Already deleted
  if (target.isDeleted) {
    throw new AppError('User is already deleted', 400);
  }

  // Last active admin blocked
  if (target.role === 'admin' && activeAdminCount <= 1) {
    throw new AppError('Cannot delete the last active admin', 403);
  }

  // Ownership transfer required if user owns workspaces
  if (ownedWorkspaces.length > 0) {
    if (!transferToUserId) {
      throw new AppError('Ownership transfer is required: user owns workspaces', 400);
    }

    // Transfer target validation
    if (!transferTarget) {
      throw new AppError('Transfer target user not found', 400);
    }

    if (!transferTarget.isActive || transferTarget.isDeleted) {
      throw new AppError('Transfer target must be an active, non-deleted user', 400);
    }

    if (transferTarget.role === 'guest') {
      throw new AppError('Transfer target cannot be a guest', 400);
    }
  }
}

/**
 * Soft-delete a user with ownership transfer support.
 *
 * Ordering guarantees (BUG 3):
 *   1. Validate everything first (validateDeleteUser).
 *   2. Transfer workspace ownership atomically per workspace (BUG 1).
 *   3. Remove from all other workspace memberships.
 *   4. Remove from all sheet memberships.
 *   5. Clear favorites and recents.
 *   6. Revoke pending invitations.
 *   7. Mark user deleted and free the email (BUG 2) — LAST step so partial
 *      failures leave the user still active and re-triggerable.
 */
export async function deleteUser(
  targetUserId: string,
  requesterId: string,
  transferToUserId?: string,
): Promise<{ success: true }> {
  // ── Step 1: Fetch & validate ──────────────────────────────────────────────
  const target = await User.findById(targetUserId).select('_id role isDeleted email isActive fullName');
  if (!target) throw new AppError('User not found', 404);

  const activeAdminCount = await User.countDocuments({
    role: 'admin',
    isActive: true,
    isDeleted: { $ne: true },
  });

  const ownedWorkspaces = await getUserOwnedWorkspaces(targetUserId);

  let transferTarget = null;
  if (transferToUserId) {
    const tt = await User.findById(transferToUserId).select('_id role isActive isDeleted');
    if (tt) {
      transferTarget = {
        id: tt._id.toString(),
        role: tt.role,
        isActive: tt.isActive,
        isDeleted: tt.isDeleted,
      };
    }
  }

  validateDeleteUser(
    {
      id: target._id.toString(),
      role: target.role,
      isDeleted: target.isDeleted,
      email: target.email,
    },
    requesterId,
    activeAdminCount,
    ownedWorkspaces,
    transferTarget,
    transferToUserId,
  );

  // ── Step 2: Transfer workspace ownership (atomic per workspace) ───────────
  if (ownedWorkspaces.length > 0 && transferToUserId) {
    const deletedOid = new mongoose.Types.ObjectId(targetUserId);
    const transferOid = new mongoose.Types.ObjectId(transferToUserId);

    for (const ws of ownedWorkspaces) {
      // Atomic single-operation: remove deleted user's member entry,
      // remove any existing entry for the transfer target (avoid duplicates),
      // push fresh owner entry, set owner field.
      await Workspace.findOneAndUpdate(
        { _id: ws._id },
        [
          // Stage 1: filter out both old entries
          {
            $set: {
              members: {
                $filter: {
                  input: '$members',
                  cond: {
                    $and: [
                      { $ne: ['$$this.user', deletedOid] },
                      { $ne: ['$$this.user', transferOid] },
                    ],
                  },
                },
              },
            },
          },
          // Stage 2: push the new owner entry and set owner field
          {
            $set: {
              owner: transferOid,
              members: {
                $concatArrays: [
                  '$members',
                  [{ user: transferOid, role: 'owner' }],
                ],
              },
            },
          },
        ],
      );
    }
  }

  // ── Step 3: Remove from all remaining workspace memberships ───────────────
  await Workspace.updateMany({}, { $pull: { members: { user: targetUserId } } });

  // ── Step 4: Remove from all sheet memberships ─────────────────────────────
  await Sheet.updateMany({}, { $pull: { members: { userId: targetUserId } } });

  // ── Step 5: Clear favorites and recents ───────────────────────────────────
  await UserSheetMeta.deleteMany({ userId: targetUserId });

  // ── Step 6: Revoke pending invitations ────────────────────────────────────
  await Invitation.updateMany(
    { email: target.email, status: 'pending' },
    { $set: { status: 'revoked' } },
  );

  // ── Step 7: Mark user deleted and free the email (LAST) ───────────────────
  const originalEmail = target.email;
  await User.findByIdAndUpdate(targetUserId, {
    $set: {
      deletedEmail: originalEmail,
      email: `deleted+${target._id.toString()}@neo.invalid`,
      isDeleted: true,
      isActive: false,
      deletedAt: new Date(),
    },
  });

  return { success: true };
}
