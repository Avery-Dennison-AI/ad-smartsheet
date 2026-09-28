import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { updatePreferences } from '../controllers/userPreferencesController';

const router = Router();

router.patch('/preferences', requireAuth, updatePreferences);

export default router;
