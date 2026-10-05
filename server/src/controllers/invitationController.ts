import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import * as invitationService from '../services/invitationService';
import { setSessionCookie } from '../config/cookies';

/** POST /api/admin/invitations */
export const createInvitation = asyncHandler(async (req: Request, res: Response) => {
  const { email, fullName, role, orgRole, guestExpiresAt } = req.body;
  const invitedBy = new mongoose.Types.ObjectId(req.user!.id);

  const result = await invitationService.createInvitation(
    { email, fullName, role, orgRole, guestExpiresAt: guestExpiresAt ? new Date(guestExpiresAt) : undefined },
    invitedBy,
  );
  // Strip tokenHash from the invitation object before sending
  const { tokenHash: _th1, ...safeInvitation } = result.invitation.toObject();
  sendSuccess(res, { invitation: safeInvitation, invitePath: result.invitePath }, 201);
});

/** GET /api/admin/invitations */
export const listInvitations = asyncHandler(async (_req: Request, res: Response) => {
  const invitations = await invitationService.listInvitations();
  sendSuccess(res, invitations);
});

/** POST /api/admin/invitations/:id/regenerate */
export const regenerateInvitation = asyncHandler(async (req: Request, res: Response) => {
  const result = await invitationService.regenerateInvitation(req.params.id);
  // Strip tokenHash from the invitation object before sending
  const { tokenHash: _th2, ...safeInvitation } = result.invitation.toObject();
  sendSuccess(res, { invitation: safeInvitation, invitePath: result.invitePath });
});

/** POST /api/admin/invitations/:id/revoke */
export const revokeInvitation = asyncHandler(async (req: Request, res: Response) => {
  const invitation = await invitationService.revokeInvitation(req.params.id);
  sendSuccess(res, invitation);
});

/** GET /api/invite/:token — public endpoint to validate an invitation link */
export const getInvitationByToken = asyncHandler(async (req: Request, res: Response) => {
  const data = await invitationService.getInvitationByToken(req.params.token);
  sendSuccess(res, data);
});

/** POST /api/invite/:token/accept — public endpoint to accept an invitation */
export const acceptInvitation = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, password, confirmPassword } = req.body;
  const result = await invitationService.acceptInvitation(
    req.params.token,
    { fullName, password, confirmPassword },
  );
  setSessionCookie(res, result.token);
  sendSuccess(res, { user: result.user }, 201);
});
