import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { COOKIE_NAME } from '../config/cookies';
import User from '../models/User';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Reads the JWT from the httpOnly cookie (COOKIE_NAME).
 * Verifies the token, then loads the user from the database to get the
 * live role and isActive status. Responds with 401 if the user does not
 * exist or is deactivated. Sets req.user from the live DB record.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;

  if (!token) {
    next(new AppError('Authentication required', 401));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as {
      id: string;
      email: string;
      role: string;
    };

    // Load the user from DB to get live role and isActive status
    User.findById(payload.id)
      .select('_id role guestExpiresAt isActive')
      .then((user) => {
        if (!user || !user.isActive) {
          next(new AppError('Authentication required', 401));
          return;
        }

        // Check guest expiry
        if (user.role === 'guest' && user.guestExpiresAt && user.guestExpiresAt < new Date()) {
          next(new AppError('Guest access has expired', 401));
          return;
        }

        req.user = { id: user._id.toString(), email: payload.email, role: user.role };
        next();
      })
      .catch(() => {
        next(new AppError('Authentication required', 401));
      });
  } catch {
    next(new AppError('Authentication required', 401));
  }
}

/**
 * Factory that returns middleware requiring a specific role.
 * Calls requireAuth first, then checks req.user.role.
 */
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    requireAuth(req, res, () => {
      if (!req.user || req.user.role !== role) {
        next(new AppError('Forbidden', 403));
        return;
      }
      next();
    });
  };
}
