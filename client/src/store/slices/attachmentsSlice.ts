import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  listAttachments as listAttachmentsApi,
  uploadAttachments as uploadAttachmentsApi,
  deleteAttachment as deleteAttachmentApi,
} from '../../services/attachmentService';
import type { FormattedAttachment } from '../../types';
import type { RootState } from '../store';

// ─── State shape ────────────────────────────────────────────────────────────

interface RowAttachmentsState {
  items: FormattedAttachment[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  uploadProgress: Record<string, number>;
}

interface AttachmentsState {
  byRowId: Record<string, RowAttachmentsState>;
}

const initialState: AttachmentsState = {
  byRowId: {},
};

const EMPTY_ROW_STATE: RowAttachmentsState = {
  items: [],
  loading: false,
  uploading: false,
  error: null,
  uploadProgress: {},
};

function getRowState(state: AttachmentsState, rowId: string): RowAttachmentsState {
  return state.byRowId[rowId] ?? EMPTY_ROW_STATE;
}

// ─── Thunks ─────────────────────────────────────────────────────────────────

export const loadAttachments = createAsyncThunk(
  'attachments/load',
  async ({ sheetId, rowId }: { sheetId: string; rowId: string }) => {
    const items = await listAttachmentsApi(sheetId, rowId);
    return { rowId, items };
  },
);

export const uploadAttachments = createAsyncThunk(
  'attachments/upload',
  async (
    { sheetId, rowId, files }: { sheetId: string; rowId: string; files: File[] },
    { dispatch },
  ) => {
    // Set initial progress for each file
    const progressMap: Record<string, number> = {};
    for (let i = 0; i < files.length; i++) {
      progressMap[`${rowId}-${i}`] = 0;
    }
    dispatch(setUploadProgress({ rowId, progress: progressMap }));

    const created = await uploadAttachmentsApi(sheetId, rowId, files, (_fileIdx, pct) => {
      // Update progress via a separate action
      dispatch(updateSingleProgress({ rowId, key: `${rowId}-${_fileIdx}`, percent: pct }));
    });

    return { rowId, created };
  },
);

export const removeAttachment = createAsyncThunk(
  'attachments/remove',
  async ({ attachmentId, rowId }: { attachmentId: string; rowId: string }) => {
    await deleteAttachmentApi(attachmentId);
    return { rowId, attachmentId };
  },
);

// ─── Slice ──────────────────────────────────────────────────────────────────

const attachmentsSlice = createSlice({
  name: 'attachments',
  initialState,
  reducers: {
    setUploadProgress(state, action: { payload: { rowId: string; progress: Record<string, number> } }) {
      const { rowId, progress } = action.payload;
      if (!state.byRowId[rowId]) {
        state.byRowId[rowId] = { ...EMPTY_ROW_STATE };
      }
      state.byRowId[rowId].uploadProgress = progress;
    },
    updateSingleProgress(state, action: { payload: { rowId: string; key: string; percent: number } }) {
      const { rowId, key, percent } = action.payload;
      if (!state.byRowId[rowId]) {
        state.byRowId[rowId] = { ...EMPTY_ROW_STATE };
      }
      state.byRowId[rowId].uploadProgress[key] = percent;
    },
    clearUploadProgress(state, action: { payload: { rowId: string } }) {
      const { rowId } = action.payload;
      if (state.byRowId[rowId]) {
        state.byRowId[rowId].uploadProgress = {};
      }
    },
  },
  extraReducers: (builder) => {
    // loadAttachments
    builder.addCase(loadAttachments.pending, (state, action) => {
      const { rowId } = action.meta.arg;
      state.byRowId[rowId] = { ...getRowState(state, rowId), loading: true, error: null };
    });
    builder.addCase(loadAttachments.fulfilled, (state, action) => {
      const { rowId, items } = action.payload;
      state.byRowId[rowId] = { ...getRowState(state, rowId), items, loading: false, error: null };
    });
    builder.addCase(loadAttachments.rejected, (state, action) => {
      const { rowId } = action.meta.arg;
      state.byRowId[rowId] = {
        ...getRowState(state, rowId),
        loading: false,
        error: action.error.message ?? 'Failed to load attachments',
      };
    });

    // uploadAttachments
    builder.addCase(uploadAttachments.pending, (state, action) => {
      const { rowId } = action.meta.arg;
      if (!state.byRowId[rowId]) {
        state.byRowId[rowId] = { ...EMPTY_ROW_STATE };
      }
      state.byRowId[rowId].uploading = true;
      state.byRowId[rowId].error = null;
    });
    builder.addCase(uploadAttachments.fulfilled, (state, action) => {
      const { rowId, created } = action.payload;
      const rs = getRowState(state, rowId);
      state.byRowId[rowId] = {
        ...rs,
        items: [...created, ...rs.items],
        uploading: false,
        uploadProgress: {},
      };
    });
    builder.addCase(uploadAttachments.rejected, (state, action) => {
      const { rowId } = action.meta.arg;
      const rs = getRowState(state, rowId);
      state.byRowId[rowId] = {
        ...rs,
        uploading: false,
        error: action.error.message ?? 'Upload failed',
        uploadProgress: {},
      };
    });

    // removeAttachment
    builder.addCase(removeAttachment.fulfilled, (state, action) => {
      const { rowId, attachmentId } = action.payload;
      const rs = getRowState(state, rowId);
      state.byRowId[rowId] = {
        ...rs,
        items: rs.items.filter((a) => a.id !== attachmentId),
      };
    });
  },
});

export const { setUploadProgress, updateSingleProgress, clearUploadProgress } = attachmentsSlice.actions;

// ─── Selectors ──────────────────────────────────────────────────────────────

export const selectAttachmentsForRow = (state: RootState, rowId: string): RowAttachmentsState => {
  return state.attachments.byRowId[rowId] ?? EMPTY_ROW_STATE;
};

export const selectAttachmentCount = (state: RootState, rowId: string): number => {
  return (state.attachments.byRowId[rowId]?.items ?? []).length;
};

export const selectUploadProgress = (state: RootState, rowId: string): Record<string, number> => {
  return state.attachments.byRowId[rowId]?.uploadProgress ?? {};
};

export default attachmentsSlice.reducer;
