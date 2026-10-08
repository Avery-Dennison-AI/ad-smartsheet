import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { getProjectUsage, updateStatuses, updateItemTypes } from '../services/projectSettingsService';

export const getUsageHandler = asyncHandler(async (req: Request, res: Response) => {
  const { sheetId } = req.params;
  const userId = req.user!.id;
  const usage = await getProjectUsage(sheetId, userId);
  sendSuccess(res, usage);
});

export const updateStatusesHandler = asyncHandler(async (req: Request, res: Response) => {
  const { sheetId } = req.params;
  const userId = req.user!.id;
  const sheet = await updateStatuses(sheetId, userId, req.body);
  sendSuccess(res, sheet.toObject());
});

export const updateItemTypesHandler = asyncHandler(async (req: Request, res: Response) => {
  const { sheetId } = req.params;
  const userId = req.user!.id;
  const sheet = await updateItemTypes(sheetId, userId, req.body);
  sendSuccess(res, sheet.toObject());
});
