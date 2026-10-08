import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';
import Comment from '../models/Comment';
import * as commentService from '../services/commentService';

/**
 * GET /api/sheets/:sheetId/rows/:rowId/comments
 * Lists all comments for a row.
 */
export const listCommentsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { sheetId, rowId } = req.params;
  const userId = req.user!.id;

  const comments = await commentService.listComments(sheetId, rowId, userId);
  sendSuccess(res, comments);
});

/**
 * POST /api/sheets/:sheetId/rows/:rowId/comments
 * Creates a new comment on a row.
 */
export const createCommentHandler = asyncHandler(async (req: Request, res: Response) => {
  const { sheetId, rowId } = req.params;
  const userId = req.user!.id;
  const { body, parentId } = req.body;

  const comment = await commentService.createComment(sheetId, rowId, userId, { body, parentId });
  sendSuccess(res, comment, 201);
});

/**
 * PATCH /api/comments/:commentId
 * Edits an existing comment.
 */
export const editCommentHandler = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.id;
  const { body } = req.body;

  const comment = await commentService.editComment(commentId, userId, { body });
  sendSuccess(res, comment);
});

/**
 * DELETE /api/comments/:commentId
 * Soft-deletes a comment.
 */
export const deleteCommentHandler = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.id;

  // Look up the comment to get its sheetId for the admin access check
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  await commentService.deleteComment(commentId, userId, comment.sheetId.toString());
  sendSuccess(res, { deleted: true });
});
