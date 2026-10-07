import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { createProject } from '../services/projectService';

export const createProjectHandler = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.user!.id;
  const project = await createProject(workspaceId, userId, req.body);
  sendSuccess(res, project, 201);
});
