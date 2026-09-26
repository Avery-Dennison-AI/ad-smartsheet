/**
 * Build a full invite URL from the relative invite path.
 */
export function buildInviteLink(invitePath: string): string {
  return window.location.origin + invitePath;
}
