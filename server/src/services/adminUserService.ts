import mongoose from 'mongoose';
import User from '../models/User';
import { AppError } from '../utils/AppError';

export async function listUsers(params: {
  search?: string;
  status?: 'active' | 'deactivated' | 'all';
  page: number;
  limit: number;
}) {
  const { search, status = 'all', page, limit } = params;
  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (status === 'active') query.isActive = true;
  else if (status === 'deactivated') query.isActive = false;

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('_id fullName email role isActive lastLoginAt createdAt')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    users: users.map((u) => ({
      id: u._id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
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
  data: { role?: 'admin' | 'member'; isActive?: boolean },
) {
  if (targetId === requesterId.toString()) {
    if (data.isActive === false) throw new AppError('You cannot deactivate your own account', 400);
    if (data.role) throw new AppError('You cannot change your own role', 400);
  }

  // Guard: at least one active admin must remain
  if (data.role === 'member' || data.isActive === false) {
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

  const user = await User.findByIdAndUpdate(targetId, data, { new: true }).select(
    '_id fullName email role isActive lastLoginAt createdAt',
  );

  if (!user) throw new AppError('User not found', 404);

  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}
