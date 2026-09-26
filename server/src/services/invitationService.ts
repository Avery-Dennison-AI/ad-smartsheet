import type { Response } from 'express';
import mongoose from 'mongoose';
import Invitation, { IInvitation } from '../models/Invitation';
import User from '../models/User';
import { generateToken, hashToken } from '../utils/tokens';
import { hashPassword, validatePasswordPolicy } from '../utils/password';
import { AppError } from '../utils/AppError';
import { createSessionForUser } from './authService';

const INVITE_EXPIRY_DAYS = 7;

function expiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + INVITE_EXPIRY_DAYS);
  return d;
}

function computeStatus(inv: IInvitation): 'pending' | 'expired' | 'accepted' | 'revoked' {
  if (inv.status === 'accepted') return 'accepted';
  if (inv.status === 'revoked') return 'revoked';
  if (inv.expiresAt < new Date()) return 'expired';
  return 'pending';
}

export async function createInvitation(
  data: { email: string; fullName?: string; role: 'admin' | 'member' },
  invitedBy: mongoose.Types.ObjectId,
): Promise<{ invitation: IInvitation; invitePath: string }> {
  const email = data.email.trim().toLowerCase();

  // Check active user
  const existingUser = await User.findOne({ email, isActive: true });
  if (existingUser) {
    throw new AppError('A user with this email already exists', 409);
  }

  // Check deactivated user — they should be reactivated instead
  const deactivatedUser = await User.findOne({ email, isActive: false });
  if (deactivatedUser) {
    throw new AppError(
      'This user already has an account but is deactivated. Reactivate them instead.',
      409,
    );
  }

  // Check pending unexpired invitation
  const existing = await Invitation.findOne({ email, status: 'pending' });
  if (existing && existing.expiresAt > new Date()) {
    throw new AppError(
      'An invitation is already pending for this email. Regenerate the existing link instead.',
      409,
    );
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);

  const invitation = await Invitation.create({
    email,
    fullName: data.fullName,
    role: data.role,
    tokenHash,
    invitedBy,
    expiresAt: expiresAt(),
    status: 'pending',
  });

  return { invitation, invitePath: `/invite/${rawToken}` };
}

export async function regenerateInvitation(
  invitationId: string,
): Promise<{ invitation: IInvitation; invitePath: string }> {
  const invitation = await Invitation.findById(invitationId);
  if (!invitation) throw new AppError('Invitation not found', 404);

  const computed = computeStatus(invitation);
  if (computed !== 'pending' && computed !== 'expired') {
    throw new AppError('Only pending or expired invitations can be regenerated', 400);
  }

  const rawToken = generateToken();
  invitation.tokenHash = hashToken(rawToken);
  invitation.expiresAt = expiresAt();
  invitation.status = 'pending';
  await invitation.save();

  return { invitation, invitePath: `/invite/${rawToken}` };
}

export async function revokeInvitation(invitationId: string): Promise<IInvitation> {
  const invitation = await Invitation.findById(invitationId);
  if (!invitation) throw new AppError('Invitation not found', 404);

  const computed = computeStatus(invitation);
  if (computed !== 'pending' && computed !== 'expired') {
    throw new AppError('Only pending or expired invitations can be revoked', 400);
  }

  invitation.status = 'revoked';
  await invitation.save();
  return invitation;
}

export async function listInvitations() {
  const invitations = await Invitation.find()
    .populate('invitedBy', 'fullName email')
    .sort({ createdAt: -1 });

  return invitations.map((inv) => ({
    id: inv._id,
    email: inv.email,
    fullName: inv.fullName,
    role: inv.role,
    status: computeStatus(inv),
    invitedBy: inv.invitedBy,
    expiresAt: inv.expiresAt,
    acceptedAt: inv.acceptedAt,
    createdAt: inv.createdAt,
  }));
}

export async function getInvitationByToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const invitation = await Invitation.findOne({ tokenHash });

  if (!invitation || computeStatus(invitation) !== 'pending') {
    throw new AppError('This invitation link is invalid or has expired.', 404);
  }

  return { email: invitation.email, fullName: invitation.fullName, role: invitation.role };
}

export async function acceptInvitation(
  rawToken: string,
  data: { fullName: string; password: string; confirmPassword: string },
  res: Response,
) {
  if (data.password !== data.confirmPassword) {
    throw new AppError('Passwords do not match', 400);
  }

  const { valid, errors } = validatePasswordPolicy(data.password);
  if (!valid) {
    throw new AppError(`Password does not meet requirements: ${errors.join(', ')}`, 400);
  }

  const tokenHash = hashToken(rawToken);
  const now = new Date();

  // Atomic claim — only one request can succeed
  const invitation = await Invitation.findOneAndUpdate(
    { tokenHash, status: 'pending', expiresAt: { $gt: now } },
    { status: 'accepted', acceptedAt: now },
    { new: true },
  );

  if (!invitation) {
    throw new AppError('This invitation link is invalid or has expired.', 404);
  }

  // Check if user was created in the meantime
  const existingUser = await User.findOne({ email: invitation.email });
  if (existingUser) {
    // Roll back the claim
    await Invitation.findByIdAndUpdate(invitation._id, { status: 'pending', acceptedAt: undefined });
    throw new AppError('This invitation link is invalid or has expired.', 404);
  }

  const passwordHash = await hashPassword(data.password);
  const user = await User.create({
    email: invitation.email,
    fullName: data.fullName || invitation.fullName || '',
    role: invitation.role,
    passwordHash,
    isActive: true,
  });

  await Invitation.findByIdAndUpdate(invitation._id, { acceptedUser: user._id });

  // Create session and set cookie
  await createSessionForUser(user, res);

  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  };
}
