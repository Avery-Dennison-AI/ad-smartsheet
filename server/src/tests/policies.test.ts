import { describe, it, expect } from 'vitest';
import { enforceWorkspaceCreationPolicy, enforceGuestInvitePolicy } from '../services/orgPolicyService';
import { calculateEffectiveRole } from '../services/permissionService';

// ─── Test helpers ──────────────────────────────────────────────────────────────

const USER_ID = '507f1f77bcf86cd799439011';

interface PolicyLike {
  whoCanCreateWorkspaces: 'all' | 'admins';
  whoCanInviteGuests: 'admins' | 'admins_and_workspace_admins';
  guestAccessExpiry: 'optional' | 'required';
  defaultGuestExpiryDays: number;
  allowedGuestEmailDomains: string[];
  maxGuestRole: 'editor' | 'viewer';
}

function makePolicy(overrides: Partial<PolicyLike> = {}): any {
  return {
    whoCanCreateWorkspaces: 'all',
    whoCanInviteGuests: 'admins',
    guestAccessExpiry: 'required',
    defaultGuestExpiryDays: 90,
    allowedGuestEmailDomains: [],
    maxGuestRole: 'editor',
    ...overrides,
  } as any;
}

function makeUser(role: string) {
  return { role };
}

function makeFullUser(role: string, guestExpiresAt?: Date | null, isActive = true) {
  return { role, isActive, guestExpiresAt: guestExpiresAt ?? undefined };
}

function makeWorkspace(members: Array<{ user: string; role: string }> = []) {
  return { members: members.map(m => ({ user: m.user, role: m.role })) };
}

function makeSheet(members: Array<{ userId: string; role: string }> = []) {
  return { members: members.map(m => ({ userId: m.userId, role: m.role })) };
}

// ─── enforceWorkspaceCreationPolicy tests ──────────────────────────────────────

describe('enforceWorkspaceCreationPolicy', () => {
  it('allows admin when policy is "admins"', () => {
    const policy = makePolicy({ whoCanCreateWorkspaces: 'admins' });
    expect(() => enforceWorkspaceCreationPolicy(makeUser('admin'), policy)).not.toThrow();
  });

  it('blocks member when policy is "admins"', () => {
    const policy = makePolicy({ whoCanCreateWorkspaces: 'admins' });
    expect(() => enforceWorkspaceCreationPolicy(makeUser('member'), policy)).toThrow(
      'Only admins can create workspaces in your organization.',
    );
  });

  it('always blocks guest', () => {
    const policy = makePolicy({ whoCanCreateWorkspaces: 'all' });
    expect(() => enforceWorkspaceCreationPolicy(makeUser('guest'), policy)).toThrow(
      'Guests cannot create workspaces.',
    );
  });

  it('allows member when policy is "all"', () => {
    const policy = makePolicy({ whoCanCreateWorkspaces: 'all' });
    expect(() => enforceWorkspaceCreationPolicy(makeUser('member'), policy)).not.toThrow();
  });
});

// ─── enforceGuestInvitePolicy tests ──────────────────────────────────────────────

describe('enforceGuestInvitePolicy', () => {
  it('blocks non-admin actor when policy is "admins"', () => {
    const policy = makePolicy({ whoCanInviteGuests: 'admins' });
    expect(() =>
      enforceGuestInvitePolicy(makeUser('member'), 'test@example.com', 'viewer', policy),
    ).toThrow('Only admins can invite guests');
  });

  it('allows admin actor when policy is "admins"', () => {
    const policy = makePolicy({ whoCanInviteGuests: 'admins' });
    expect(() =>
      enforceGuestInvitePolicy(makeUser('admin'), 'test@example.com', 'viewer', policy),
    ).not.toThrow();
  });

  it('blocks email domain not in allowlist (when list is non-empty)', () => {
    const policy = makePolicy({ allowedGuestEmailDomains: ['company.com'] });
    expect(() =>
      enforceGuestInvitePolicy(makeUser('admin'), 'user@other.com', 'viewer', policy),
    ).toThrow('not in the allowed domains list');
  });

  it('allows email domain matching allowlist', () => {
    const policy = makePolicy({ allowedGuestEmailDomains: ['company.com'] });
    expect(() =>
      enforceGuestInvitePolicy(makeUser('admin'), 'user@company.com', 'viewer', policy),
    ).not.toThrow();
  });

  it('allows any domain when allowlist is empty', () => {
    const policy = makePolicy({ allowedGuestEmailDomains: [] });
    expect(() =>
      enforceGuestInvitePolicy(makeUser('admin'), 'user@anything.org', 'viewer', policy),
    ).not.toThrow();
  });

  it('caps requested role "editor" to "viewer" when maxGuestRole is "viewer"', () => {
    const policy = makePolicy({ maxGuestRole: 'viewer' });
    expect(() =>
      enforceGuestInvitePolicy(makeUser('admin'), 'user@test.com', 'editor', policy),
    ).toThrow('cannot exceed "viewer"');
  });

  it('allows requested role "viewer" when maxGuestRole is "viewer"', () => {
    const policy = makePolicy({ maxGuestRole: 'viewer' });
    expect(() =>
      enforceGuestInvitePolicy(makeUser('admin'), 'user@test.com', 'viewer', policy),
    ).not.toThrow();
  });

  it('allows requested role "editor" when maxGuestRole is "editor"', () => {
    const policy = makePolicy({ maxGuestRole: 'editor' });
    expect(() =>
      enforceGuestInvitePolicy(makeUser('admin'), 'user@test.com', 'editor', policy),
    ).not.toThrow();
  });
});

// ─── calculateEffectiveRole with maxGuestRole tests ──────────────────────────────

describe('calculateEffectiveRole with maxGuestRole', () => {
  it('guest editor capped to viewer when maxGuestRole is "viewer"', () => {
    const user = makeFullUser('guest');
    const workspace = makeWorkspace([{ user: USER_ID, role: 'editor' }]);
    const sheet = makeSheet();

    // Without maxGuestRole override → gets editor (default cap)
    const resultDefault = calculateEffectiveRole(user, workspace, sheet, USER_ID);
    expect(resultDefault).toBe('editor');

    // With maxGuestRole='viewer' → capped to viewer
    const resultCapped = calculateEffectiveRole(user, workspace, sheet, USER_ID, 'viewer');
    expect(resultCapped).toBe('viewer');
  });

  it('guest viewer stays viewer when maxGuestRole is "viewer"', () => {
    const user = makeFullUser('guest');
    const workspace = makeWorkspace([{ user: USER_ID, role: 'viewer' }]);
    const sheet = makeSheet();

    const result = calculateEffectiveRole(user, workspace, sheet, USER_ID, 'viewer');
    expect(result).toBe('viewer');
  });

  it('non-guest roles are unaffected by maxGuestRole', () => {
    const user = makeFullUser('member');
    const workspace = makeWorkspace([{ user: USER_ID, role: 'editor' }]);
    const sheet = makeSheet();

    const result = calculateEffectiveRole(user, workspace, sheet, USER_ID, 'viewer');
    expect(result).toBe('editor');
  });
});
