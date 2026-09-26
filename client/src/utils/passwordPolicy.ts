/**
 * Client-side password policy rules.
 * Mirrors server/src/utils/password.ts PASSWORD_POLICY_RULES exactly.
 */

export interface PasswordRule {
  id: string;
  label: string;
  test: (pw: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'minLength', label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { id: 'lowercase', label: 'One lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
  { id: 'number', label: 'One number', test: (pw: string) => /[0-9]/.test(pw) },
  { id: 'special', label: 'One special character', test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
];
