import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  sheetId: mongoose.Types.ObjectId;
  rowId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  body: string;
  mentions: mongoose.Types.ObjectId[];
  parentId: mongoose.Types.ObjectId | null;
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    sheetId: { type: Schema.Types.ObjectId, ref: 'Sheet', required: true, index: true },
    rowId: { type: Schema.Types.ObjectId, ref: 'Row', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, maxlength: 5000 },
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    editedAt: { type: Date, default: undefined },
    deletedAt: { type: Date, default: undefined },
  },
  { timestamps: true },
);

// Compound indexes for efficient queries
commentSchema.index({ rowId: 1, createdAt: 1 });
commentSchema.index({ sheetId: 1, createdAt: 1 });

const Comment = mongoose.model<IComment>('Comment', commentSchema);

export default Comment;
