import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import * as workspaceService from '../services/workspaceService';
import type { IWorkspace } from '../models/Workspace';

/** Normalises a populated workspace so every member has { id, fullName, email, role }. */
function formatWorkspace(ws: IWorkspace) {
  const obj = ws.toObject();
  return {
    ...obj,
    id: ws._id.toString(),
    _id: undefined,
    __v: undefined,
    members: ws.members.map((m) => {
      const u = m.user as unknown as { _id?: string; id?: string; fullName: string; email: string };
      const userId = (u._id || u.id || '').toString();
      return {
        id: userId,
        fullName: u.fullName,
        email: u.email,
        role: m.role,
      };
    }),
  };
}

/** POST /api/workspaces */
export const createWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, color } = req.body;
  const workspace = await workspaceService.createWorkspace(req.user!.id, { name, description, color });
  sendSuccess(res, formatWorkspace(workspace), 201);
});

/** GET /api/workspaces */
export const listWorkspaces = asyncHandler(async (req: Request, res: Response) => {
  const workspaces = await workspaceService.listUserWorkspaces(req.user!.id);
  sendSuccess(res, workspaces.map(formatWorkspace));
});

/** GET /api/workspaces/:id */
export const getWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const workspace = await workspaceService.getWorkspace(req.params.id, req.user!.id);
  sendSuccess(res, formatWorkspace(workspace));
});

/** PATCH /api/workspaces/:id */
export const updateWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, color } = req.body;
  const workspace = await workspaceService.updateWorkspace(req.params.id, req.user!.id, { name, description, color });
  sendSuccess(res, formatWorkspace(workspace));
});

/** DELETE /api/workspaces/:id */
export const deleteWorkspace = asyncHandler(async (req: Request, res: Response) => {
  await workspaceService.deleteWorkspace(req.params.id, req.user!.id);
  sendSuccess(res, { message: 'Workspace deleted' });
});

/** GET /api/workspaces/:id/members/search */
export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = (req.query.query as string) || '';
  const users = await workspaceService.searchUsersToAdd(req.params.id, req.user!.id, query);
  sendSuccess(res, users);
});

/** POST /api/workspaces/:id/members */
export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const { userId, role } = req.body;
  const workspace = await workspaceService.addMember(req.params.id, req.user!.id, { userId, role });
  sendSuccess(res, formatWorkspace(workspace));
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
  sendSuccess(res, formatWorkspace(workspace));
});

/** DELETE /api/workspaces/:id/members/:memberId */
export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  await workspaceService.removeMember(req.params.id, req.user!.id, req.params.memberId);
  sendSuccess(res, { message: 'Member removed' });
});
