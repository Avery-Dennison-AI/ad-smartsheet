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
}

export interface ISheet extends Document {
  workspaceId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  columns: ColumnDef[];
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
  },
  { timestamps: true },
);

// Compound index for efficient listing by workspace sorted by updatedAt
sheetSchema.index({ workspaceId: 1, updatedAt: -1 });

const Sheet = mongoose.model<ISheet>('Sheet', sheetSchema);

export default Sheet;
