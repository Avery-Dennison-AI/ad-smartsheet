import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchComments as fetchCommentsApi,
  postComment as postCommentApi,
  patchComment as patchCommentApi,
  deleteComment as deleteCommentApi,
} from '../../services/commentService';
import type { FormattedComment } from '../../types';
import type { RootState } from '../store';

interface RowCommentsState {
  comments: FormattedComment[];
  loading: boolean;
  error: string | null;
}

interface CommentsState {
  byRowId: Record<string, RowCommentsState>;
}

const initialState: CommentsState = {
  byRowId: {},
};

function getRowState(state: CommentsState, rowId: string): RowCommentsState {
  return state.byRowId[rowId] ?? { comments: [], loading: false, error: null };
}

// ─── Thunks ─────────────────────────────────────────────────────────────────

export const loadComments = createAsyncThunk(
  'comments/load',
  async ({ sheetId, rowId }: { sheetId: string; rowId: string }) => {
    const result = await fetchCommentsApi(sheetId, rowId);
    return { rowId, comments: result.comments };
  },
);

export const addComment = createAsyncThunk(
  'comments/add',
  async ({ sheetId, rowId, body, parentId }: { sheetId: string; rowId: string; body: string; parentId?: string }) => {
    const comment = await postCommentApi(sheetId, rowId, body, parentId);
    return { rowId, comment, parentId };
  },
);

export const editComment = createAsyncThunk(
  'comments/edit',
  async ({ commentId, body, rowId }: { commentId: string; body: string; rowId: string }) => {
    const updated = await patchCommentApi(commentId, body);
    return { rowId, comment: updated };
  },
);

export const removeComment = createAsyncThunk(
  'comments/remove',
  async ({ commentId, rowId }: { commentId: string; rowId: string }) => {
    await deleteCommentApi(commentId);
    return { rowId, commentId };
  },
);

// ─── Helpers to update nested replies ───────────────────────────────────────

function addReplyToParent(comments: FormattedComment[], parentId: string, reply: FormattedComment): FormattedComment[] {
  return comments.map((c) => {
    if (c._id === parentId) {
      return { ...c, replies: [...(c.replies ?? []), reply] };
    }
    if ((c.replies ?? []).length > 0) {
      return { ...c, replies: addReplyToParent(c.replies ?? [], parentId, reply) };
    }
    return c;
  });
}

function updateCommentInTree(comments: FormattedComment[], updated: FormattedComment): FormattedComment[] {
  return comments.map((c) => {
    if (c._id === updated._id) return updated;
    if ((c.replies ?? []).length > 0) {
      return { ...c, replies: updateCommentInTree(c.replies ?? [], updated) };
    }
    return c;
  });
}

function softDeleteInTree(comments: FormattedComment[], commentId: string): FormattedComment[] {
  return comments.map((c) => {
    if (c._id === commentId) {
      return { ...c, deletedAt: new Date().toISOString(), body: '' };
    }
    if ((c.replies ?? []).length > 0) {
      return { ...c, replies: softDeleteInTree(c.replies ?? [], commentId) };
    }
    return c;
  });
}

// ─── Slice ──────────────────────────────────────────────────────────────────

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // loadComments
    builder.addCase(loadComments.pending, (state, action) => {
      const { rowId } = action.meta.arg;
      state.byRowId[rowId] = { ...getRowState(state, rowId), loading: true, error: null };
    });
    builder.addCase(loadComments.fulfilled, (state, action) => {
      const { rowId, comments } = action.payload;
      const normalized = comments.map((c) => ({ ...c, replies: c.replies ?? [] }));
      state.byRowId[rowId] = { comments: normalized, loading: false, error: null };
    });
    builder.addCase(loadComments.rejected, (state, action) => {
      const { rowId } = action.meta.arg;
      state.byRowId[rowId] = { ...getRowState(state, rowId), loading: false, error: action.error.message ?? 'Failed to load comments' };
    });

    // addComment
    builder.addCase(addComment.fulfilled, (state, action) => {
      const { rowId, comment, parentId } = action.payload;
      const rs = getRowState(state, rowId);
      const safeComment = { ...comment, replies: comment.replies ?? [] };
      if (parentId) {
        state.byRowId[rowId] = { ...rs, comments: addReplyToParent(rs.comments, parentId, safeComment) };
      } else {
        state.byRowId[rowId] = { ...rs, comments: [...rs.comments, safeComment] };
      }
    });

    // editComment
    builder.addCase(editComment.fulfilled, (state, action) => {
      const { rowId, comment } = action.payload;
      const rs = getRowState(state, rowId);
      const safeComment = { ...comment, replies: comment.replies ?? [] };
      state.byRowId[rowId] = { ...rs, comments: updateCommentInTree(rs.comments, safeComment) };
    });

    // removeComment
    builder.addCase(removeComment.fulfilled, (state, action) => {
      const { rowId, commentId } = action.payload;
      const rs = getRowState(state, rowId);
      state.byRowId[rowId] = { ...rs, comments: softDeleteInTree(rs.comments, commentId) };
    });
  },
});

// ─── Selectors ──────────────────────────────────────────────────────────────

export const selectCommentsForRow = (state: RootState, rowId: string): RowCommentsState => {
  return state.comments.byRowId[rowId] ?? { comments: [], loading: false, error: null };
};

export default commentsSlice.reducer;
