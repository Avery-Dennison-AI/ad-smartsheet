import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { validate } from '../utils/validate';
import { createRateLimiter } from '../middleware/rateLimiter';
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
  body('orgRole')
    .optional()
    .isIn(['admin', 'member', 'guest'])
    .withMessage('orgRole must be admin, member, or guest'),
  body('guestExpiresAt')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('guestExpiresAt must be a valid ISO date'),
  body('fullName')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Full name must be between 1 and 100 characters'),
]);

const mongoIdParamValidation = validate([
  param('id')
    .isMongoId()
    .withMessage('Invalid invitation ID'),
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
  mongoIdParamValidation,
  regenerateInvitation,
);

router.post(
  '/admin/invitations/:id/revoke',
  requireRole('admin'),
  mongoIdParamValidation,
  revokeInvitation,
);

// ─── Public invitation endpoints (no auth required) ────────────────────────

// Rate limiter: 20 requests per 15 minutes per IP
const publicInviteLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many requests. Please try again later.',
});

router.get('/invite/:token', publicInviteLimiter, getInvitationByToken);

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

router.post('/invite/:token/accept', publicInviteLimiter, acceptValidation, acceptInvitation);

export default router;
