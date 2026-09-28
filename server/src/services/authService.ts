import jwt from 'jsonwebtoken';
import User from '../models/User';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { hashPassword, verifyPassword } from '../utils/password';

// Lazy-initialised dummy hash for timing-safe rejection.
// When no user is found or the user is inactive, we compare against this
// instead of skipping bcrypt.compare entirely, preventing timing attacks.
let _dummyHashPromise: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  if (!_dummyHashPromise) {
    _dummyHashPromise = hashPassword('__dummy_password_that_never_matches__');
  }
  return _dummyHashPromise;
}

interface LoginResult {
  user: { id: string; fullName: string; email: string; role: string; accentColor: string };
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

  // Use real hash if user exists and is active, otherwise use lazy dummy hash
  const hashToCompare = user && user.isActive ? user.passwordHash : await getDummyHash();
  const match = await verifyPassword(password, hashToCompare);

  if (!match || !user || !user.isActive) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = createSessionToken(user);

  // Update lastLoginAt
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      accentColor: user.accentColor || 'avery',
    },
    token,
  };
}

/**
 * Creates a session token for an already-verified user (e.g. after invitation acceptance).
 * Signs a JWT and updates lastLoginAt. Returns the token string.
 */
export async function createSessionForUser(user: typeof User.prototype): Promise<string> {
  const token = createSessionToken(user);

  user.lastLoginAt = new Date();
  await user.save();

  return token;
}

/**
 * Signs a JWT for the given user document.
 */
function createSessionToken(user: typeof User.prototype): string {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1d' },
  );
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
    accentColor: user.accentColor || 'avery',
  };
}
