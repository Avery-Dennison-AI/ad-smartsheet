import mongoose, { Schema, Document } from 'mongoose';

export type InvitationRole = 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'revoked';

export interface IInvitation extends Document {
  email: string;
  fullName?: string;
  role: InvitationRole;
  tokenHash: string;
  invitedBy: mongoose.Types.ObjectId;
  expiresAt: Date;
  status: InvitationStatus;
  acceptedAt?: Date;
  acceptedUser?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isExpired: boolean;
  computedStatus: 'pending' | 'expired' | 'accepted' | 'revoked';
}

const invitationSchema = new Schema<IInvitation>(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    fullName: { type: String, trim: true },
    role: { type: String, enum: ['admin', 'member'], required: true },
    tokenHash: { type: String, required: true, unique: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'revoked'], default: 'pending' },
    acceptedAt: { type: Date },
    acceptedUser: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

invitationSchema.virtual('isExpired').get(function (this: IInvitation) {
  return this.status === 'pending' && this.expiresAt < new Date();
});

invitationSchema.virtual('computedStatus').get(function (this: IInvitation) {
  if (this.status === 'accepted') return 'accepted';
  if (this.status === 'revoked') return 'revoked';
  if (this.expiresAt < new Date()) return 'expired';
  return 'pending';
});

invitationSchema.index({ tokenHash: 1 }, { unique: true });
invitationSchema.index({ email: 1, status: 1 });

const Invitation = mongoose.model<IInvitation>('Invitation', invitationSchema);

export default Invitation;
