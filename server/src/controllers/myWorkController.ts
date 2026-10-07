import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import * as myWorkService from '../services/myWorkService';

/** GET /api/my-work — returns the current user's assigned work grouped by due date. */
export const getMyWork = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await myWorkService.getMyWork(userId);
  sendSuccess(res, result);
});
