import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import * as activityService from '../services/activityService';

/**
 * GET /api/sheets/:sheetId/rows/:rowId/activity
 * Returns paginated activity log for a specific row.
 */
export const getRowActivity = asyncHandler(async (req: Request, res: Response) => {
  const { sheetId, rowId } = req.params;
  const userId = req.user!.id;
  const before = req.query.before as string | undefined;

  const result = await activityService.getRowActivity(sheetId, rowId, userId, { before });
  sendSuccess(res, result);
});

/**
 * GET /api/sheets/:sheetId/activity
 * Returns paginated activity log for an entire sheet.
 */
export const getSheetActivity = asyncHandler(async (req: Request, res: Response) => {
  const { sheetId } = req.params;
  const userId = req.user!.id;
  const before = req.query.before as string | undefined;

  const result = await activityService.getSheetActivity(sheetId, userId, { before });
  sendSuccess(res, result);
});
