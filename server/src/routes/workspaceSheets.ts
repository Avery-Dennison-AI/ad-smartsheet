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

// ─── Workspace-scoped sheet routes ──────────────────────────────────────────

// GET /api/workspaces/:workspaceId/sheets — list sheets in workspace
router.get(
  '/:workspaceId/sheets',
  validate([mongoId('workspaceId')]),
  sheetController.listSheets,
);

// POST /api/workspaces/:workspaceId/sheets — create a new sheet
router.post(
  '/:workspaceId/sheets',
  validate([
    mongoId('workspaceId'),
    body('name')
      .trim()
      .notEmpty().withMessage('Sheet name is required')
      .isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
  ]),
  sheetController.createSheet,
);

export default router;
