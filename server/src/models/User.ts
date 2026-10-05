import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'admin' | 'member' | 'guest';
export type AccentColor = 'avery' | 'teal' | 'blue' | 'indigo' | 'purple' | 'rose' | 'orange';

export const ACCENT_COLORS: AccentColor[] = ['avery', 'teal', 'blue', 'indigo', 'purple', 'rose', 'orange'];

export interface IUser extends Document {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  guestExpiresAt?: Date;
  isActive: boolean;
  accentColor: AccentColor;
  lastLoginAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      set: (v: string) => v.trim().toLowerCase(),
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'member', 'guest'], default: 'member' },
    guestExpiresAt: { type: Date, default: undefined },
    isActive: { type: Boolean, default: true },
    accentColor: { type: String, enum: ACCENT_COLORS, default: 'avery' },
    lastLoginAt: { type: Date },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: undefined },
  },
  { timestamps: true },
);

const User = mongoose.model<IUser>('User', userSchema);

export default User;

/**
 * Validates a plaintext password against complexity requirements.
 * Returns { valid: true, errors: [] } when the password passes all checks.
 */
export function validatePassword(plain: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (plain.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(plain)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(plain)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(plain)) {
    errors.push('Password must contain at least one digit');
  }
  if (!/[^A-Za-z0-9]/.test(plain)) {
    errors.push('Password must contain at least one special character');
  }

  return { valid: errors.length === 0, errors };
}
