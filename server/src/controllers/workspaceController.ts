import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import * as workspaceService from '../services/workspaceService';

/** POST /api/workspaces */
export const createWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, color } = req.body;
  const workspace = await workspaceService.createWorkspace(req.user!.id, { name, description, color });
  sendSuccess(res, workspace, 201);
});

/** GET /api/workspaces */
export const listWorkspaces = asyncHandler(async (req: Request, res: Response) => {
  const workspaces = await workspaceService.listUserWorkspaces(req.user!.id);
  sendSuccess(res, workspaces);
});

/** GET /api/workspaces/:id */
export const getWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const workspace = await workspaceService.getWorkspace(req.params.id, req.user!.id);
  sendSuccess(res, workspace);
});

/** PATCH /api/workspaces/:id */
export const updateWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, color } = req.body;
  const workspace = await workspaceService.updateWorkspace(req.params.id, req.user!.id, { name, description, color });
  sendSuccess(res, workspace);
});

/** DELETE /api/workspaces/:id */
export const deleteWorkspace = asyncHandler(async (req: Request, res: Response) => {
  await workspaceService.deleteWorkspace(req.params.id, req.user!.id);
  sendSuccess(res, { message: 'Workspace deleted' });
});

/** GET /api/workspaces/:id/members/search */
export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = (req.query.query as string) || '';
  const users = await workspaceService.searchUsersToAdd(req.params.id, query);
  sendSuccess(res, users);
});

/** POST /api/workspaces/:id/members */
export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const { userId, role } = req.body;
  const workspace = await workspaceService.addMember(req.params.id, req.user!.id, { userId, role });
  sendSuccess(res, workspace);
});

/** PATCH /api/workspaces/:id/members/:memberId */
export const updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body;
  const workspace = await workspaceService.updateMemberRole(
    req.params.id,
    req.user!.id,
    req.params.memberId,
    role,
  );
  sendSuccess(res, workspace);
});

/** DELETE /api/workspaces/:id/members/:memberId */
export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  await workspaceService.removeMember(req.params.id, req.user!.id, req.params.memberId);
  sendSuccess(res, { message: 'Member removed' });
});
