import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SheetRole } from '../services/permissionService';

// ─── Mock Mongoose models ──────────────────────────────────────────────────

const mockSheetFindById = vi.fn();
const mockWorkspaceFindById = vi.fn();
const mockUserFindById = vi.fn();

vi.mock('../models/Sheet', () => ({
  default: { findById: (...args: unknown[]) => mockSheetFindById(...args) },
}));

vi.mock('../models/Workspace', () => ({
  default: { findById: (...args: unknown[]) => mockWorkspaceFindById(...args) },
}));

vi.mock('../models/User', () => ({
  default: { findById: (...args: unknown[]) => mockUserFindById(...args) },
}));

vi.mock('../services/workspaceService', () => ({
  getMemberRole: (workspace: any, userId: string) => {
    const member = workspace?.members?.find((m: any) => m.user === userId);
    return member ? member.role : null;
  },
}));

// Import after mocks
import { getEffectiveRole, requireSheetAccess, hasMinRole } from '../services/permissionService';

// ─── Test helpers ──────────────────────────────────────────────────────────

function makeSheet(id: string, workspaceId: string, members: Array<{ userId: string; role: string }> = []) {
  return {
    _id: id,
    workspaceId,
    members: members.map(m => ({ userId: m.userId, role: m.role })),
  };
}

function makeWorkspace(id: string, members: Array<{ user: string; role: string }> = []) {
  return {
    _id: id,
    members: members.map(m => ({ user: m.user, role: m.role })),
  };
}

function makeUser(id: string, orgRole = 'member', guestExpiresAt?: Date | null, isActive = true) {
  return {
    _id: id,
    orgRole,
    guestExpiresAt: guestExpiresAt ?? undefined,
    isActive,
  };
}

// ─── hasMinRole tests ──────────────────────────────────────────────────────

describe('hasMinRole', () => {
  it('viewer satisfies viewer', () => {
    expect(hasMinRole('viewer', 'viewer')).toBe(true);
  });

  it('editor satisfies viewer', () => {
    expect(hasMinRole('editor', 'viewer')).toBe(true);
  });

  it('viewer does not satisfy editor', () => {
    expect(hasMinRole('viewer', 'editor')).toBe(false);
  });

  it('owner satisfies admin', () => {
    expect(hasMinRole('owner', 'admin')).toBe(true);
  });

  it('admin does not satisfy owner', () => {
    expect(hasMinRole('admin', 'owner')).toBe(false);
  });
});

// ─── getEffectiveRole tests ────────────────────────────────────────────────

describe('getEffectiveRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default select chain mock
    mockSheetFindById.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
    mockWorkspaceFindById.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
    mockUserFindById.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
  });

  function setupMocks(sheet: any, workspace: any, user: any) {
    // Sheet.findById returns a thenable with select
    const sheetSelectFn = vi.fn().mockResolvedValue(sheet);
    mockSheetFindById.mockReturnValue({ select: sheetSelectFn });

    // For the second call to Sheet.findById (without select in requireSheetAccess path),
    // we need to handle both patterns. Since getEffectiveRole uses .select(), mock that.
    
    // Workspace.findById
    const wsSelectFn = vi.fn().mockResolvedValue(workspace);
    mockWorkspaceFindById.mockReturnValue({ select: wsSelectFn });

    // User.findById
    const userSelectFn = vi.fn().mockResolvedValue(user);
    mockUserFindById.mockReturnValue({ select: userSelectFn });
  }

  it('1. Workspace member only → workspace role returned', async () => {
    const sheet = makeSheet('s1', 'w1');
    const workspace = makeWorkspace('w1', [{ user: 'u1', role: 'editor' }]);
    const user = makeUser('u1', 'member');
    setupMocks(sheet, workspace, user);

    const role = await getEffectiveRole('u1', 's1');
    expect(role).toBe('editor');
  });

  it('2. Sheet member only (not workspace member) → sheet role returned', async () => {
    const sheet = makeSheet('s1', 'w1', [{ userId: 'u1', role: 'viewer' }]);
    const workspace = makeWorkspace('w1'); // no members
    const user = makeUser('u1', 'member');
    setupMocks(sheet, workspace, user);

    const role = await getEffectiveRole('u1', 's1');
    expect(role).toBe('viewer');
  });

  it('3. Both workspace and sheet roles → higher wins', async () => {
    const sheet = makeSheet('s1', 'w1', [{ userId: 'u1', role: 'admin' }]);
    const workspace = makeWorkspace('w1', [{ user: 'u1', role: 'viewer' }]);
    const user = makeUser('u1', 'member');
    setupMocks(sheet, workspace, user);

    const role = await getEffectiveRole('u1', 's1');
    expect(role).toBe('admin');
  });

  it('4. Workspace viewer + sheet editor → editor returned', async () => {
    const sheet = makeSheet('s1', 'w1', [{ userId: 'u1', role: 'editor' }]);
    const workspace = makeWorkspace('w1', [{ user: 'u1', role: 'viewer' }]);
    const user = makeUser('u1', 'member');
    setupMocks(sheet, workspace, user);

    const role = await getEffectiveRole('u1', 's1');
    expect(role).toBe('editor');
  });

  it('5. Guest with valid expiry + sheet share → sheet role returned', async () => {
    const futureDate = new Date(Date.now() + 86400000); // tomorrow
    const sheet = makeSheet('s1', 'w1', [{ userId: 'u1', role: 'editor' }]);
    const workspace = makeWorkspace('w1'); // not a workspace member
    const user = makeUser('u1', 'guest', futureDate);
    setupMocks(sheet, workspace, user);

    const role = await getEffectiveRole('u1', 's1');
    expect(role).toBe('editor');
  });

  it('6. Guest with expired date → null', async () => {
    const pastDate = new Date(Date.now() - 86400000); // yesterday
    const sheet = makeSheet('s1', 'w1', [{ userId: 'u1', role: 'editor' }]);
    const workspace = makeWorkspace('w1');
    const user = makeUser('u1', 'guest', pastDate);
    setupMocks(sheet, workspace, user);

    const role = await getEffectiveRole('u1', 's1');
    expect(role).toBeNull();
  });

  it('7. No access → null', async () => {
    const sheet = makeSheet('s1', 'w1'); // no direct shares
    const workspace = makeWorkspace('w1'); // not a member
    const user = makeUser('u1', 'member');
    setupMocks(sheet, workspace, user);

    const role = await getEffectiveRole('u1', 's1');
    expect(role).toBeNull();
  });

  it('9. Removed sheet access (user deleted from members) → null', async () => {
    const sheet = makeSheet('s1', 'w1'); // empty members — was removed
    const workspace = makeWorkspace('w1'); // also not workspace member
    const user = makeUser('u1', 'member');
    setupMocks(sheet, workspace, user);

    const role = await getEffectiveRole('u1', 's1');
    expect(role).toBeNull();
  });
});

// ─── requireSheetAccess tests ──────────────────────────────────────────────

describe('requireSheetAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupFullMocks(sheet: any, workspace: any, user: any) {
    // getEffectiveRole calls Sheet.findById().select(), User.findById().select(), Workspace.findById().select()
    // requireSheetAccess also calls Sheet.findById() and Workspace.findById() without select
    
    let sheetCallCount = 0;
    mockSheetFindById.mockImplementation(() => {
      sheetCallCount++;
      if (sheetCallCount % 2 === 1) {
        // First call (from getEffectiveRole) uses .select()
        return { select: vi.fn().mockResolvedValue(sheet) };
      }
      // Second call (from requireSheetAccess) returns full doc
      return Promise.resolve(sheet);
    });

    let wsCallCount = 0;
    mockWorkspaceFindById.mockImplementation(() => {
      wsCallCount++;
      if (wsCallCount % 2 === 1) {
        return { select: vi.fn().mockResolvedValue(workspace) };
      }
      return Promise.resolve(workspace);
    });

    mockUserFindById.mockReturnValue({ select: vi.fn().mockResolvedValue(user) });
  }

  it('8. Viewer cannot satisfy requiredRole: editor → throws 403', async () => {
    const sheet = makeSheet('s1', 'w1');
    const workspace = makeWorkspace('w1', [{ user: 'u1', role: 'viewer' }]);
    const user = makeUser('u1', 'member');
    setupFullMocks(sheet, workspace, user);

    await expect(requireSheetAccess('u1', 's1', 'editor'))
      .rejects.toThrow('Access denied');
  });

  it('Valid access returns sheet, workspace, and effectiveRole', async () => {
    const sheet = makeSheet('s1', 'w1');
    const workspace = makeWorkspace('w1', [{ user: 'u1', role: 'editor' }]);
    const user = makeUser('u1', 'member');
    setupFullMocks(sheet, workspace, user);

    const result = await requireSheetAccess('u1', 's1', 'viewer');
    expect(result.effectiveRole).toBe('editor');
    expect(result.sheet).toBe(sheet);
    expect(result.workspace).toBe(workspace);
  });

  it('No access throws 404', async () => {
    const sheet = makeSheet('s1', 'w1');
    const workspace = makeWorkspace('w1'); // not a member
    const user = makeUser('u1', 'member');
    setupFullMocks(sheet, workspace, user);

    await expect(requireSheetAccess('u1', 's1'))
      .rejects.toThrow('Sheet not found');
  });
});
