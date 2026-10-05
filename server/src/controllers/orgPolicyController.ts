import type { Request, Response, NextFunction } from 'express';
import * as orgPolicyService from '../services/orgPolicyService';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

export const getOrgPolicy = asyncHandler(async (_req: Request, res: Response) => {
  const policy = await orgPolicyService.getOrgPolicy();
  sendSuccess(res, policy);
});

export const updateOrgPolicy = asyncHandler(async (req: Request, res: Response) => {
  const updated = await orgPolicyService.updateOrgPolicy(req.body);
  sendSuccess(res, updated);
});
