import mongoose from 'mongoose';
import Comment from '../models/Comment';
import { requireSheetAccess } from './permissionService';
import { recordActivity } from './activityService';
import { AppError } from '../utils/AppError';

// ─── Mention parsing ────────────────────────────────────────────────────────

/** Regex to extract @[Name](userId) mentions from comment body. */
const MENTION_REGEX = /@\[([^\]]+)\]\(([a-f0-9]{24})\)/g;

/**
 * Parses @[Name](userId) patterns from a comment body and returns
 * an array of valid MongoDB ObjectId strings.
 */
function parseMentionIds(body: string): string[] {
  const ids: string[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(MENTION_REGEX);
  while ((match = regex.exec(body)) !== null) {
    const userId = match[2];
    if (mongoose.Types.ObjectId.isValid(userId)) {
      ids.push(userId);
    }
  }
  return ids;
}

/**
 * Filters mention user IDs to only those who have viewer-or-above access
 * to the sheet. Silently drops users who fail the access check.
 */
async function filterMentionsByAccess(
  mentionIds: string[],
  sheetId: string,
): Promise<mongoose.Types.ObjectId[]> {
  const filtered: mongoose.Types.ObjectId[] = [];
  for (const userId of mentionIds) {
    try {
      await requireSheetAccess(userId, sheetId, 'viewer');
      filtered.push(new mongoose.Types.ObjectId(userId));
    } catch {
      // User has no access — silently drop this mention
    }
  }
  return filtered;
}

// ─── Formatting ─────────────────────────────────────────────────────────────

interface FormattedComment {
  id: string;
  sheetId: string;
  rowId: string;
  authorId: string;
  authorName: string;
  body: string;
  mentions: Array<{ _id: string; name: string }>;
  parentId: string | null;
  editedAt: Date | null;
  deletedAt: Date | null;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  replies?: FormattedComment[];
}

function formatComment(doc: any, isDeletedOverride = false): FormattedComment {
  const author = doc.authorId as { _id?: mongoose.Types.ObjectId; fullName?: string; deletedAt?: Date } | string;
  let authorName: string;
  let authorIdStr: string;

  if (author && typeof author === 'object' && 'fullName' in author) {
    const name = author.fullName ?? 'Unknown';
    authorName = author.deletedAt ? `${name} (deleted)` : name;
    authorIdStr = author._id ? author._id.toString() : '';
  } else {
    authorName = 'Unknown';
    authorIdStr = String(author);
  }

  const mentions = Array.isArray(doc.mentions)
    ? doc.mentions.map((m: any) => ({
        _id: m._id ? m._id.toString() : String(m),
        name: m.fullName ?? m.name ?? 'Unknown',
      }))
    : [];

  const isDeleted = isDeletedOverride || !!doc.deletedAt;

  return {
    id: doc._id.toString(),
    sheetId: doc.sheetId.toString(),
    rowId: doc.rowId.toString(),
    authorId: authorIdStr,
    authorName,
    body: isDeleted ? '' : (doc.body ?? ''),
    mentions,
    parentId: doc.parentId ? doc.parentId.toString() : null,
    editedAt: doc.editedAt ?? null,
    deletedAt: doc.deletedAt ?? null,
    deleted: isDeleted,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// ─── listComments ───────────────────────────────────────────────────────────

/**
 * Lists all non-deleted top-level comments for a row with their replies.
 * Deleted comments that have visible replies are returned with body="" and deleted=true.
 * Completely deleted childless comments are omitted.
 */
export async function listComments(
  sheetId: string,
  rowId: string,
  userId: string,
): Promise<FormattedComment[]> {
  await requireSheetAccess(userId, sheetId, 'viewer');

  // Fetch all top-level comments (including soft-deleted ones that might have replies)
  const topLevelComments = await Comment.find({
    sheetId: new mongoose.Types.ObjectId(sheetId),
    rowId: new mongoose.Types.ObjectId(rowId),
    parentId: null,
  })
    .sort({ createdAt: 1 })
    .populate('authorId', 'fullName deletedAt')
    .populate('mentions', '_id fullName')
    .lean();

  const result: FormattedComment[] = [];

  for (const comment of topLevelComments) {
    // Fetch replies for this top-level comment
    const replies = await Comment.find({
      parentId: comment._id,
      deletedAt: null,
    })
      .sort({ createdAt: 1 })
      .populate('authorId', 'fullName deletedAt')
      .populate('mentions', '_id fullName')
      .lean();

    // If comment is deleted and has no replies, skip it entirely
    if (comment.deletedAt && replies.length === 0) {
      continue;
    }

    const formatted = formatComment(comment);
    formatted.replies = replies.map((r) => formatComment(r));
    result.push(formatted);
  }

  return result;
}

// ─── createComment ──────────────────────────────────────────────────────────

/**
 * Creates a new comment on a row. Supports optional parentId for replies.
 * Only one level of replies is allowed (replies to replies are rejected).
 */
export async function createComment(
  sheetId: string,
  rowId: string,
  userId: string,
  input: { body: string; parentId?: string },
): Promise<FormattedComment> {
  await requireSheetAccess(userId, sheetId, 'editor');

  let parentIdObj: mongoose.Types.ObjectId | null = null;

  if (input.parentId) {
    if (!mongoose.Types.ObjectId.isValid(input.parentId)) {
      throw new AppError('Invalid parent comment ID', 400);
    }

    const parentComment = await Comment.findById(input.parentId);
    if (!parentComment) {
      throw new AppError('Parent comment not found', 404);
    }

    // Verify parent is a top-level comment (no parentId itself)
    if (parentComment.parentId) {
      throw new AppError('Cannot reply to a reply — only one level of nesting is allowed', 400);
    }

    // Verify parent is on the same row
    if (parentComment.rowId.toString() !== rowId) {
      throw new AppError('Parent comment is not on this row', 400);
    }

    parentIdObj = new mongoose.Types.ObjectId(input.parentId);
  }

  // Parse and filter mentions
  const rawMentionIds = parseMentionIds(input.body);
  const filteredMentions = await filterMentionsByAccess(rawMentionIds, sheetId);

  const comment = await Comment.create({
    sheetId: new mongoose.Types.ObjectId(sheetId),
    rowId: new mongoose.Types.ObjectId(rowId),
    authorId: new mongoose.Types.ObjectId(userId),
    body: input.body,
    mentions: filteredMentions,
    parentId: parentIdObj,
  });

  // Record activity (fire-and-forget)
  try {
    recordActivity({
      sheetId,
      rowId,
      actorId: userId,
      action: 'comment.added',
      details: { commentId: comment._id.toString(), bodyPreview: input.body.slice(0, 100) },
    });
  } catch (err) {
    console.error('[commentService] Failed to record comment.added activity:', err);
  }

  // Populate and return
  const populated = await Comment.findById(comment._id)
    .populate('authorId', 'fullName deletedAt')
    .populate('mentions', '_id fullName');

  if (!populated) throw new AppError('Failed to create comment', 500);
  return formatComment(populated.toObject());
}

// ─── editComment ────────────────────────────────────────────────────────────

/**
 * Edits an existing comment's body. Only the original author can edit.
 * Re-parses and re-filters mentions.
 */
export async function editComment(
  commentId: string,
  userId: string,
  input: { body: string },
): Promise<FormattedComment> {
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new AppError('Invalid comment ID', 400);
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  if (comment.authorId.toString() !== userId) {
    throw new AppError('Only the author can edit this comment', 403);
  }

  // Re-parse and filter mentions
  const rawMentionIds = parseMentionIds(input.body);
  const filteredMentions = await filterMentionsByAccess(rawMentionIds, comment.sheetId.toString());

  comment.body = input.body;
  comment.mentions = filteredMentions;
  comment.editedAt = new Date();
  await comment.save();

  // Record activity (fire-and-forget)
  try {
    recordActivity({
      sheetId: comment.sheetId.toString(),
      rowId: comment.rowId.toString(),
      actorId: userId,
      action: 'comment.edited',
      details: { commentId: comment._id.toString(), bodyPreview: input.body.slice(0, 100) },
    });
  } catch (err) {
    console.error('[commentService] Failed to record comment.edited activity:', err);
  }

  // Populate and return
  const populated = await Comment.findById(comment._id)
    .populate('authorId', 'fullName deletedAt')
    .populate('mentions', '_id fullName');

  if (!populated) throw new AppError('Failed to update comment', 500);
  return formatComment(populated.toObject());
}

// ─── deleteComment ──────────────────────────────────────────────────────────

/**
 * Soft-deletes a comment. Allowed if the user is the author OR has admin+ on the sheet.
 * Replies are NOT deleted — they remain visible.
 */
export async function deleteComment(
  commentId: string,
  userId: string,
  sheetId: string,
): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new AppError('Invalid comment ID', 400);
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  const isAuthor = comment.authorId.toString() === userId;

  if (!isAuthor) {
    // Check if user has admin-or-above on the sheet
    try {
      await requireSheetAccess(userId, sheetId, 'admin');
    } catch {
      throw new AppError('Not authorized to delete this comment', 403);
    }
  }

  comment.deletedAt = new Date();
  await comment.save();

  // Record activity (fire-and-forget)
  try {
    recordActivity({
      sheetId: comment.sheetId.toString(),
      rowId: comment.rowId.toString(),
      actorId: userId,
      action: 'comment.deleted',
      details: { commentId: comment._id.toString() },
    });
  } catch (err) {
    console.error('[commentService] Failed to record comment.deleted activity:', err);
  }
}

// ─── getCommentCountsByRow ──────────────────────────────────────────────────

/**
 * Aggregates comment counts by rowId for a set of rows within a sheet.
 * Returns a Map of rowId → count for non-deleted comments.
 */
export async function getCommentCountsByRow(
  sheetId: string,
  rowIds: string[],
): Promise<Map<string, number>> {
  if (rowIds.length === 0) return new Map();

  const objectIds = rowIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (objectIds.length === 0) return new Map();

  const results = await Comment.aggregate([
    {
      $match: {
        sheetId: new mongoose.Types.ObjectId(sheetId),
        rowId: { $in: objectIds },
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: '$rowId',
        count: { $sum: 1 },
      },
    },
  ]);

  const map = new Map<string, number>();
  for (const entry of results) {
    map.set(entry._id.toString(), entry.count);
  }
  return map;
}
