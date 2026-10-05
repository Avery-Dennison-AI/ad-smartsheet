import mongoose, { Schema, Document } from 'mongoose';

export type ColumnType = 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'contact';

export interface DropdownOption {
  label: string;
  color: string;
}

export interface ColumnDef {
  id: string;
  name: string;
  type: ColumnType;
  order: number;
  isPrimary: boolean;
  options?: DropdownOption[];
  formatting?: Record<string, unknown>;
  width?: number;
}

export type SheetRole = 'viewer' | 'editor' | 'admin';

export interface SheetMemberEntry {
  userId: mongoose.Types.ObjectId;
  role: SheetRole;
}

export interface ISheet extends Document {
  workspaceId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  columns: ColumnDef[];
  members: SheetMemberEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const dropdownOptionSchema = new Schema<DropdownOption>(
  {
    label: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const columnDefSchema = new Schema<ColumnDef>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    type: {
      type: String,
      required: true,
      enum: ['text', 'number', 'date', 'dropdown', 'checkbox', 'contact'],
    },
    order: { type: Number, required: true },
    isPrimary: { type: Boolean, default: false },
    options: { type: [dropdownOptionSchema], default: undefined },
    formatting: { type: Schema.Types.Mixed, default: undefined },
    width: { type: Number, default: undefined, min: 60, max: 800 },
  },
  { _id: false },
);

const sheetMemberSchema = new Schema<SheetMemberEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      required: true,
    },
  },
  { _id: false },
);

const sheetSchema = new Schema<ISheet>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: true, maxlength: 100, trim: true },
    description: { type: String, maxlength: 300, trim: true, default: undefined },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    columns: { type: [columnDefSchema], default: [] },
    members: { type: [sheetMemberSchema], default: [] },
  },
  { timestamps: true },
);

// Compound index for efficient listing by workspace sorted by updatedAt
sheetSchema.index({ workspaceId: 1, updatedAt: -1 });
// Index for finding sheets shared with a specific user
sheetSchema.index({ 'members.userId': 1 });

const Sheet = mongoose.model<ISheet>('Sheet', sheetSchema);

export default Sheet;
