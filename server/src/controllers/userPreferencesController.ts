import type { Request, Response, NextFunction } from 'express';
import User, { ACCENT_COLORS, type AccentColor } from '../models/User';
import { AppError } from '../utils/AppError';
import { sendSuccess } from '../utils/response';

/**
 * PATCH /api/user/preferences
 * Updates the authenticated user's preferences (currently only accentColor).
 */
export async function updatePreferences(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const { accentColor } = req.body as { accentColor?: string };

    if (accentColor !== undefined) {
      if (!ACCENT_COLORS.includes(accentColor as AccentColor)) {
        throw new AppError(
          `Invalid accent color. Must be one of: ${ACCENT_COLORS.join(', ')}`,
          400,
        );
      }
    }

    const updateFields: Record<string, unknown> = {};
    if (accentColor !== undefined) updateFields.accentColor = accentColor;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true },
    );

    if (!user || !user.isActive) {
      throw new AppError('User not found', 404);
    }

    sendSuccess(res, {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      accentColor: user.accentColor || 'avery',
    });
  } catch (err) {
    next(err);
  }
}
