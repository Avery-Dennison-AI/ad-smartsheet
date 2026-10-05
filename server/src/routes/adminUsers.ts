import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { requireRole } from '../middleware/authMiddleware';
import { validate } from '../utils/validate';
import { listUsers, updateUser } from '../controllers/adminUserController';

const router = Router();

// All admin user routes require admin role
router.use(requireRole('admin'));

// GET /api/admin/users — query validation
const listUsersValidation = validate([
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['all', 'active', 'deactivated'])
    .withMessage('Status must be all, active, or deactivated'),
  query('search')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Search must be at most 100 characters'),
]);

// PATCH /api/admin/users/:id — MongoId + role validation
const updateUserValidation = validate([
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('role')
    .optional()
    .isIn(['admin', 'member', 'guest'])
    .withMessage('Role must be admin, member, or guest'),
  body('guestExpiresAt')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('guestExpiresAt must be a valid ISO date'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
]);

router.get('/users', listUsersValidation, listUsers);
router.patch('/users/:id', updateUserValidation, updateUser);

export default router;
