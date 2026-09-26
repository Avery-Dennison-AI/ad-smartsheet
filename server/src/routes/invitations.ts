import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { validate } from '../utils/validate';
import {
  createInvitation,
  listInvitations,
  regenerateInvitation,
  revokeInvitation,
  getInvitationByToken,
  acceptInvitation,
} from '../controllers/invitationController';

const router = Router();

// ─── Admin-only invitation management (require admin role) ──────────────────

const createValidation = validate([
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('role')
    .isIn(['admin', 'member'])
    .withMessage('Role must be admin or member'),
  body('fullName')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Full name must be between 1 and 100 characters'),
]);

router.post(
  '/admin/invitations',
  requireRole('admin'),
  createValidation,
  createInvitation,
);

router.get('/admin/invitations', requireRole('admin'), listInvitations);

router.post(
  '/admin/invitations/:id/regenerate',
  requireRole('admin'),
  regenerateInvitation,
);

router.post(
  '/admin/invitations/:id/revoke',
  requireRole('admin'),
  revokeInvitation,
);

// ─── Public invitation endpoints (no auth required) ────────────────────────

router.get('/invite/:token', getInvitationByToken);

const acceptValidation = validate([
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Full name must be between 1 and 100 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password'),
]);

router.post('/invite/:token/accept', acceptValidation, acceptInvitation);

export default router;
