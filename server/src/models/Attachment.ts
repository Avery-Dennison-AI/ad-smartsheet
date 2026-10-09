import mongoose, { Schema, Document } from 'mongoose';

export interface IAttachment extends Document {
  sheetId: mongoose.Types.ObjectId;
  rowId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  originalName: string;
  storageKey: string;
  contentType: string;
  size: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    sheetId: { type: Schema.Types.ObjectId, ref: 'Sheet', required: true, index: true },
    rowId: { type: Schema.Types.ObjectId, ref: 'Row', required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    originalName: { type: String, required: true },
    storageKey: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Compound index for efficient queries by row
attachmentSchema.index({ rowId: 1, createdAt: -1 });

const Attachment = mongoose.model<IAttachment>('Attachment', attachmentSchema);

export default Attachment;
