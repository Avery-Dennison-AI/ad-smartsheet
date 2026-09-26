import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

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
 * Reads the JWT from the `token` httpOnly cookie.
 * Attaches { id, email, role } to req.user on success.
 * Forwards AppError(401) to the global error handler on failure.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.token as string | undefined;

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
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
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
