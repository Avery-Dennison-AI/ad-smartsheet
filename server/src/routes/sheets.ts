import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth } from '../middleware/authMiddleware';
import { validate } from '../utils/validate';
import * as sheetController from '../controllers/sheetController';

const router = Router();

// All routes require authentication
router.use(requireAuth);

const mongoId = (field: string) =>
  param(field).isMongoId().withMessage(`Invalid ${field} ID`);

// ─── Individual sheet routes ────────────────────────────────────────────────

// GET /api/sheets/:sheetId — get a single sheet
router.get(
  '/:sheetId',
  validate([mongoId('sheetId')]),
  sheetController.getSheet,
);

// PATCH /api/sheets/:sheetId/rename — edit sheet details (name and/or description)
router.patch(
  '/:sheetId/rename',
  validate([
    mongoId('sheetId'),
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('description').optional().trim().isLength({ max: 300 }).withMessage('Description must be at most 300 characters'),
  ]),
  sheetController.renameSheet,
);

// POST /api/sheets/:sheetId/duplicate — duplicate a sheet
router.post(
  '/:sheetId/duplicate',
  validate([mongoId('sheetId')]),
  sheetController.duplicateSheet,
);

// DELETE /api/sheets/:sheetId — delete a sheet
router.delete(
  '/:sheetId',
  validate([mongoId('sheetId')]),
  sheetController.deleteSheet,
);

// POST /api/sheets/:sheetId/favorite — set favorite status
router.post(
  '/:sheetId/favorite',
  validate([
    mongoId('sheetId'),
    body('starred').isBoolean().withMessage('starred must be a boolean'),
  ]),
  sheetController.setFavorite,
);

export default router;
