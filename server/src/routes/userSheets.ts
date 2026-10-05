import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import * as sheetController from '../controllers/sheetController';
import * as sheetSharingService from '../services/sheetSharingService';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/user/recents — get recently opened sheets
router.get('/recents', sheetController.getRecents);

// GET /api/user/favorites — get favorite sheets
router.get('/favorites', sheetController.getFavorites);

// GET /api/user/shared-with-me — get sheets shared directly with the user
router.get(
  '/shared-with-me',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await sheetSharingService.getSharedWithMe(req.user!.id);
    sendSuccess(res, result);
  }),
);

export default router;
