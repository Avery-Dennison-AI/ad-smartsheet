import type { InvitationStatus } from '@/types';

export function statusBadgeVariant(status: InvitationStatus): 'status-blue' | 'status-red' | 'status-gray' {
  switch (status) {
    case 'pending': return 'status-blue';
    case 'revoked': return 'status-red';
    case 'expired': return 'status-gray';
    case 'accepted': return 'status-gray'; // filtered out server-side; fallback only
  }
}

export function roleBadgeVariant(role: string): 'status-blue' | 'neutral' {
  return role === 'admin' ? 'status-blue' : 'neutral';
}

/** Capitalize first letter of a string. */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
