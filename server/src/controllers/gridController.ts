import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import * as gridService from '../services/gridService';

/** GET /api/sheets/:sheetId/grid */
export const getGrid = asyncHandler(async (req: Request, res: Response) => {
  const result = await gridService.getGrid(req.params.sheetId, req.user!.id);
  sendSuccess(res, result);
});

/** POST /api/sheets/:sheetId/grid/columns */
export const addColumn = asyncHandler(async (req: Request, res: Response) => {
  const { name, type, position, options } = req.body;
  const column = await gridService.addColumn(req.params.sheetId, req.user!.id, { name, type, position, options });
  sendSuccess(res, column, 201);
});

/** PATCH /api/sheets/:sheetId/grid/columns/:columnId */
export const updateColumn = asyncHandler(async (req: Request, res: Response) => {
  const { name, type, options } = req.body;
  const column = await gridService.updateColumn(req.params.sheetId, req.user!.id, req.params.columnId, { name, type, options });
  sendSuccess(res, column);
});

/** DELETE /api/sheets/:sheetId/grid/columns/:columnId */
export const deleteColumn = asyncHandler(async (req: Request, res: Response) => {
  const result = await gridService.deleteColumn(req.params.sheetId, req.user!.id, req.params.columnId);
  sendSuccess(res, result);
});

/** PATCH /api/sheets/:sheetId/grid/columns/reorder */
export const reorderColumns = asyncHandler(async (req: Request, res: Response) => {
  const { orderedIds } = req.body;
  const columns = await gridService.reorderColumns(req.params.sheetId, req.user!.id, orderedIds);
  sendSuccess(res, columns);
});

/** PATCH /api/sheets/:sheetId/grid/columns/:columnId/set-primary */
export const setPrimaryColumn = asyncHandler(async (req: Request, res: Response) => {
  const columns = await gridService.setPrimaryColumn(req.params.sheetId, req.user!.id, req.params.columnId);
  sendSuccess(res, columns);
});

/** POST /api/sheets/:sheetId/grid/rows */
export const addRow = asyncHandler(async (req: Request, res: Response) => {
  const { afterRowId, beforeRowId, cells } = req.body;
  const row = await gridService.addRow(req.params.sheetId, req.user!.id, { afterRowId, beforeRowId, cells });
  sendSuccess(res, row, 201);
});

/** PATCH /api/sheets/:sheetId/grid/rows/:rowId/cells/:columnId */
export const updateCell = asyncHandler(async (req: Request, res: Response) => {
  const { value } = req.body;
  const result = await gridService.updateCell(
    req.params.sheetId,
    req.user!.id,
    req.params.rowId,
    req.params.columnId,
    value,
  );
  sendSuccess(res, result);
});

/** DELETE /api/sheets/:sheetId/grid/rows */
export const deleteRows = asyncHandler(async (req: Request, res: Response) => {
  const { rowIds } = req.body;
  const result = await gridService.deleteRows(req.params.sheetId, req.user!.id, rowIds);
  sendSuccess(res, result);
});

/** PATCH /api/sheets/:sheetId/grid/rows/reorder */
export const reorderRows = asyncHandler(async (req: Request, res: Response) => {
  const { orderedIds } = req.body;
  const result = await gridService.reorderRows(req.params.sheetId, req.user!.id, orderedIds);
  sendSuccess(res, result);
});

/** PATCH /api/sheets/:sheetId/grid/formatting */
export const updateFormatting = asyncHandler(async (req: Request, res: Response) => {
  const { cells } = req.body;
  const result = await gridService.updateFormatting(req.params.sheetId, req.user!.id, cells);
  sendSuccess(res, result);
});

/** PATCH /api/sheets/:sheetId/grid/column-formatting */
export const updateColumnFormatting = asyncHandler(async (req: Request, res: Response) => {
  const { columns, cascadePatch } = req.body;
  const result = await gridService.updateColumnFormatting(req.params.sheetId, req.user!.id, columns, cascadePatch);
  sendSuccess(res, result);
});

/** PATCH /api/sheets/:sheetId/grid/columns/:columnId/width */
export const patchColumnWidth = asyncHandler(async (req: Request, res: Response) => {
  const { width } = req.body;
  const column = await gridService.updateColumnWidth(req.params.sheetId, req.user!.id, req.params.columnId, width);
  sendSuccess(res, column);
});

/** PATCH /api/sheets/:sheetId/grid/rows/heights */
export const patchRowHeights = asyncHandler(async (req: Request, res: Response) => {
  const { heights } = req.body;
  const result = await gridService.updateRowHeights(req.params.sheetId, req.user!.id, heights);
  sendSuccess(res, result);
});
