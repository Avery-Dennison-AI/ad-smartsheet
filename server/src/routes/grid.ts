import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth } from '../middleware/authMiddleware';
import { validate } from '../utils/validate';
import * as gridController from '../controllers/gridController';

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(requireAuth);

const mongoId = (field: string) =>
  param(field).isMongoId().withMessage(`Invalid ${field} ID`);

// ─── Grid endpoints ──────────────────────────────────────────────────────

// GET /api/sheets/:sheetId/grid — get columns + rows
router.get(
  '/',
  validate([mongoId('sheetId')]),
  gridController.getGrid,
);

// POST /api/sheets/:sheetId/grid/columns — add column
router.post(
  '/columns',
  validate([
    mongoId('sheetId'),
    body('name')
      .trim()
      .notEmpty().withMessage('Column name is required')
      .isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('type')
      .isIn(['text', 'number', 'date', 'dropdown', 'checkbox', 'contact'])
      .withMessage('Invalid column type'),
    body('position').optional().isInt({ min: 0 }).withMessage('Position must be a non-negative integer'),
  ]),
  gridController.addColumn,
);

// PATCH /api/sheets/:sheetId/grid/columns/reorder — reorder columns
// MUST be registered BEFORE /columns/:columnId to avoid "reorder" being treated as a columnId
router.patch(
  '/columns/reorder',
  validate([
    mongoId('sheetId'),
    body('orderedIds').isArray({ min: 1 }).withMessage('orderedIds must be a non-empty array'),
  ]),
  gridController.reorderColumns,
);

// PATCH /api/sheets/:sheetId/grid/columns/:columnId/set-primary — set primary column
// MUST be registered BEFORE /columns/:columnId to avoid "set-primary" being swallowed
router.patch(
  '/columns/:columnId/set-primary',
  validate([
    mongoId('sheetId'),
    param('columnId').notEmpty().withMessage('Column ID is required'),
  ]),
  gridController.setPrimaryColumn,
);

// PATCH /api/sheets/:sheetId/grid/columns/:columnId — update column
router.patch(
  '/columns/:columnId',
  validate([
    mongoId('sheetId'),
    param('columnId').notEmpty().withMessage('Column ID is required'),
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('type').optional().isIn(['text', 'number', 'date', 'dropdown', 'checkbox', 'contact']),
  ]),
  gridController.updateColumn,
);

// DELETE /api/sheets/:sheetId/grid/columns/:columnId — delete column
router.delete(
  '/columns/:columnId',
  validate([
    mongoId('sheetId'),
    param('columnId').notEmpty().withMessage('Column ID is required'),
  ]),
  gridController.deleteColumn,
);

// POST /api/sheets/:sheetId/grid/rows — add row
router.post(
  '/rows',
  validate([mongoId('sheetId')]),
  gridController.addRow,
);

// PATCH /api/sheets/:sheetId/grid/formatting — update cell formatting
// MUST be registered BEFORE /rows/:rowId to avoid "formatting" being treated as a rowId
router.patch(
  '/formatting',
  validate([
    mongoId('sheetId'),
    body('cells').isArray({ min: 1 }).withMessage('cells must be a non-empty array'),
  ]),
  gridController.updateFormatting,
);

// PATCH /api/sheets/:sheetId/grid/rows/reorder — reorder rows
// MUST be registered BEFORE /rows/:rowId to avoid "reorder" being treated as a rowId
router.patch(
  '/rows/reorder',
  validate([
    mongoId('sheetId'),
    body('orderedIds').isArray({ min: 1 }).withMessage('orderedIds must be a non-empty array'),
  ]),
  gridController.reorderRows,
);

// DELETE /api/sheets/:sheetId/grid/rows — delete rows (bulk)
router.delete(
  '/rows',
  validate([
    mongoId('sheetId'),
    body('rowIds').isArray({ min: 1 }).withMessage('rowIds must be a non-empty array'),
  ]),
  gridController.deleteRows,
);

// PATCH /api/sheets/:sheetId/grid/rows/:rowId/cells/:columnId — update cell
router.patch(
  '/rows/:rowId/cells/:columnId',
  validate([
    mongoId('sheetId'),
    mongoId('rowId'),
    param('columnId').notEmpty().withMessage('Column ID is required'),
  ]),
  gridController.updateCell,
);

export default router;
