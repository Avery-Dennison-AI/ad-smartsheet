import mongoose, { Schema, Document } from 'mongoose';

export interface IRow extends Document {
  sheetId: mongoose.Types.ObjectId;
  order: number;
  cells: Map<string, unknown>;
  formatting: Map<string, Record<string, unknown>>;
  height?: number;
  parentId: mongoose.Types.ObjectId | null;
  depth: number;
  createdAt: Date;
  updatedAt: Date;
}

const rowSchema = new Schema<IRow>(
  {
    sheetId: { type: Schema.Types.ObjectId, ref: 'Sheet', required: true, index: true },
    order: { type: Number, required: true },
    cells: { type: Schema.Types.Mixed, default: {} },
    formatting: { type: Map, of: Schema.Types.Mixed, default: () => new Map() },
    height: { type: Number, default: undefined, min: 34, max: 400 },
    parentId: { type: Schema.Types.ObjectId, ref: 'Row', default: null },
    depth: { type: Number, default: 0, min: 0, max: 10 },
  },
  { timestamps: true },
);

// Compound index for efficient queries by sheet sorted by order
rowSchema.index({ sheetId: 1, order: 1 });

const Row = mongoose.model<IRow>('Row', rowSchema);

export default Row;
