/**
 * Escapes all regex meta-characters in a string so it can be safely
 * used inside a RegExp constructor.
 */
export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
