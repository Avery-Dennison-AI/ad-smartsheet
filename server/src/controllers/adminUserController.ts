import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import * as adminUserService from '../services/adminUserService';

/** GET /api/admin/users */
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const status = (req.query.status as 'active' | 'deactivated' | 'deleted' | 'all') || 'all';
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));

  const result = await adminUserService.listUsers({ search, status, page, limit });
  sendSuccess(res, result);
});

/** PATCH /api/admin/users/:id */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const requesterId = new mongoose.Types.ObjectId(req.user!.id);
  const { role, isActive, guestExpiresAt } = req.body;

  const user = await adminUserService.updateUser(req.params.id, requesterId, { role, isActive, guestExpiresAt });
  sendSuccess(res, user);
});

/** DELETE /api/admin/users/:id */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const requesterId = req.user!.id;
  const { transferToUserId } = req.body;

  const result = await adminUserService.deleteUser(req.params.id, requesterId, transferToUserId);
  sendSuccess(res, result);
});

/** GET /api/admin/users/:id/owned-workspaces */
export const getUserOwnedWorkspaces = asyncHandler(async (req: Request, res: Response) => {
  const workspaces = await adminUserService.getUserOwnedWorkspaces(req.params.id);
  sendSuccess(res, workspaces);
});
