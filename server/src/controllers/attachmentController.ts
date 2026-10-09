import type { Request, Response } from 'express';
import fsp from 'fs/promises';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';
import * as attachmentService from '../services/attachmentService';
import { ALLOWED_TYPES, type FileCategory } from '../services/fileSecurity';
import { env } from '../config/env';

interface MulterDiskFile {
  path: string;
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

  const files = (req as any).files as MulterDiskFile[] | undefined;
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new AppError('No files provided', 400);
  }

  // Collect temp paths for cleanup in case uploadAttachments throws early
  const tempPaths = files.map((f) => f.path);

  try {
    const diskInputs = files.map((f) => ({
      tempPath: f.path,
      originalname: f.originalname,
      size: f.size,
      mimetype: f.mimetype,
    }));

    const attachments = await attachmentService.uploadAttachments(sheetId, rowId, userId, diskInputs);
    sendSuccess(res, attachments, 201);
  } finally {
    // Clean up any temp files that might remain if uploadAttachments threw
    // before reaching its own per-file cleanup
    for (const tp of tempPaths) {
      try { await fsp.unlink(tp); } catch { /* ignore ENOENT — already cleaned */ }
    }
  }
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
 * Sets safe download headers on the response and pipes the stream.
 */
function pipeAttachmentStream(
  res: Response,
  result: { stream: NodeJS.ReadableStream; contentType: string; originalName: string },
  disposition: 'attachment' | 'inline',
): void {
  // Sanitize filename for Content-Disposition header
  const safeName = result.originalName.replace(/"/g, '\\"');
  const encodedName = encodeURIComponent(result.originalName);

  res.setHeader('Content-Type', result.contentType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  res.setHeader('Cache-Control', 'no-store');

  if (disposition === 'attachment') {
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`,
    );
  } else {
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${safeName}"; filename*=UTF-8''${encodedName}`,
    );
  }

  const stream = result.stream;
  stream.pipe(res);
  stream.on('error', () => {
    if (!res.headersSent) {
      res.status(500).end();
    }
  });
}

/**
 * GET /api/attachments/:attachmentId/download
 * Download an attachment file by streaming it with safe headers.
 */
export const downloadHandler = asyncHandler(async (req: Request, res: Response) => {
  const { attachmentId } = req.params;
  const userId = req.user!.id;

  const result = await attachmentService.downloadAttachment(attachmentId, userId);
  pipeAttachmentStream(res, result, 'attachment');
});

/** Previewable content types — images and PDFs only. */
const PREVIEWABLE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
]);

/**
 * GET /api/attachments/:attachmentId/preview
 * Serve inline for images/PDFs; redirect to download for everything else.
 */
export const previewHandler = asyncHandler(async (req: Request, res: Response) => {
  const { attachmentId } = req.params;
  const userId = req.user!.id;

  const result = await attachmentService.downloadAttachment(attachmentId, userId);

  if (!PREVIEWABLE_TYPES.has(result.contentType)) {
    // Redirect to download endpoint for non-previewable types
    res.redirect(`/api/attachments/${attachmentId}/download`);
    return;
  }

  pipeAttachmentStream(res, result, 'inline');
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

/**
 * GET /api/attachments/config
 * Returns client-side validation config derived from the same ALLOWED_TYPES
 * registry and env vars used by fileSecurity.ts.
 */
export const configHandler = asyncHandler(async (_req: Request, res: Response) => {
  const allowedExtensions: string[] = [];
  const allowedMimeTypes: string[] = [];
  const seenMimes = new Set<string>();

  for (const entry of Object.values(ALLOWED_TYPES)) {
    for (const ext of entry.extensions) {
      if (!allowedExtensions.includes(ext)) {
        allowedExtensions.push(ext);
      }
    }
    for (const mime of entry.mimeTypes) {
      if (!seenMimes.has(mime)) {
        seenMimes.add(mime);
        allowedMimeTypes.push(mime);
      }
    }
  }

  const maxFileSizeMb: Record<FileCategory, number> = {
    image: env.MAX_IMAGE_SIZE_MB,
    document: env.MAX_DOC_SIZE_MB,
    text: env.MAX_TEXT_SIZE_MB,
    archive: env.MAX_ARCHIVE_SIZE_MB,
    email: env.MAX_EMAIL_SIZE_MB,
  };

  sendSuccess(res, {
    allowedExtensions,
    allowedMimeTypes,
    maxFileSizeMb,
    maxFilesPerUpload: env.MAX_FILES_PER_UPLOAD,
  });
});
