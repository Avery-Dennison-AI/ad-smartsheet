import { Router } from 'express';
import { query } from 'express-validator';
import type { Request, Response } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { validate } from '../utils/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { searchUsersGlobal } from '../services/workspaceService';

const router = Router();

router.use(requireAuth);

// GET /api/users/search — global user search with guest scoping
router.get(
  '/search',
  validate([
    query('query')
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Query must be between 1 and 100 characters'),
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const results = await searchUsersGlobal(req.user!.id, req.query.query as string);
    sendSuccess(res, results);
  }),
);

export default router;
