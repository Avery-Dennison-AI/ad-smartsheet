import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { validateDeleteUser, deleteUser } from '../services/adminUserService';
import { AppError } from '../utils/AppError';
import User from '../models/User';
import Workspace from '../models/Workspace';
import Sheet from '../models/Sheet';
import UserSheetMeta from '../models/UserSheetMeta';
import Invitation from '../models/Invitation';
import { createUser, createWorkspace } from './helpers/factories';

// ─── Test helpers ──────────────────────────────────────────────────────────────

const USER_ID_1 = '507f1f77bcf86cd799439011';
const USER_ID_2 = '507f1f77bcf86cd799439012';
const USER_ID_3 = '507f1f77bcf86cd799439013';

function makeTarget(overrides: Partial<{ id: string; role: string; isDeleted: boolean; email: string }> = {}) {
  return {
    id: USER_ID_1,
    role: 'member',
    isDeleted: false,
    email: 'user@example.com',
    ...overrides,
  };
}

function makeTransferTarget(overrides: Partial<{ id: string; role: string; isActive: boolean; isDeleted: boolean }> = {}) {
  return {
    id: USER_ID_2,
    role: 'member',
    isActive: true,
    isDeleted: false,
    ...overrides,
  };
}

// ─── validateDeleteUser tests (pure function, no DB) ──────────────────────────

describe('validateDeleteUser', () => {
  it('self-delete is blocked (403)', () => {
    const target = makeTarget({ id: USER_ID_1 });

    expect(() =>
      validateDeleteUser(target, USER_ID_1, 2, []),
    ).toThrow('You cannot delete your own account');

    try {
      validateDeleteUser(target, USER_ID_1, 2, []);
    } catch (err) {
      expect((err as AppError).statusCode).toBe(403);
    }
  });

  it('already deleted user is blocked (400)', () => {
    const target = makeTarget({ isDeleted: true });

    expect(() =>
      validateDeleteUser(target, USER_ID_2, 2, []),
    ).toThrow('User is already deleted');

    try {
      validateDeleteUser(target, USER_ID_2, 2, []);
    } catch (err) {
      expect((err as AppError).statusCode).toBe(400);
    }
  });

  it('last active admin cannot be deleted (403)', () => {
    const target = makeTarget({ role: 'admin' });

    expect(() =>
      validateDeleteUser(target, USER_ID_2, 1, []), // only 1 active admin
    ).toThrow('Cannot delete the last active admin');

    try {
      validateDeleteUser(target, USER_ID_2, 1, []);
    } catch (err) {
      expect((err as AppError).statusCode).toBe(403);
    }
  });

  it('non-last admin can be deleted', () => {
    const target = makeTarget({ role: 'admin' });

    expect(() =>
      validateDeleteUser(target, USER_ID_2, 2, []), // 2 active admins
    ).not.toThrow();
  });

  it('ownership transfer required when user owns workspaces (400)', () => {
    const target = makeTarget();
    const ownedWorkspaces = [{ _id: 'ws1', name: 'My Workspace' }];

    expect(() =>
      validateDeleteUser(target, USER_ID_2, 2, ownedWorkspaces), // no transferToUserId
    ).toThrow('Ownership transfer is required');

    try {
      validateDeleteUser(target, USER_ID_2, 2, ownedWorkspaces);
    } catch (err) {
      expect((err as AppError).statusCode).toBe(400);
    }
  });

  it('transfer target not found (400)', () => {
    const target = makeTarget();
    const ownedWorkspaces = [{ _id: 'ws1', name: 'My Workspace' }];

    expect(() =>
      validateDeleteUser(target, USER_ID_2, 2, ownedWorkspaces, null, USER_ID_3),
    ).toThrow('Transfer target user not found');
  });

  it('transfer target must be active (400)', () => {
    const target = makeTarget();
    const ownedWorkspaces = [{ _id: 'ws1', name: 'My Workspace' }];
    const transferTarget = makeTransferTarget({ isActive: false });

    expect(() =>
      validateDeleteUser(target, USER_ID_2, 2, ownedWorkspaces, transferTarget, USER_ID_2),
    ).toThrow('Transfer target must be an active, non-deleted user');
  });

  it('transfer target must not be deleted (400)', () => {
    const target = makeTarget();
    const ownedWorkspaces = [{ _id: 'ws1', name: 'My Workspace' }];
    const transferTarget = makeTransferTarget({ isDeleted: true });

    expect(() =>
      validateDeleteUser(target, USER_ID_2, 2, ownedWorkspaces, transferTarget, USER_ID_2),
    ).toThrow('Transfer target must be an active, non-deleted user');
  });

  it('transfer target cannot be a guest (400)', () => {
    const target = makeTarget();
    const ownedWorkspaces = [{ _id: 'ws1', name: 'My Workspace' }];
    const transferTarget = makeTransferTarget({ role: 'guest' });

    expect(() =>
      validateDeleteUser(target, USER_ID_2, 2, ownedWorkspaces, transferTarget, USER_ID_2),
    ).toThrow('Transfer target cannot be a guest');
  });

  it('successful validation with ownership transfer', () => {
    const target = makeTarget();
    const ownedWorkspaces = [{ _id: 'ws1', name: 'My Workspace' }];
    const transferTarget = makeTransferTarget();

    expect(() =>
      validateDeleteUser(target, USER_ID_2, 2, ownedWorkspaces, transferTarget, USER_ID_2),
    ).not.toThrow();
  });

  it('successful validation without workspaces', () => {
    const target = makeTarget();

    expect(() =>
      validateDeleteUser(target, USER_ID_2, 2, []),
    ).not.toThrow();
  });
});

// ─── deleteUser integration tests (real DB) ──────────────────────────────────

describe('deleteUser — integration tests', () => {
  // ── Workspace ownership transfer ──────────────────────────────────────────

  describe('workspace ownership transfer', () => {
    it('transfers ownership and updates member entries', async () => {
      const targetUser = await createUser({ email: 'target@test.com', fullName: 'Target User' });
      const requester = await createUser({ role: 'admin', email: 'requester@test.com' });
      const transferTarget = await createUser({ email: 'transfer@test.com' });

      // Create workspace owned by target user, with transfer target as editor
      const ws = await Workspace.create({
        name: 'Test WS',
        color: 'teal',
        owner: targetUser._id,
        members: [
          { user: targetUser._id, role: 'owner' },
          { user: transferTarget._id, role: 'editor' },
        ],
      });

      await deleteUser(targetUser._id.toString(), requester._id.toString(), transferTarget._id.toString());

      // Verify workspace ownership transferred
      const updatedWs = await Workspace.findById(ws._id);
      expect(updatedWs).toBeDefined();
      expect(updatedWs!.owner.toString()).toBe(transferTarget._id.toString());

      // Transfer target should be in members as owner
      const transferMember = updatedWs!.members.find((m) => m.user.toString() === transferTarget._id.toString());
      expect(transferMember).toBeDefined();
      expect(transferMember!.role).toBe('owner');

      // Deleted user should NOT be in members
      const deletedMember = updatedWs!.members.find((m) => m.user.toString() === targetUser._id.toString());
      expect(deletedMember).toBeUndefined();
    });

    it('removes deleted user from remaining workspace memberships after transfer', async () => {
      const targetUser = await createUser({ email: 'target2@test.com' });
      const requester = await createUser({ role: 'admin', email: 'requester2@test.com' });
      const transferTarget = await createUser({ email: 'transfer2@test.com' });

      // Owned workspace
      const ws1 = await Workspace.create({
        name: 'Owned WS',
        color: 'teal',
        owner: targetUser._id,
        members: [
          { user: targetUser._id, role: 'owner' },
        ],
      });

      // Another workspace where target is just a member
      const ws2 = await Workspace.create({
        name: 'Other WS',
        color: 'blue',
        owner: transferTarget._id,
        members: [
          { user: transferTarget._id, role: 'owner' },
          { user: targetUser._id, role: 'editor' },
        ],
      });

      await deleteUser(targetUser._id.toString(), requester._id.toString(), transferTarget._id.toString());

      // Target should be removed from ws2 membership
      const updatedWs2 = await Workspace.findById(ws2._id);
      const stillMember = updatedWs2!.members.find((m) => m.user.toString() === targetUser._id.toString());
      expect(stillMember).toBeUndefined();
    });
  });

  // ── Email freeing ─────────────────────────────────────────────────────────

  describe('email freeing', () => {
    it('sets placeholder email and saves original as deletedEmail', async () => {
      const targetUser = await createUser({ email: 'alice@test.com', fullName: 'Alice Smith' });
      const requester = await createUser({ role: 'admin', email: 'req@test.com' });

      await deleteUser(targetUser._id.toString(), requester._id.toString());

      const updatedUser = await User.findById(targetUser._id);
      expect(updatedUser).toBeDefined();
      expect(updatedUser!.deletedEmail).toBe('alice@test.com');
      expect(updatedUser!.email).toBe(`deleted+${targetUser._id.toString()}@neo.invalid`);
      expect(updatedUser!.isDeleted).toBe(true);
      expect(updatedUser!.isActive).toBe(false);
      expect(updatedUser!.deletedAt).toBeInstanceOf(Date);
    });

    it('placeholder email includes userId for uniqueness', async () => {
      const targetUser = await createUser({ email: 'bob@test.com' });
      const requester = await createUser({ role: 'admin', email: 'req2@test.com' });

      await deleteUser(targetUser._id.toString(), requester._id.toString());

      const updatedUser = await User.findById(targetUser._id);
      expect(updatedUser!.email).toContain(targetUser._id.toString());
      expect(updatedUser!.email).toMatch(/^deleted\+.*@neo\.invalid$/);
    });
  });

  // ── Name preserved for history ────────────────────────────────────────────

  describe('name preserved for history', () => {
    it('does NOT modify fullName during deletion', async () => {
      const targetUser = await createUser({ email: 'charlie@test.com', fullName: 'Charlie Smith' });
      const requester = await createUser({ role: 'admin', email: 'req3@test.com' });

      await deleteUser(targetUser._id.toString(), requester._id.toString());

      const updatedUser = await User.findById(targetUser._id);
      expect(updatedUser!.fullName).toBe('Charlie Smith');
    });

    it('marks isDeleted=true and sets deletedAt', async () => {
      const targetUser = await createUser({ email: 'dave@test.com' });
      const requester = await createUser({ role: 'admin', email: 'req4@test.com' });

      await deleteUser(targetUser._id.toString(), requester._id.toString());

      const updatedUser = await User.findById(targetUser._id);
      expect(updatedUser!.isDeleted).toBe(true);
      expect(updatedUser!.deletedAt).toBeInstanceOf(Date);
    });
  });

  // ── Guards still enforced ─────────────────────────────────────────────────

  describe('guards still enforced', () => {
    it('self-delete throws 403', async () => {
      const user = await createUser({ email: 'self@test.com' });

      await expect(deleteUser(user._id.toString(), user._id.toString())).rejects.toThrow('You cannot delete your own account');
    });

    it('last active admin throws 403', async () => {
      const adminUser = await createUser({ role: 'admin', email: 'lastadmin@test.com' });
      const requester = await createUser({ role: 'member', email: 'req5@test.com' });

      await expect(deleteUser(adminUser._id.toString(), requester._id.toString())).rejects.toThrow('Cannot delete the last active admin');
    });

    it('owner without transfer target throws 400', async () => {
      const targetUser = await createUser({ email: 'owner@test.com' });
      const requester = await createUser({ role: 'admin', email: 'req6@test.com' });

      // Create workspace owned by target
      await Workspace.create({
        name: 'Owned WS',
        color: 'teal',
        owner: targetUser._id,
        members: [{ user: targetUser._id, role: 'owner' }],
      });

      // No transferToUserId provided
      await expect(deleteUser(targetUser._id.toString(), requester._id.toString())).rejects.toThrow('Ownership transfer is required');
    });

    it('already deleted user throws 400', async () => {
      const targetUser = await createUser({ email: 'deleted@test.com' });
      const requester = await createUser({ role: 'admin', email: 'req7@test.com' });

      // First delete
      await deleteUser(targetUser._id.toString(), requester._id.toString());

      // Second delete attempt → should fail
      await expect(deleteUser(targetUser._id.toString(), requester._id.toString())).rejects.toThrow('User is already deleted');
    });
  });

  // ── Cleanup steps ─────────────────────────────────────────────────────────

  describe('cleanup steps', () => {
    it('removes user from sheet memberships', async () => {
      const targetUser = await createUser({ email: 'sheetmember@test.com' });
      const requester = await createUser({ role: 'admin', email: 'req8@test.com' });

      // Create a sheet with target as member
      const sheet = await Sheet.create({
        workspaceId: new mongoose.Types.ObjectId(),
        name: 'Test Sheet',
        createdBy: targetUser._id,
        members: [{ userId: targetUser._id, role: 'editor' }],
      });

      await deleteUser(targetUser._id.toString(), requester._id.toString());

      const updatedSheet = await Sheet.findById(sheet._id);
      const stillMember = updatedSheet!.members.find((m) => m.userId.toString() === targetUser._id.toString());
      expect(stillMember).toBeUndefined();
    });

    it('clears favorites and recents', async () => {
      const targetUser = await createUser({ email: 'metauser@test.com' });
      const requester = await createUser({ role: 'admin', email: 'req9@test.com' });

      // Create a UserSheetMeta entry
      await UserSheetMeta.create({
        userId: targetUser._id,
        sheetId: new mongoose.Types.ObjectId(),
        workspaceId: new mongoose.Types.ObjectId(),
        isFavorite: true,
        lastOpenedAt: new Date(),
      });

      await deleteUser(targetUser._id.toString(), requester._id.toString());

      const metas = await UserSheetMeta.find({ userId: targetUser._id });
      expect(metas.length).toBe(0);
    });

    it('revokes pending invitations using the ORIGINAL email', async () => {
      const targetUser = await createUser({ email: 'invited@test.com' });
      const requester = await createUser({ role: 'admin', email: 'req10@test.com' });

      // Create a pending invitation for this email
      const invitation = await Invitation.create({
        email: 'invited@test.com',
        role: 'member',
        tokenHash: 'test-hash-' + Date.now(),
        invitedBy: requester._id,
        expiresAt: new Date(Date.now() + 86400000 * 30),
        status: 'pending',
      });

      await deleteUser(targetUser._id.toString(), requester._id.toString());

      const updatedInvitation = await Invitation.findById(invitation._id);
      expect(updatedInvitation!.status).toBe('revoked');
    });
  });

  // ── Successful deletion returns { success: true } ─────────────────────────

  it('returns { success: true } on successful deletion', async () => {
    const targetUser = await createUser({ email: 'success@test.com' });
    const requester = await createUser({ role: 'admin', email: 'req11@test.com' });

    const result = await deleteUser(targetUser._id.toString(), requester._id.toString());
    expect(result).toEqual({ success: true });
  });
});
