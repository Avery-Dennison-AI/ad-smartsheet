import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import * as adminUserService from '../services/adminUserService';

/** GET /api/admin/users */
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const status = (req.query.status as 'active' | 'deactivated' | 'all') || 'all';
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));

  const result = await adminUserService.listUsers({ search, status, page, limit });
  sendSuccess(res, result);
});

/** PATCH /api/admin/users/:id */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const requesterId = new mongoose.Types.ObjectId(req.user!.id);
  const { role, isActive } = req.body;

  const user = await adminUserService.updateUser(req.params.id, requesterId, { role, isActive });
  sendSuccess(res, user);
});
