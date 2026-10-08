import mongoose, { Schema, Document } from 'mongoose';

export type ActivityAction =
  | 'row.created'
  | 'row.deleted'
  | 'row.moved'
  | 'row.indented'
  | 'row.outdented'
  | 'cell.updated'
  | 'column.added'
  | 'column.renamed'
  | 'column.deleted'
  | 'sheet.created'
  | 'sheet.renamed'
  | 'sheet.duplicated'
  | 'sharing.changed'
  | 'comment.added'
  | 'comment.edited'
  | 'comment.deleted'
  | 'project.statuses_changed'
  | 'project.item_types_changed';

export interface IActivityLog extends Document {
  sheetId: mongoose.Types.ObjectId;
  rowId?: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  action: ActivityAction;
  details?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    sheetId: { type: Schema.Types.ObjectId, ref: 'Sheet', required: true, index: true },
    rowId: { type: Schema.Types.ObjectId, ref: 'Row', default: undefined },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true },
);

// Compound indexes for efficient queries
activityLogSchema.index({ sheetId: 1, createdAt: -1 });
activityLogSchema.index({ rowId: 1, createdAt: -1 });

const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);

export default ActivityLog;
