import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import * as myWorkController from '../controllers/myWorkController';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/my-work
router.get('/', myWorkController.getMyWork);

export default router;
