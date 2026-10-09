import { Router } from 'express';
import { param } from 'express-validator';
import multer from 'multer';
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

// Multer memory storage with limits from env
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: env.MAX_FILES_PER_UPLOAD,
  },
});

// Upload rate limiter: 20 uploads per user per minute
const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many upload requests. Please try again later.',
});

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

// DELETE /api/attachments/:attachmentId — delete an attachment
router.delete(
  '/attachments/:attachmentId',
  validate([
    mongoId('attachmentId'),
  ]),
  attachmentController.deleteHandler,
);

export default router;
