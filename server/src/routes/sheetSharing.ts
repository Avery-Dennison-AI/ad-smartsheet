import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth } from '../middleware/authMiddleware';
import { validate } from '../utils/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import * as sheetSharingService from '../services/sheetSharingService';
import type { Request, Response } from 'express';

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(requireAuth);

const mongoId = (field: string) =>
  param(field).isMongoId().withMessage(`Invalid ${field} ID`);

// GET /api/sheets/:sheetId/members — get direct + workspace members
router.get(
  '/',
  validate([mongoId('sheetId')]),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await sheetSharingService.getSheetMembers(req.params.sheetId, req.user!.id);
    sendSuccess(res, result);
  }),
);

// POST /api/sheets/:sheetId/members — add or update a direct share
router.post(
  '/',
  validate([
    mongoId('sheetId'),
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('role')
      .isIn(['viewer', 'editor', 'admin'])
      .withMessage('Role must be viewer, editor, or admin'),
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await sheetSharingService.addOrUpdateSheetMember(
      req.params.sheetId,
      req.user!.id,
      { userId: req.body.userId, role: req.body.role },
    );
    sendSuccess(res, result);
  }),
);

// PATCH /api/sheets/:sheetId/members/:userId — update a member's role
router.patch(
  '/:userId',
  validate([
    mongoId('sheetId'),
    mongoId('userId'),
    body('role')
      .isIn(['viewer', 'editor', 'admin'])
      .withMessage('Role must be viewer, editor, or admin'),
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await sheetSharingService.updateSheetMemberRole(
      req.params.sheetId,
      req.user!.id,
      req.params.userId,
      req.body.role,
    );
    sendSuccess(res, result);
  }),
);

// DELETE /api/sheets/:sheetId/members/:userId — remove a direct share
router.delete(
  '/:userId',
  validate([
    mongoId('sheetId'),
    mongoId('userId'),
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await sheetSharingService.removeSheetMember(
      req.params.sheetId,
      req.user!.id,
      req.params.userId,
    );
    sendSuccess(res, result);
  }),
);

export default router;
