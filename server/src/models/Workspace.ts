import mongoose, { Schema, Document } from 'mongoose';

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';

export const WORKSPACE_COLORS = [
  'teal',
  'blue',
  'green',
  'yellow',
  'red',
  'purple',
  'gray',
] as const;

export type WorkspaceColorName = (typeof WORKSPACE_COLORS)[number];

export interface WorkspaceMemberEntry {
  user: mongoose.Types.ObjectId;
  role: WorkspaceRole;
}

export interface IWorkspace extends Document {
  name: string;
  description?: string;
  color: WorkspaceColorName;
  owner: mongoose.Types.ObjectId;
  members: WorkspaceMemberEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const workspaceMemberSchema = new Schema<WorkspaceMemberEntry>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'editor', 'viewer'],
      required: true,
    },
  },
  { _id: false },
);

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 300 },
    color: {
      type: String,
      required: true,
      enum: WORKSPACE_COLORS,
      default: 'teal',
    },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [workspaceMemberSchema], default: [] },
  },
  { timestamps: true },
);

// Compound index for efficient member lookups
workspaceSchema.index({ 'members.user': 1 });

const Workspace = mongoose.model<IWorkspace>('Workspace', workspaceSchema);

export default Workspace;
