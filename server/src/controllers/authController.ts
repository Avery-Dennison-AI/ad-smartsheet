import type { Request, Response } from 'express';
import { env } from '../config/env';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import * as authService from '../services/authService';

const COOKIE_OPTIONS = {
  httpOnly: true as const,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  maxAge: 24 * 60 * 60 * 1000, // 1 day in ms
};

/** POST /api/auth/login */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password, req.ip);

  res.cookie('token', result.token, COOKIE_OPTIONS);
  sendSuccess(res, { user: result.user });
});

/** POST /api/auth/logout */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  const clearOptions = authService.logoutUser();
  res.clearCookie('token', clearOptions);
  sendSuccess(res, { message: 'Logged out' });
});

/** GET /api/auth/me */
export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.id);
  sendSuccess(res, user);
});
