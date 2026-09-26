import User from '../models/User';
import { env } from './env';
import { hashPassword } from '../utils/password';

/**
 * Seeds an admin user from environment variables.
 * Skips silently if ADMIN_EMAIL, ADMIN_PASSWORD, or ADMIN_NAME are missing.
 * Does nothing if a user with that email already exists.
 * Returns a short descriptive status string.
 */
export async function seedAdmin(): Promise<string> {
  const email = env.ADMIN_EMAIL;
  const password = env.ADMIN_PASSWORD;
  const name = env.ADMIN_NAME;

  if (!email || !password || !name) {
    return 'missing env';
  }

  const existing = await User.findOne({ email: email.trim().toLowerCase() });
  if (existing) {
    return 'skipped';
  }

  const passwordHash = await hashPassword(password);
  await User.create({
    fullName: name,
    email: email.trim().toLowerCase(),
    passwordHash,
    role: 'admin',
    isActive: true,
  });

  return 'created';
}
