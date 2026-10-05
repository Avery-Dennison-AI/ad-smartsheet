import { describe, it, expect } from 'vitest';
import { validateDeleteUser } from '../services/adminUserService';
import { AppError } from '../utils/AppError';

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
