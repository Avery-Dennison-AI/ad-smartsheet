import { Router } from 'express';
import { param, query } from 'express-validator';
import { requireAuth } from '../middleware/authMiddleware';
import { validate } from '../utils/validate';
import * as activityController from '../controllers/activityController';

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(requireAuth);

const mongoId = (field: string) =>
  param(field).isMongoId().withMessage(`Invalid ${field} ID`);

// GET /api/sheets/:sheetId/activity — get sheet-level activity
router.get(
  '/activity',
  validate([
    mongoId('sheetId'),
    query('before').optional().isISO8601().withMessage('before must be a valid ISO 8601 timestamp'),
  ]),
  activityController.getSheetActivity,
);

// GET /api/sheets/:sheetId/rows/:rowId/activity — get row-level activity
router.get(
  '/rows/:rowId/activity',
  validate([
    mongoId('sheetId'),
    mongoId('rowId'),
    query('before').optional().isISO8601().withMessage('before must be a valid ISO 8601 timestamp'),
  ]),
  activityController.getRowActivity,
);

export default router;
