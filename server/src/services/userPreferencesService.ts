import User, { ACCENT_COLORS } from '../models/User';
import { AppError } from '../utils/AppError';

/**
 * Updates the authenticated user's preferences and returns the updated profile shape.
 */
export async function updatePreferences(
  userId: string,
  patch: { accentColor?: string },
) {
  const updateFields: Record<string, unknown> = {};
  if (patch.accentColor !== undefined) {
    updateFields.accentColor = patch.accentColor;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { new: true, runValidators: true },
  );

  if (!user || !user.isActive) {
    throw new AppError('User not found', 404);
  }

  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    accentColor: user.accentColor || 'avery',
  };
}

/** Allowed accent color keys — shared between route validation and service logic. */
export const ACCENT_KEYS: string[] = [...ACCENT_COLORS];
