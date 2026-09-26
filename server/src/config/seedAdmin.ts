import User from '../models/User';
import { env } from './env';
import { hashPassword } from '../utils/password';

/**
 * Seeds an admin user from environment variables.
 * Skips silently if ADMIN_EMAIL, ADMIN_PASSWORD, or ADMIN_NAME are missing.
 * Does nothing if a user with that email already exists.
 */
export async function seedAdmin(): Promise<void> {
  const email = env.ADMIN_EMAIL;
  const password = env.ADMIN_PASSWORD;
  const name = env.ADMIN_NAME;

  if (!email || !password || !name) {
    console.log('[seed] ADMIN_EMAIL, ADMIN_PASSWORD, or ADMIN_NAME not set — skipping admin seed');
    return;
  }

  const existing = await User.findOne({ email: email.trim().toLowerCase() });
  if (existing) {
    console.log('[seed] Admin user already exists, skipping');
    return;
  }

  const passwordHash = await hashPassword(password);
  await User.create({
    fullName: name,
    email: email.trim().toLowerCase(),
    passwordHash,
    role: 'admin',
    isActive: true,
  });

  console.log('[seed] Admin user created');
}
