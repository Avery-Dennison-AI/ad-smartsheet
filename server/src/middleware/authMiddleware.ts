import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
 * Returns 401 if the cookie is missing or the token is invalid.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token as string | undefined;

  if (!token) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET!;
    const payload = jwt.verify(token, secret) as { sub: string; email: string; role: string };
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    res.status(401).json({ message: 'Authentication required' });
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
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
      next();
    });
  };
}
