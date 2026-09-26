import bcrypt from 'bcryptjs';

const COST = 12;

export interface PasswordPolicyResult {
  valid: boolean;
  errors: string[];
}

export const PASSWORD_POLICY_RULES = [
  { id: 'length', label: '8+ characters', test: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'Number', test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', label: 'Special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  const errors: string[] = [];
  for (const rule of PASSWORD_POLICY_RULES) {
    if (!rule.test(password)) {
      errors.push(rule.label);
    }
  }
  return { valid: errors.length === 0, errors };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
