import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { requireAuth } from '../middleware/authMiddleware';
import { validate } from '../utils/validate';
import { WORKSPACE_COLORS } from '../models/Workspace';
import * as workspaceController from '../controllers/workspaceController';

const router = Router();

// All routes require authentication
router.use(requireAuth);

const mongoId = (field: string) =>
  param(field).isMongoId().withMessage(`Invalid ${field} ID`);

// POST /api/workspaces — create a new workspace
router.post(
  '/',
  validate([
    body('name')
      .trim()
      .notEmpty().withMessage('Workspace name is required')
      .isLength({ max: 60 }).withMessage('Name must be at most 60 characters'),
    body('color')
      .isIn(WORKSPACE_COLORS).withMessage('Invalid color value'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 300 }).withMessage('Description must be at most 300 characters'),
  ]),
  workspaceController.createWorkspace,
);

// GET /api/workspaces — list user's workspaces
router.get('/', workspaceController.listWorkspaces);

// GET /api/workspaces/:id — get single workspace
router.get(
  '/:id',
  validate([mongoId('id')]),
  workspaceController.getWorkspace,
);

// PATCH /api/workspaces/:id — update workspace
router.patch(
  '/:id',
  validate([
    mongoId('id'),
    body('name')
      .optional()
      .trim()
      .notEmpty().withMessage('Name cannot be empty')
      .isLength({ max: 60 }).withMessage('Name must be at most 60 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 300 }).withMessage('Description must be at most 300 characters'),
    body('color')
      .optional()
      .isIn(WORKSPACE_COLORS).withMessage('Invalid color value'),
  ]),
  workspaceController.updateWorkspace,
);

// DELETE /api/workspaces/:id — delete workspace
router.delete(
  '/:id',
  validate([mongoId('id')]),
  workspaceController.deleteWorkspace,
);

// GET /api/workspaces/:id/members/search — search users to add
router.get(
  '/:id/members/search',
  validate([
    mongoId('id'),
    query('query')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Search query must be at most 100 characters'),
  ]),
  workspaceController.searchUsers,
);

// POST /api/workspaces/:id/members — add member
router.post(
  '/:id/members',
  validate([
    mongoId('id'),
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('role')
      .isIn(['editor', 'viewer', 'admin']).withMessage('Role must be editor, viewer, or admin'),
  ]),
  workspaceController.addMember,
);

// PATCH /api/workspaces/:id/members/:memberId — update member role
router.patch(
  '/:id/members/:memberId',
  validate([
    mongoId('id'),
    mongoId('memberId'),
    body('role')
      .isIn(['admin', 'editor', 'viewer']).withMessage('Role must be admin, editor, or viewer'),
  ]),
  workspaceController.updateMemberRole,
);

// DELETE /api/workspaces/:id/members/:memberId — remove member
router.delete(
  '/:id/members/:memberId',
  validate([
    mongoId('id'),
    mongoId('memberId'),
  ]),
  workspaceController.removeMember,
);

export default router;
