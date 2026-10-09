import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';
import * as attachmentService from '../services/attachmentService';

interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/**
 * POST /api/sheets/:sheetId/rows/:rowId/attachments
 * Upload one or more files as attachments to a row.
 */
export const uploadHandler = asyncHandler(async (req: Request, res: Response) => {
  const { sheetId, rowId } = req.params;
  const userId = req.user!.id;

  const files = (req as any).files as MulterFile[] | undefined;
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new AppError('No files provided', 400);
  }

  const uploadInputs = files.map((f) => ({
    buffer: f.buffer,
    originalname: f.originalname,
    mimetype: f.mimetype,
    size: f.size,
  }));

  const attachments = await attachmentService.uploadAttachments(sheetId, rowId, userId, uploadInputs);
  sendSuccess(res, attachments, 201);
});

/**
 * GET /api/sheets/:sheetId/rows/:rowId/attachments
 * List all non-deleted attachments for a row.
 */
export const listHandler = asyncHandler(async (req: Request, res: Response) => {
  const { sheetId, rowId } = req.params;
  const userId = req.user!.id;

  const attachments = await attachmentService.listAttachments(sheetId, rowId, userId);
  sendSuccess(res, attachments);
});

/**
 * GET /api/attachments/:attachmentId/download
 * Download an attachment file by streaming it.
 */
export const downloadHandler = asyncHandler(async (req: Request, res: Response) => {
  const { attachmentId } = req.params;
  const userId = req.user!.id;

  const result = await attachmentService.downloadAttachment(attachmentId, userId);

  // Sanitize filename for Content-Disposition header
  const safeName = result.originalName.replace(/"/g, '\\"');
  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);

  const stream = result.stream;
  stream.pipe(res);
  stream.on('error', () => {
    if (!res.headersSent) {
      res.status(500).end();
    }
  });
});

/**
 * DELETE /api/attachments/:attachmentId
 * Soft-delete an attachment. Uploader or sheet admin+.
 */
export const deleteHandler = asyncHandler(async (req: Request, res: Response) => {
  const { attachmentId } = req.params;
  const userId = req.user!.id;

  await attachmentService.deleteAttachment(attachmentId, userId);
  sendSuccess(res, { deleted: true });
});
