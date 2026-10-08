import { Router } from 'express';
import { param, body } from 'express-validator';
import { requireAuth } from '../middleware/authMiddleware';
import { validate } from '../utils/validate';
import * as commentController from '../controllers/commentController';

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(requireAuth);

const mongoId = (field: string) =>
  param(field).isMongoId().withMessage(`Invalid ${field} ID`);

// GET /api/sheets/:sheetId/rows/:rowId/comments — list comments for a row
router.get(
  '/sheets/:sheetId/rows/:rowId/comments',
  validate([
    mongoId('sheetId'),
    mongoId('rowId'),
  ]),
  commentController.listCommentsHandler,
);

// POST /api/sheets/:sheetId/rows/:rowId/comments — create a comment
router.post(
  '/sheets/:sheetId/rows/:rowId/comments',
  validate([
    mongoId('sheetId'),
    mongoId('rowId'),
    body('body')
      .isString()
      .withMessage('body is required')
      .isLength({ min: 1, max: 5000 })
      .withMessage('body must be between 1 and 5000 characters'),
    body('parentId')
      .optional()
      .isString()
      .withMessage('parentId must be a string'),
  ]),
  commentController.createCommentHandler,
);

// PATCH /api/comments/:commentId — edit a comment
router.patch(
  '/comments/:commentId',
  validate([
    mongoId('commentId'),
    body('body')
      .isString()
      .withMessage('body is required')
      .isLength({ min: 1, max: 5000 })
      .withMessage('body must be between 1 and 5000 characters'),
  ]),
  commentController.editCommentHandler,
);

// DELETE /api/comments/:commentId — delete a comment
router.delete(
  '/comments/:commentId',
  validate([
    mongoId('commentId'),
  ]),
  commentController.deleteCommentHandler,
);

export default router;
