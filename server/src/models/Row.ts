import mongoose, { Schema, Document } from 'mongoose';

export interface IRow extends Document {
  sheetId: mongoose.Types.ObjectId;
  order: number;
  cells: Map<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const rowSchema = new Schema<IRow>(
  {
    sheetId: { type: Schema.Types.ObjectId, ref: 'Sheet', required: true, index: true },
    order: { type: Number, required: true },
    cells: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

// Compound index for efficient queries by sheet sorted by order
rowSchema.index({ sheetId: 1, order: 1 });

const Row = mongoose.model<IRow>('Row', rowSchema);

export default Row;
