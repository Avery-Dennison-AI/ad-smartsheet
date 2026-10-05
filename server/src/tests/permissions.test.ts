import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Mongoose models (only needed for requireSheetAccess integration tests) ──

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
    const member = workspace?.members?.find((m: any) => String(m.user) === String(userId));
    return member ? member.role : null;
  },
}));

// Import after mocks
import { calculateEffectiveRole, hasMinRole, requireSheetAccess } from '../services/permissionService';

// ─── Valid-looking ObjectId hex strings for tests ─────────────────────────────

const USER_ID = '507f1f77bcf86cd799439011';
const SHEET_ID = '507f1f77bcf86cd799439012';
const WORKSPACE_ID = '507f1f77bcf86cd799439013';
const OTHER_USER_ID = '507f1f77bcf86cd799439014';

// ─── Test helpers ──────────────────────────────────────────────────────────────

function makeUser(role = 'member', guestExpiresAt?: Date | null, isActive = true) {
  return { role, isActive, guestExpiresAt: guestExpiresAt ?? undefined };
}

function makeWorkspace(members: Array<{ user: string; role: string }> = []) {
  return { members: members.map(m => ({ user: m.user, role: m.role })) };
}

function makeSheet(members: Array<{ userId: string; role: string }> = []) {
  return { members: members.map(m => ({ userId: m.userId, role: m.role })) };
}

// ─── hasMinRole tests ──────────────────────────────────────────────────────────

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

// ─── calculateEffectiveRole tests (pure function, no DB) ───────────────────────

describe('calculateEffectiveRole', () => {
  it('workspace role only — member has editor in workspace → gets editor', () => {
    const user = makeUser('member');
    const workspace = makeWorkspace([{ user: USER_ID, role: 'editor' }]);
    const sheet = makeSheet(); // no direct shares

    const result = calculateEffectiveRole(user, workspace, sheet, USER_ID);
    expect(result).toBe('editor');
  });

  it('sheet role only — no workspace membership, has viewer on sheet → gets viewer', () => {
    const user = makeUser('member');
    const workspace = makeWorkspace(); // not a member
    const sheet = makeSheet([{ userId: USER_ID, role: 'viewer' }]);

    const result = calculateEffectiveRole(user, workspace, sheet, USER_ID);
    expect(result).toBe('viewer');
  });

  it('highest role wins — workspace=viewer, sheet=editor → gets editor', () => {
    const user = makeUser('member');
    const workspace = makeWorkspace([{ user: USER_ID, role: 'viewer' }]);
    const sheet = makeSheet([{ userId: USER_ID, role: 'editor' }]);

    const result = calculateEffectiveRole(user, workspace, sheet, USER_ID);
    expect(result).toBe('editor');
  });

  it('guest with workspace role capped at editor — workspace admin → gets editor', () => {
    const user = makeUser('guest');
    const workspace = makeWorkspace([{ user: USER_ID, role: 'admin' }]);
    const sheet = makeSheet();

    const result = calculateEffectiveRole(user, workspace, sheet, USER_ID);
    expect(result).toBe('editor');
  });

  it('guest with sheet role capped at editor — sheet admin → gets editor', () => {
    const user = makeUser('guest');
    const workspace = makeWorkspace(); // not a workspace member
    const sheet = makeSheet([{ userId: USER_ID, role: 'admin' }]);

    const result = calculateEffectiveRole(user, workspace, sheet, USER_ID);
    expect(result).toBe('editor');
  });

  it('guest with both workspace and sheet roles — takes highest (capped)', () => {
    const user = makeUser('guest');
    const workspace = makeWorkspace([{ user: USER_ID, role: 'viewer' }]);
    const sheet = makeSheet([{ userId: USER_ID, role: 'editor' }]);

    const result = calculateEffectiveRole(user, workspace, sheet, USER_ID);
    expect(result).toBe('editor');
  });

  it('guest with no explicit share → null', () => {
    const user = makeUser('guest');
    const workspace = makeWorkspace(); // not a member
    const sheet = makeSheet(); // no direct share

    const result = calculateEffectiveRole(user, workspace, sheet, USER_ID);
    expect(result).toBeNull();
  });

  it('expired guest → null', () => {
    const pastDate = new Date(Date.now() - 86400000); // yesterday
    const user = makeUser('guest', pastDate);
    const workspace = makeWorkspace([{ user: USER_ID, role: 'editor' }]);
    const sheet = makeSheet([{ userId: USER_ID, role: 'editor' }]);

    const result = calculateEffectiveRole(user, workspace, sheet, USER_ID);
    expect(result).toBeNull();
  });

  it('inactive user → null', () => {
    const user = makeUser('member', null, false);
    const workspace = makeWorkspace([{ user: USER_ID, role: 'editor' }]);
    const sheet = makeSheet([{ userId: USER_ID, role: 'editor' }]);

    const result = calculateEffectiveRole(user, workspace, sheet, USER_ID);
    expect(result).toBeNull();
  });

  it('no access (no workspace, no sheet membership) → null', () => {
    const user = makeUser('member');
    const workspace = makeWorkspace(); // not a member
    const sheet = makeSheet(); // no direct share

    const result = calculateEffectiveRole(user, workspace, sheet, USER_ID);
    expect(result).toBeNull();
  });

  it('guest with valid expiry + workspace share → workspace role (capped)', () => {
    const futureDate = new Date(Date.now() + 86400000); // tomorrow
    const user = makeUser('guest', futureDate);
    const workspace = makeWorkspace([{ user: USER_ID, role: 'viewer' }]);
    const sheet = makeSheet();

    const result = calculateEffectiveRole(user, workspace, sheet, USER_ID);
    expect(result).toBe('viewer');
  });

  it('null workspace and null sheet → null', () => {
    const user = makeUser('member');
    const result = calculateEffectiveRole(user, null, null, USER_ID);
    expect(result).toBeNull();
  });
});

// ─── requireSheetAccess integration tests ──────────────────────────────────────

describe('requireSheetAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupFullMocks(sheet: any, workspace: any, user: any) {
    // requireSheetAccess calls Sheet.findById(), Workspace.findById(), and optionally User.findById()
    // The sheet and workspace are returned as full docs (not .select() chains)
    mockSheetFindById.mockResolvedValue(sheet);
    mockWorkspaceFindById.mockResolvedValue(workspace);
    if (user) {
      mockUserFindById.mockReturnValue({ select: vi.fn().mockResolvedValue(user) });
    }
  }

  it('Viewer cannot satisfy requiredRole: editor → throws 403', async () => {
    const sheet = { _id: SHEET_ID, workspaceId: WORKSPACE_ID, members: [] };
    const workspace = { _id: WORKSPACE_ID, members: [{ user: USER_ID, role: 'viewer' }] };
    const user = { role: 'member', isActive: true };
    setupFullMocks(sheet, workspace, user);

    await expect(requireSheetAccess(USER_ID, SHEET_ID, 'editor'))
      .rejects.toThrow('Access denied');
  });

  it('Valid access returns sheet, workspace, and effectiveRole', async () => {
    const sheet = { _id: SHEET_ID, workspaceId: WORKSPACE_ID, members: [] };
    const workspace = { _id: WORKSPACE_ID, members: [{ user: USER_ID, role: 'editor' }] };
    const user = { role: 'member', isActive: true };
    setupFullMocks(sheet, workspace, user);

    const result = await requireSheetAccess(USER_ID, SHEET_ID, 'viewer');
    expect(result.effectiveRole).toBe('editor');
    expect(result.sheet).toBe(sheet);
    expect(result.workspace).toBe(workspace);
  });

  it('No access throws 404', async () => {
    const sheet = { _id: SHEET_ID, workspaceId: WORKSPACE_ID, members: [] };
    const workspace = { _id: WORKSPACE_ID, members: [] }; // not a member
    const user = { role: 'member', isActive: true };
    setupFullMocks(sheet, workspace, user);

    await expect(requireSheetAccess(USER_ID, SHEET_ID))
      .rejects.toThrow('Sheet not found');
  });

  it('Accepts preloaded user to avoid duplicate DB query', async () => {
    const sheet = { _id: SHEET_ID, workspaceId: WORKSPACE_ID, members: [] };
    const workspace = { _id: WORKSPACE_ID, members: [{ user: USER_ID, role: 'editor' }] };
    const preloadedUser = { role: 'member', isActive: true };
    setupFullMocks(sheet, workspace, null); // no User.findById mock needed

    const result = await requireSheetAccess(USER_ID, SHEET_ID, 'viewer', preloadedUser);
    expect(result.effectiveRole).toBe('editor');
    // User.findById should NOT have been called since we provided preloadedUser
    expect(mockUserFindById).not.toHaveBeenCalled();
  });
});
