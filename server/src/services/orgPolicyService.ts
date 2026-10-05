import OrgPolicy, { type IOrgPolicy } from '../models/OrgPolicy';
import { AppError } from '../utils/AppError';

export interface OrgPolicyPatch {
  whoCanCreateWorkspaces?: 'all' | 'admins';
  whoCanInviteGuests?: 'admins' | 'admins_and_workspace_admins';
  guestAccessExpiry?: 'optional' | 'required';
  defaultGuestExpiryDays?: number;
  allowedGuestEmailDomains?: string[];
  maxGuestRole?: 'editor' | 'viewer';
}

/** Fetches (or creates) the singleton organization policy document. */
export async function getOrgPolicy(): Promise<IOrgPolicy> {
  return OrgPolicy.getOrCreate();
}

/** Updates the organization policy with a validated patch. Returns the updated document. */
export async function updateOrgPolicy(patch: OrgPolicyPatch): Promise<IOrgPolicy> {
  const policy = await OrgPolicy.getOrCreate();

  // Validate and apply each field
  if (patch.whoCanCreateWorkspaces !== undefined) {
    if (!['all', 'admins'].includes(patch.whoCanCreateWorkspaces)) {
      throw new AppError('Invalid value for whoCanCreateWorkspaces', 400);
    }
    policy.whoCanCreateWorkspaces = patch.whoCanCreateWorkspaces;
  }

  if (patch.whoCanInviteGuests !== undefined) {
    if (!['admins', 'admins_and_workspace_admins'].includes(patch.whoCanInviteGuests)) {
      throw new AppError('Invalid value for whoCanInviteGuests', 400);
    }
    policy.whoCanInviteGuests = patch.whoCanInviteGuests;
  }

  if (patch.guestAccessExpiry !== undefined) {
    if (!['optional', 'required'].includes(patch.guestAccessExpiry)) {
      throw new AppError('Invalid value for guestAccessExpiry', 400);
    }
    policy.guestAccessExpiry = patch.guestAccessExpiry;
  }

  if (patch.defaultGuestExpiryDays !== undefined) {
    if (typeof patch.defaultGuestExpiryDays !== 'number' || patch.defaultGuestExpiryDays < 1 || patch.defaultGuestExpiryDays > 365) {
      throw new AppError('defaultGuestExpiryDays must be between 1 and 365', 400);
    }
    policy.defaultGuestExpiryDays = patch.defaultGuestExpiryDays;
  }

  if (patch.allowedGuestEmailDomains !== undefined) {
    if (!Array.isArray(patch.allowedGuestEmailDomains)) {
      throw new AppError('allowedGuestEmailDomains must be an array', 400);
    }
    policy.allowedGuestEmailDomains = patch.allowedGuestEmailDomains.map(d => d.trim().toLowerCase());
  }

  if (patch.maxGuestRole !== undefined) {
    if (!['editor', 'viewer'].includes(patch.maxGuestRole)) {
      throw new AppError('Invalid value for maxGuestRole', 400);
    }
    policy.maxGuestRole = patch.maxGuestRole;
  }

  await policy.save();
  return policy;
}

/**
 * Enforces the guest invitation policy.
 * Checks domain allowlist, maxGuestRole cap, and who-can-invite-guests policy.
 * Throws AppError(400/403) with clear messages on violations.
 */
export function enforceGuestInvitePolicy(
  actorUser: { role: string },
  inviteeEmail: string,
  requestedRole: string,
  policy: IOrgPolicy,
): void {
  // Check who can invite guests
  if (policy.whoCanInviteGuests === 'admins' && actorUser.role !== 'admin') {
    throw new AppError('Only admins can invite guests in your organization.', 403);
  }

  // Check domain allowlist (only enforced when list is non-empty)
  if (policy.allowedGuestEmailDomains.length > 0) {
    const domain = inviteeEmail.split('@')[1]?.toLowerCase();
    if (!domain || !policy.allowedGuestEmailDomains.includes(domain)) {
      throw new AppError(
        `Guest email domain "${domain}" is not in the allowed domains list: ${policy.allowedGuestEmailDomains.join(', ')}`,
        400,
      );
    }
  }

  // Check maxGuestRole cap
  const roleLevel: Record<string, number> = { viewer: 1, editor: 2 };
  const requestedLevel = roleLevel[requestedRole] ?? 0;
  const maxLevel = roleLevel[policy.maxGuestRole] ?? 0;
  if (requestedLevel > maxLevel) {
    throw new AppError(
      `Guest role cannot exceed "${policy.maxGuestRole}" per organization policy.`,
      400,
    );
  }
}

/**
 * Enforces workspace creation policy.
 * Throws AppError(403) if the actor is not allowed to create workspaces.
 */
export function enforceWorkspaceCreationPolicy(
  actorUser: { role: string },
  policy: IOrgPolicy,
): void {
  // Guests are always blocked (handled separately in workspaceService)
  if (actorUser.role === 'guest') {
    throw new AppError('Guests cannot create workspaces.', 403);
  }

  // If policy restricts to admins only, block non-admin members
  if (policy.whoCanCreateWorkspaces === 'admins' && actorUser.role !== 'admin') {
    throw new AppError('Only admins can create workspaces in your organization.', 403);
  }
}
