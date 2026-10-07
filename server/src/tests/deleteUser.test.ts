import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// ─── deleteUser integration-style unit tests (mocked DB) ──────────────────────

// Mock all Mongoose models before importing deleteUser
const mockUserFindById = vi.fn();
const mockUserCountDocuments = vi.fn();
const mockUserFindByIdAndUpdate = vi.fn();

const mockWorkspaceFind = vi.fn();
const mockWorkspaceFindOneAndUpdate = vi.fn();
const mockWorkspaceUpdateMany = vi.fn();

const mockSheetUpdateMany = vi.fn();
const mockUserSheetMetaDeleteMany = vi.fn();
const mockInvitationUpdateMany = vi.fn();

vi.mock('../models/User', () => ({
  default: {
    findById: (...args: unknown[]) => mockUserFindById(...args),
    countDocuments: (...args: unknown[]) => mockUserCountDocuments(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockUserFindByIdAndUpdate(...args),
  },
}));

vi.mock('../models/Workspace', () => ({
  default: {
    find: (...args: unknown[]) => mockWorkspaceFind(...args),
    findOneAndUpdate: (...args: unknown[]) => mockWorkspaceFindOneAndUpdate(...args),
    updateMany: (...args: unknown[]) => mockWorkspaceUpdateMany(...args),
  },
}));

vi.mock('../models/Sheet', () => ({
  default: {
    updateMany: (...args: unknown[]) => mockSheetUpdateMany(...args),
  },
}));

vi.mock('../models/UserSheetMeta', () => ({
  default: {
    deleteMany: (...args: unknown[]) => mockUserSheetMetaDeleteMany(...args),
  },
}));

vi.mock('../models/Invitation', () => ({
  default: {
    updateMany: (...args: unknown[]) => mockInvitationUpdateMany(...args),
  },
}));

// Import after mocks
import { deleteUser } from '../services/adminUserService';

// ─── Helpers for mocked DB responses ──────────────────────────────────────────

/** Creates a chainable select() mock that resolves to the given value */
function mockSelect(value: unknown) {
  return { select: vi.fn().mockResolvedValue(value) };
}

function setupDefaultMocks(overrides?: {
  targetRole?: string;
  targetIsDeleted?: boolean;
  targetEmail?: string;
  targetFullName?: string;
  activeAdminCount?: number;
  ownedWorkspaces?: Array<{ _id: string; name: string }>;
  transferTarget?: { _id: string; role: string; isActive: boolean; isDeleted: boolean } | null;
}) {
  const targetId = overrides?.ownedWorkspaces ? USER_ID_1 : USER_ID_1;
  const target = {
    _id: { toString: () => USER_ID_1 },
    role: overrides?.targetRole ?? 'member',
    isDeleted: overrides?.targetIsDeleted ?? false,
    email: overrides?.targetEmail ?? 'alice@example.com',
    fullName: overrides?.targetFullName ?? 'Alice Smith',
    isActive: true,
  };

  // User.findById — first call is for target, second for transfer target
  const transferTargetData = overrides?.transferTarget !== undefined
    ? overrides.transferTarget
    : { _id: { toString: () => USER_ID_2 }, role: 'member', isActive: true, isDeleted: false };

  let callCount = 0;
  mockUserFindById.mockImplementation(() => {
    callCount++;
    if (callCount === 1) return mockSelect(target);
    // Second call: transfer target
    if (transferTargetData) {
      return mockSelect(transferTargetData);
    }
    return mockSelect(null);
  });

  mockUserCountDocuments.mockResolvedValue(overrides?.activeAdminCount ?? 2);

  // Workspace.find for getUserOwnedWorkspaces
  const ownedWs = overrides?.ownedWorkspaces ?? [];
  mockWorkspaceFind.mockReturnValue({
    select: vi.fn().mockResolvedValue(
      ownedWs.map((w) => ({ _id: { toString: () => w._id }, name: w.name })),
    ),
  });

  // All mutation mocks resolve successfully
  mockWorkspaceFindOneAndUpdate.mockResolvedValue({});
  mockWorkspaceUpdateMany.mockResolvedValue({});
  mockSheetUpdateMany.mockResolvedValue({});
  mockUserSheetMetaDeleteMany.mockResolvedValue({});
  mockInvitationUpdateMany.mockResolvedValue({});
  mockUserFindByIdAndUpdate.mockResolvedValue({});
}

describe('deleteUser — integration-style unit tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Workspace ownership transfer (BUG 1) ──────────────────────────────────

  describe('workspace ownership transfer', () => {
    it('atomically transfers ownership with correct member entry for existing editor member', async () => {
      const ws1Id = '507f1f77bcf86cd799439021';
      const ws2Id = '507f1f77bcf86cd799439022';

      setupDefaultMocks({
        ownedWorkspaces: [
          { _id: ws1Id, name: 'WS One' },
          { _id: ws2Id, name: 'WS Two' },
        ],
      });

      await deleteUser(USER_ID_1, USER_ID_3, USER_ID_2);

      // Should have called findOneAndUpdate once per workspace (atomic operation)
      expect(mockWorkspaceFindOneAndUpdate).toHaveBeenCalledTimes(2);

      // Verify each call uses aggregation pipeline (array of stages)
      for (let i = 0; i < 2; i++) {
        const [filter, pipeline] = mockWorkspaceFindOneAndUpdate.mock.calls[i];
        const wsId = i === 0 ? ws1Id : ws2Id;

        // Filter targets the correct workspace
        expect(filter).toEqual({ _id: wsId });

        // Pipeline is an array of $set stages
        expect(Array.isArray(pipeline)).toBe(true);
        expect(pipeline.length).toBe(2);

        // Stage 1: filter out both old member entries
        const stage1 = pipeline[0].$set.members;
        expect(stage1.$filter).toBeDefined();
        expect(stage1.$filter.input).toBe('$members');

        // Stage 2: set owner + concatArrays to add new owner member
        const stage2 = pipeline[1].$set;
        expect(stage2.owner).toBeDefined();
        expect(stage2.members.$concatArrays).toBeDefined();
        // The pushed entry should have role: 'owner'
        const pushedEntry = stage2.members.$concatArrays[1][0];
        expect(pushedEntry.role).toBe('owner');
      }
    });

    it('transfers ownership when transfer target is NOT an existing member', async () => {
      const ws1Id = '507f1f77bcf86cd799439021';

      setupDefaultMocks({
        ownedWorkspaces: [{ _id: ws1Id, name: 'Solo WS' }],
      });

      await deleteUser(USER_ID_1, USER_ID_3, USER_ID_2);

      // Atomic operation still runs
      expect(mockWorkspaceFindOneAndUpdate).toHaveBeenCalledTimes(1);

      // The pipeline filters out BOTH the deleted user AND the transfer target
      const [, pipeline] = mockWorkspaceFindOneAndUpdate.mock.calls[0];
      const filterCond = pipeline[0].$set.members.$filter.cond;
      // Two $ne conditions in an $and
      expect(filterCond.$and.length).toBe(2);
    });

    it('removes deleted user from remaining workspace memberships after transfer', async () => {
      setupDefaultMocks({
        ownedWorkspaces: [{ _id: 'ws1', name: 'WS' }],
      });

      await deleteUser(USER_ID_1, USER_ID_3, USER_ID_2);

      // After atomic transfer, a global $pull removes from all other workspaces
      expect(mockWorkspaceUpdateMany).toHaveBeenCalledWith(
        {},
        { $pull: { members: { user: USER_ID_1 } } },
      );
    });
  });

  // ── Email freeing (BUG 2) ─────────────────────────────────────────────────

  describe('email freeing', () => {
    it('sets placeholder email and saves original as deletedEmail', async () => {
      setupDefaultMocks({ targetEmail: 'alice@example.com' });

      await deleteUser(USER_ID_1, USER_ID_3);

      // The LAST findByIdAndUpdate call should set the email fields
      const lastCall = mockUserFindByIdAndUpdate.mock.calls[mockUserFindByIdAndUpdate.mock.calls.length - 1];
      const [id, update] = lastCall;

      expect(id).toBe(USER_ID_1);
      expect(update.$set.deletedEmail).toBe('alice@example.com');
      expect(update.$set.email).toBe(`deleted+${USER_ID_1}@neo.invalid`);
      expect(update.$set.isDeleted).toBe(true);
      expect(update.$set.isActive).toBe(false);
      expect(update.$set.deletedAt).toBeInstanceOf(Date);
    });

    it('email freeing happens AFTER all other writes (ordering guarantee)', async () => {
      setupDefaultMocks({
        ownedWorkspaces: [{ _id: 'ws1', name: 'WS' }],
      });

      const callOrder: string[] = [];
      mockWorkspaceFindOneAndUpdate.mockImplementation(() => {
        callOrder.push('workspace_transfer');
        return Promise.resolve({});
      });
      mockWorkspaceUpdateMany.mockImplementation(() => {
        callOrder.push('workspace_pull');
        return Promise.resolve({});
      });
      mockSheetUpdateMany.mockImplementation(() => {
        callOrder.push('sheet_pull');
        return Promise.resolve({});
      });
      mockUserSheetMetaDeleteMany.mockImplementation(() => {
        callOrder.push('meta_delete');
        return Promise.resolve({});
      });
      mockInvitationUpdateMany.mockImplementation(() => {
        callOrder.push('invitation_revoke');
        return Promise.resolve({});
      });
      mockUserFindByIdAndUpdate.mockImplementation(() => {
        callOrder.push('user_update');
        return Promise.resolve({});
      });

      await deleteUser(USER_ID_1, USER_ID_3, USER_ID_2);

      // user_update must be the very last operation
      expect(callOrder[callOrder.length - 1]).toBe('user_update');
      // All other operations must precede it
      expect(callOrder.indexOf('workspace_transfer')).toBeLessThan(callOrder.indexOf('user_update'));
      expect(callOrder.indexOf('workspace_pull')).toBeLessThan(callOrder.indexOf('user_update'));
      expect(callOrder.indexOf('sheet_pull')).toBeLessThan(callOrder.indexOf('user_update'));
      expect(callOrder.indexOf('meta_delete')).toBeLessThan(callOrder.indexOf('user_update'));
      expect(callOrder.indexOf('invitation_revoke')).toBeLessThan(callOrder.indexOf('user_update'));
    });

    it('placeholder email includes userId for uniqueness', async () => {
      setupDefaultMocks();

      await deleteUser(USER_ID_1, USER_ID_3);

      const lastCall = mockUserFindByIdAndUpdate.mock.calls[mockUserFindByIdAndUpdate.mock.calls.length - 1];
      const email = lastCall[1].$set.email;
      expect(email).toContain(USER_ID_1);
      expect(email).toMatch(/^deleted\+.*@neo\.invalid$/);
    });
  });

  // ── Name preserved for history ────────────────────────────────────────────

  describe('name preserved for history', () => {
    it('does NOT modify fullName during deletion', async () => {
      setupDefaultMocks({ targetFullName: 'Alice Smith' });

      await deleteUser(USER_ID_1, USER_ID_3);

      // Check that no update sets fullName
      for (const call of mockUserFindByIdAndUpdate.mock.calls) {
        const update = call[1];
        if (update.$set) {
          expect(update.$set.fullName).toBeUndefined();
        }
      }
    });

    it('marks isDeleted=true and sets deletedAt', async () => {
      setupDefaultMocks();

      await deleteUser(USER_ID_1, USER_ID_3);

      const lastCall = mockUserFindByIdAndUpdate.mock.calls[mockUserFindByIdAndUpdate.mock.calls.length - 1];
      expect(lastCall[1].$set.isDeleted).toBe(true);
      expect(lastCall[1].$set.deletedAt).toBeInstanceOf(Date);
    });
  });

  // ── Guards still enforced ─────────────────────────────────────────────────

  describe('guards still enforced', () => {
    it('self-delete throws 403', async () => {
      setupDefaultMocks();

      await expect(deleteUser(USER_ID_1, USER_ID_1)).rejects.toThrow('You cannot delete your own account');
    });

    it('last active admin throws 403', async () => {
      setupDefaultMocks({ targetRole: 'admin', activeAdminCount: 1 });

      await expect(deleteUser(USER_ID_1, USER_ID_3)).rejects.toThrow('Cannot delete the last active admin');
    });

    it('owner without transfer target throws 400', async () => {
      setupDefaultMocks({
        ownedWorkspaces: [{ _id: 'ws1', name: 'WS' }],
      });

      // No transferToUserId provided
      await expect(deleteUser(USER_ID_1, USER_ID_3)).rejects.toThrow('Ownership transfer is required');
    });

    it('already deleted user throws 400', async () => {
      setupDefaultMocks({ targetIsDeleted: true });

      await expect(deleteUser(USER_ID_1, USER_ID_3)).rejects.toThrow('User is already deleted');
    });
  });

  // ── Cleanup steps ─────────────────────────────────────────────────────────

  describe('cleanup steps', () => {
    it('removes user from sheet memberships', async () => {
      setupDefaultMocks();

      await deleteUser(USER_ID_1, USER_ID_3);

      expect(mockSheetUpdateMany).toHaveBeenCalledWith(
        {},
        { $pull: { members: { userId: USER_ID_1 } } },
      );
    });

    it('clears favorites and recents', async () => {
      setupDefaultMocks();

      await deleteUser(USER_ID_1, USER_ID_3);

      expect(mockUserSheetMetaDeleteMany).toHaveBeenCalledWith({ userId: USER_ID_1 });
    });

    it('revokes pending invitations using the ORIGINAL email', async () => {
      setupDefaultMocks({ targetEmail: 'alice@example.com' });

      await deleteUser(USER_ID_1, USER_ID_3);

      expect(mockInvitationUpdateMany).toHaveBeenCalledWith(
        { email: 'alice@example.com', status: 'pending' },
        { $set: { status: 'revoked' } },
      );
    });
  });

  // ── Successful deletion returns { success: true } ─────────────────────────

  it('returns { success: true } on successful deletion', async () => {
    setupDefaultMocks();

    const result = await deleteUser(USER_ID_1, USER_ID_3);
    expect(result).toEqual({ success: true });
  });
});
