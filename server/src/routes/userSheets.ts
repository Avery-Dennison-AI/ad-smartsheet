import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import * as sheetController from '../controllers/sheetController';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/user/recents — get recently opened sheets
router.get('/recents', sheetController.getRecents);

// GET /api/user/favorites — get favorite sheets
router.get('/favorites', sheetController.getFavorites);

export default router;
