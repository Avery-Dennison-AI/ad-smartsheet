import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth } from '../middleware/authMiddleware';
import { validate } from '../utils/validate';
import * as sheetController from '../controllers/sheetController';
import * as projectSettingsController from '../controllers/projectSettingsController';

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

// ─── Project Settings routes ─────────────────────────────────────────────────

// GET /api/sheets/:sheetId/project/usage — get status/type usage counts
router.get(
  '/:sheetId/project/usage',
  validate([mongoId('sheetId')]),
  projectSettingsController.getUsageHandler,
);

// PATCH /api/sheets/:sheetId/project/statuses — update project statuses
const statusesSchema = [
  mongoId('sheetId'),
  body('statuses').isArray({ min: 1 }).withMessage('statuses must be a non-empty array'),
  body('statuses.*.name').isString().trim().isLength({ min: 1, max: 40 }).withMessage('Status name must be 1–40 characters'),
  body('statuses.*.color').isString().notEmpty().withMessage('Color is required'),
  body('statuses.*.category').isIn(['todo', 'in_progress', 'done']).withMessage('Category must be todo, in_progress, or done'),
  body('statuses.*.id').optional().isString(),
  body('replacements').optional().isObject(),
];

router.patch(
  '/:sheetId/project/statuses',
  validate(statusesSchema),
  projectSettingsController.updateStatusesHandler,
);

// PATCH /api/sheets/:sheetId/project/item-types — update project item types
const itemTypesSchema = [
  mongoId('sheetId'),
  body('itemTypes').isArray({ min: 1 }).withMessage('itemTypes must be a non-empty array'),
  body('itemTypes.*.name').isString().trim().isLength({ min: 1, max: 40 }).withMessage('Item type name must be 1–40 characters'),
  body('itemTypes.*.id').optional().isString(),
  body('replacements').optional().isObject(),
];

router.patch(
  '/:sheetId/project/item-types',
  validate(itemTypesSchema),
  projectSettingsController.updateItemTypesHandler,
);

export default router;
