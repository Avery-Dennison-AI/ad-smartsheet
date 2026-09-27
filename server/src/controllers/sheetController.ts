import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import * as sheetService from '../services/sheetService';

/** GET /api/workspaces/:workspaceId/sheets */
export const listSheets = asyncHandler(async (req: Request, res: Response) => {
  const sheets = await sheetService.listSheets(req.params.workspaceId, req.user!.id);
  sendSuccess(res, sheets);
});

/** POST /api/workspaces/:workspaceId/sheets */
export const createSheet = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  const sheet = await sheetService.createSheet(req.params.workspaceId, name, req.user!.id);
  sendSuccess(res, sheet, 201);
});

/** GET /api/sheets/:sheetId */
export const getSheet = asyncHandler(async (req: Request, res: Response) => {
  const sheet = await sheetService.getSheet(req.params.sheetId, req.user!.id);
  sendSuccess(res, sheet);
});

/** PATCH /api/sheets/:sheetId/rename — edit sheet details (name and/or description) */
export const renameSheet = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;
  const sheet = await sheetService.updateSheetDetails(req.params.sheetId, { name, description }, req.user!.id);
  sendSuccess(res, sheet);
});

/** POST /api/sheets/:sheetId/duplicate */
export const duplicateSheet = asyncHandler(async (req: Request, res: Response) => {
  const sheet = await sheetService.duplicateSheet(req.params.sheetId, req.user!.id);
  sendSuccess(res, sheet, 201);
});

/** DELETE /api/sheets/:sheetId */
export const deleteSheet = asyncHandler(async (req: Request, res: Response) => {
  const result = await sheetService.deleteSheet(req.params.sheetId, req.user!.id);
  sendSuccess(res, result);
});

/** GET /api/user/recents */
export const getRecents = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const recents = await sheetService.getRecents(req.user!.id, limit);
  sendSuccess(res, recents);
});

/** GET /api/user/favorites */
export const getFavorites = asyncHandler(async (req: Request, res: Response) => {
  const favorites = await sheetService.getFavorites(req.user!.id);
  sendSuccess(res, favorites);
});

/** POST /api/sheets/:sheetId/favorite */
export const setFavorite = asyncHandler(async (req: Request, res: Response) => {
  const { starred } = req.body;
  const result = await sheetService.setFavorite(req.params.sheetId, req.user!.id, starred);
  sendSuccess(res, result);
});
