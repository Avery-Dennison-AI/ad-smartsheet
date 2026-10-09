import { Router } from 'express';
import { param } from 'express-validator';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { requireAuth } from '../middleware/authMiddleware';
import { validate } from '../utils/validate';
import { createRateLimiter } from '../middleware/rateLimiter';
import { env } from '../config/env';
import * as attachmentController from '../controllers/attachmentController';

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(requireAuth);

const mongoId = (field: string) =>
  param(field).isMongoId().withMessage(`Invalid ${field} ID`);

// ─── Multer disk storage ────────────────────────────────────────────────────

// Use a tmp sub-directory under os.tmpdir() for upload staging.
// Files are written here by multer, validated, then streamed to final storage.
const UPLOAD_TMP_DIR = path.join(os.tmpdir(), 'upload-staging');
fs.mkdirSync(UPLOAD_TMP_DIR, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_TMP_DIR),
  filename: (_req, _file, cb) => {
    // Random UUID filename so originals never touch disk with their real name
    cb(null, `${crypto.randomUUID()}`);
  },
});

const upload = multer({
  storage: diskStorage,
  limits: {
    fileSize: env.MAX_REQUEST_SIZE_MB * 1024 * 1024,
    files: env.MAX_FILES_PER_UPLOAD,
  },
});

// Upload rate limiter: 20 uploads per user per minute
const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many upload requests. Please try again later.',
});

// GET /api/attachments/config — client-side validation config
router.get(
  '/attachments/config',
  attachmentController.configHandler,
);

// POST /api/sheets/:sheetId/rows/:rowId/attachments — upload files
router.post(
  '/sheets/:sheetId/rows/:rowId/attachments',
  uploadRateLimiter,
  validate([
    mongoId('sheetId'),
    mongoId('rowId'),
  ]),
  upload.array('files', env.MAX_FILES_PER_UPLOAD),
  attachmentController.uploadHandler,
);

// GET /api/sheets/:sheetId/rows/:rowId/attachments — list attachments
router.get(
  '/sheets/:sheetId/rows/:rowId/attachments',
  validate([
    mongoId('sheetId'),
    mongoId('rowId'),
  ]),
  attachmentController.listHandler,
);

// GET /api/attachments/:attachmentId/download — download a file
router.get(
  '/attachments/:attachmentId/download',
  validate([
    mongoId('attachmentId'),
  ]),
  attachmentController.downloadHandler,
);

// GET /api/attachments/:attachmentId/preview — preview (inline) for images/PDFs
router.get(
  '/attachments/:attachmentId/preview',
  validate([
    mongoId('attachmentId'),
  ]),
  attachmentController.previewHandler,
);

// DELETE /api/attachments/:attachmentId — delete an attachment
router.delete(
  '/attachments/:attachmentId',
  validate([
    mongoId('attachmentId'),
  ]),
  attachmentController.deleteHandler,
);

export default router;
