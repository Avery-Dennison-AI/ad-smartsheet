import { Router } from 'express';
import { body } from 'express-validator';
import { requireRole } from '../middleware/authMiddleware';
import { validate } from '../utils/validate';
import * as orgPolicyController from '../controllers/orgPolicyController';

const router = Router();

router.get(
  '/',
  requireRole('admin'),
  orgPolicyController.getOrgPolicy,
);

router.patch(
  '/',
  requireRole('admin'),
  validate([
    body('whoCanCreateWorkspaces').optional().isIn(['all', 'admins']),
    body('whoCanInviteGuests').optional().isIn(['admins', 'admins_and_workspace_admins']),
    body('guestAccessExpiry').optional().isIn(['optional', 'required']),
    body('defaultGuestExpiryDays').optional().isInt({ min: 1, max: 365 }),
    body('allowedGuestEmailDomains.*').optional().isString(),
    body('maxGuestRole').optional().isIn(['editor', 'viewer']),
  ]),
  orgPolicyController.updateOrgPolicy,
);

export default router;
