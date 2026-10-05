import mongoose, { Schema, Document } from 'mongoose';

export interface IOrgPolicy extends Document {
  whoCanCreateWorkspaces: 'all' | 'admins';
  whoCanInviteGuests: 'admins' | 'admins_and_workspace_admins';
  guestAccessExpiry: 'optional' | 'required';
  defaultGuestExpiryDays: number;
  allowedGuestEmailDomains: string[];
  maxGuestRole: 'editor' | 'viewer';
}

const orgPolicySchema = new Schema<IOrgPolicy>(
  {
    whoCanCreateWorkspaces: {
      type: String,
      enum: ['all', 'admins'],
      default: 'all',
    },
    whoCanInviteGuests: {
      type: String,
      enum: ['admins', 'admins_and_workspace_admins'],
      default: 'admins',
    },
    guestAccessExpiry: {
      type: String,
      enum: ['optional', 'required'],
      default: 'required',
    },
    defaultGuestExpiryDays: {
      type: Number,
      default: 90,
      min: 1,
      max: 365,
    },
    allowedGuestEmailDomains: {
      type: [String],
      default: [],
    },
    maxGuestRole: {
      type: String,
      enum: ['editor', 'viewer'],
      default: 'editor',
    },
  },
  { timestamps: true },
);

/** Singleton pattern: fetch or create the single org policy document. */
orgPolicySchema.statics.getOrCreate = async function (): Promise<IOrgPolicy> {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

// Add static method type to the model interface
interface OrgPolicyModel extends mongoose.Model<IOrgPolicy> {
  getOrCreate(): Promise<IOrgPolicy>;
}

export default mongoose.model<IOrgPolicy, OrgPolicyModel>('OrgPolicy', orgPolicySchema);
