import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import * as userPreferencesService from '../services/userPreferencesService';

/** PATCH /api/user/preferences */
export const updatePreferences = asyncHandler(async (req: Request, res: Response) => {
  const result = await userPreferencesService.updatePreferences(req.user!.id, req.body);
  sendSuccess(res, result);
});
