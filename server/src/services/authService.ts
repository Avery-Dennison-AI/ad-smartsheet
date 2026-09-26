import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import User from '../models/User';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { verifyPassword } from '../utils/password';
import { COOKIE_NAME, cookieLoginOptions } from '../config/cookies';

// A dummy hash generated once at module load for timing-safe rejection.
// When no user is found or the user is inactive, we compare against this
// instead of skipping bcrypt.compare entirely, preventing timing attacks.
const DUMMY_HASH: string = await bcrypt.hash(
  'a1b2c4470002c467cfe3b0f7dummyhash',
  12,
);

interface LoginResult {
  user: { id: string; fullName: string; email: string; role: string };
  token: string;
}

/**
 * Authenticates a user by email + password.
 * Always runs bcrypt.compare (against real hash or DUMMY_HASH) to prevent
 * timing-based user enumeration.
 */
export async function loginUser(email: string, password: string, _ip?: string): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  // Use real hash if user exists and is active, otherwise use DUMMY_HASH
  const hashToCompare = user && user.isActive ? user.passwordHash : DUMMY_HASH;
  const match = await verifyPassword(password, hashToCompare);

  if (!match || !user || !user.isActive) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1d' },
  );

  // Update lastLoginAt
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
    token,
  };
}

/**
 * Creates a session for an already-verified user (e.g. after invitation acceptance).
 * Signs a JWT, sets the httpOnly cookie, and updates lastLoginAt.
 */
export async function createSessionForUser(user: typeof User.prototype, res: Response): Promise<void> {
  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1d' },
  );

  res.cookie(COOKIE_NAME, token, cookieLoginOptions);

  user.lastLoginAt = new Date();
  await user.save();
}

/**
 * Fetches the current user by ID, excluding passwordHash.
 * Throws 401 if not found.
 */
export async function getCurrentUser(userId: string) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new AppError('Authentication required', 401);
  }

  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  };
}
