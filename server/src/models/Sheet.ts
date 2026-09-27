import mongoose, { Schema, Document } from 'mongoose';

export interface ISheet extends Document {
  workspaceId: mongoose.Types.ObjectId;
  name: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const sheetSchema = new Schema<ISheet>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: true, maxlength: 100, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

// Compound index for efficient listing by workspace sorted by updatedAt
sheetSchema.index({ workspaceId: 1, updatedAt: -1 });

const Sheet = mongoose.model<ISheet>('Sheet', sheetSchema);

export default Sheet;
