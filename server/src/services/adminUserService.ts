import mongoose from 'mongoose';
import User from '../models/User';
import type { UserRole } from '../models/User';
import { AppError } from '../utils/AppError';
import { escapeRegex } from '../utils/escapeRegex';

export async function listUsers(params: {
  search?: string;
  status?: 'active' | 'deactivated' | 'all';
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

  if (status === 'active') query.isActive = true;
  else if (status === 'deactivated') query.isActive = false;

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('_id fullName email role guestExpiresAt isActive lastLoginAt createdAt')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    users: users.map((u) => ({
      id: u._id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      guestExpiresAt: u.guestExpiresAt || null,
      isActive: u.isActive,
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
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
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
    '_id fullName email role guestExpiresAt isActive lastLoginAt createdAt',
  );

  if (!user) throw new AppError('User not found', 404);

  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    guestExpiresAt: user.guestExpiresAt || null,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}
