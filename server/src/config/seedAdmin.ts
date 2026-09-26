import bcrypt from 'bcryptjs';
import User from '../models/User';

/**
 * Seeds an admin user from environment variables.
 * Skips silently if ADMIN_EMAIL, ADMIN_PASSWORD, or ADMIN_NAME are missing.
 * Does nothing if a user with that email already exists.
 */
export async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME;

  if (!email || !password || !name) {
    console.warn('Admin seeding skipped: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME env vars required');
    return;
  }

  const existing = await User.findOne({ email: email.trim().toLowerCase() });
  if (existing) {
    console.log(`[seed] Admin user ${email} already exists — skipping`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({
    fullName: name,
    email: email.trim().toLowerCase(),
    passwordHash,
    role: 'admin',
    isActive: true,
  });

  console.log(`[seed] Admin user ${email} created`);
}
