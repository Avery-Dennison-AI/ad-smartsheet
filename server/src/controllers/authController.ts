import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import * as authService from '../services/authService';
import { COOKIE_NAME, cookieLogoutOptions, setSessionCookie } from '../config/cookies';

/** POST /api/auth/login */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password, req.ip);

  setSessionCookie(res, result.token);
  sendSuccess(res, { user: result.user });
});

/** POST /api/auth/logout */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, cookieLogoutOptions);
  sendSuccess(res, { message: 'Logged out' });
});

/** GET /api/auth/me */
export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.id);
  sendSuccess(res, user);
});
