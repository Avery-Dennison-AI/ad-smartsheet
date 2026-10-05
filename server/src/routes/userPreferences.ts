import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/authMiddleware';
import { validate } from '../utils/validate';
import { ACCENT_KEYS } from '../services/userPreferencesService';
import { updatePreferences } from '../controllers/userPreferencesController';

const router = Router();

const updatePreferencesValidation = validate([
  body('accentColor')
    .optional()
    .isIn(ACCENT_KEYS)
    .withMessage(`Invalid accent color. Must be one of: ${ACCENT_KEYS.join(', ')}`),
]);

router.patch('/preferences', requireAuth, updatePreferencesValidation, updatePreferences);

export default router;
