import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSheetMeta extends Document {
  userId: mongoose.Types.ObjectId;
  sheetId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  isFavorite: boolean;
  lastOpenedAt: Date | null;
}

const userSheetMetaSchema = new Schema<IUserSheetMeta>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sheetId: { type: Schema.Types.ObjectId, ref: 'Sheet', required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    isFavorite: { type: Boolean, default: false },
    lastOpenedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Compound unique index: one meta doc per user+sheet pair
userSheetMetaSchema.index({ userId: 1, sheetId: 1 }, { unique: true });

// Index for efficient recents queries
userSheetMetaSchema.index({ userId: 1, lastOpenedAt: -1 });

// Index for efficient favorites queries
userSheetMetaSchema.index({ userId: 1, isFavorite: 1 });

const UserSheetMeta = mongoose.model<IUserSheetMeta>('UserSheetMeta', userSheetMetaSchema);

export default UserSheetMeta;
