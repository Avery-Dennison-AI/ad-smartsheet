import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import * as sheetService from '../../services/sheetService';
import * as sheetSharingService from '../../services/sheetSharingService';
import { parseApiError } from '../../utils/parseApiError';
import type { Sheet, SheetMembersResult, SharedWithMeItem } from '../../types';
import type { RootState } from '../store';

interface SheetsState {
  byId: Record<string, Sheet>;
  byWorkspace: Record<string, string[]>;
  currentSheetId: string | null;
  loading: boolean;
  error: string | null;
  errorStatus?: number;
  sharedWithMe: SharedWithMeItem[];
  sharedWithMeStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  sheetMembers: SheetMembersResult | null;
  sheetMembersStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: SheetsState = {
  byId: {},
  byWorkspace: {},
  currentSheetId: null,
  loading: false,
  error: null,
  errorStatus: undefined,
  sharedWithMe: [],
  sharedWithMeStatus: 'idle',
  sheetMembers: null,
  sheetMembersStatus: 'idle',
};

// ─── Thunks ────────────────────────────────────────────────────────────────

export const fetchSheets = createAsyncThunk(
  'sheets/fetchAll',
  async (workspaceId: string, { rejectWithValue }) => {
    try {
      const { data } = await sheetService.listSheets(workspaceId);
      return { workspaceId, sheets: data.data as Sheet[] };
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const fetchSheet = createAsyncThunk(
  'sheets/fetchOne',
  async (sheetId: string, { rejectWithValue }) => {
    try {
      const { data } = await sheetService.getSheet(sheetId);
      return data.data as Sheet;
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      if (parsed.status === 403 || parsed.status === 404) {
        return rejectWithValue({ status: parsed.status, message: parsed.message });
      }
      throw err;
    }
  },
);

export const createSheet = createAsyncThunk(
  'sheets/create',
  async ({ workspaceId, name }: { workspaceId: string; name: string }) => {
    const res = await sheetService.createSheet(workspaceId, name);
    return res.data.data as Sheet;
  },
);

export const renameSheet = createAsyncThunk(
  'sheets/rename',
  async ({ sheetId, name, description }: { sheetId: string; name?: string; description?: string }) => {
    const res = await sheetService.renameSheet(sheetId, { name, description });
    return res.data.data as Sheet;
  },
);

export const duplicateSheet = createAsyncThunk(
  'sheets/duplicate',
  async (sheetId: string) => {
    const res = await sheetService.duplicateSheet(sheetId);
    return res.data.data as Sheet;
  },
);

export const deleteSheet = createAsyncThunk(
  'sheets/delete',
  async (sheetId: string) => {
    await sheetService.deleteSheet(sheetId);
    return sheetId;
  },
);

export const setFavorite = createAsyncThunk(
  'sheets/setFavorite',
  async ({ sheetId, starred }: { sheetId: string; starred: boolean }) => {
    const res = await sheetService.setFavorite(sheetId, starred);
    return res.data.data as { sheetId: string; isFavorite: boolean };
  },
);

// ─── Sharing Thunks ──────────────────────────────────────────────────────

export const fetchSharedWithMe = createAsyncThunk(
  'sheets/fetchSharedWithMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await sheetSharingService.getSharedWithMe();
      return data.data as SharedWithMeItem[];
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const fetchSheetMembers = createAsyncThunk(
  'sheets/fetchSheetMembers',
  async (sheetId: string, { rejectWithValue }) => {
    try {
      const { data } = await sheetSharingService.getSheetMembers(sheetId);
      return data.data as SheetMembersResult;
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const addSheetMember = createAsyncThunk(
  'sheets/addSheetMember',
  async ({ sheetId, userId, role }: { sheetId: string; userId: string; role: 'viewer' | 'editor' | 'admin' }, { rejectWithValue }) => {
    try {
      const { data } = await sheetSharingService.addSheetMember(sheetId, { userId, role });
      return data.data as SheetMembersResult;
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const updateSheetMemberRole = createAsyncThunk(
  'sheets/updateSheetMemberRole',
  async ({ sheetId, userId, role }: { sheetId: string; userId: string; role: 'viewer' | 'editor' | 'admin' }, { rejectWithValue }) => {
    try {
      const { data } = await sheetSharingService.updateSheetMemberRole(sheetId, userId, role);
      return data.data as SheetMembersResult;
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const removeSheetMember = createAsyncThunk(
  'sheets/removeSheetMember',
  async ({ sheetId, userId }: { sheetId: string; userId: string }, { rejectWithValue }) => {
    try {
      const { data } = await sheetSharingService.removeSheetMember(sheetId, userId);
      return data.data as SheetMembersResult;
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Inserts a sheet into byId and sorts the workspace array by updatedAt desc. */
function upsertSheet(state: SheetsState, sheet: Sheet): void {
  state.byId[sheet.id] = sheet;
  const wsId = sheet.workspaceId;
  if (!state.byWorkspace[wsId]) {
    state.byWorkspace[wsId] = [];
  }
  if (!state.byWorkspace[wsId].includes(sheet.id)) {
    state.byWorkspace[wsId].push(sheet.id);
  }
  // Sort by updatedAt descending
  state.byWorkspace[wsId].sort((a, b) => {
    const dateA = new Date(state.byId[a]?.updatedAt ?? 0).getTime();
    const dateB = new Date(state.byId[b]?.updatedAt ?? 0).getTime();
    return dateB - dateA;
  });
}

// ─── Slice ─────────────────────────────────────────────────────────────────

const sheetsSlice = createSlice({
  name: 'sheets',
  initialState,
  reducers: {
    clearCurrentSheet(state) {
      state.currentSheetId = null;
    },
    upsertSheetAction(state, action: { payload: Sheet }) {
      upsertSheet(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchSheets
      .addCase(fetchSheets.pending, (state) => { state.loading = true; state.error = null; state.errorStatus = undefined; })
      .addCase(fetchSheets.fulfilled, (state, action) => {
        state.loading = false;
        const { workspaceId, sheets } = action.payload;
        state.byWorkspace[workspaceId] = sheets.map((s) => s.id);
        for (const sheet of sheets) {
          state.byId[sheet.id] = sheet;
        }
      })
      .addCase(fetchSheets.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load sheets';
      })
      // fetchSheet
      .addCase(fetchSheet.pending, (state) => { state.loading = true; state.error = null; state.errorStatus = undefined; })
      .addCase(fetchSheet.fulfilled, (state, action) => {
        state.loading = false;
        const sheet = action.payload;
        state.byId[sheet.id] = sheet;
        state.currentSheetId = sheet.id;
        // Ensure it's in the workspace array
        const wsId = sheet.workspaceId;
        if (!state.byWorkspace[wsId]) {
          state.byWorkspace[wsId] = [];
        }
        if (!state.byWorkspace[wsId].includes(sheet.id)) {
          state.byWorkspace[wsId].push(sheet.id);
        }
      })
      .addCase(fetchSheet.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { status?: number; message?: string } | undefined;
        state.error = payload?.message || 'Failed to load sheet';
        state.errorStatus = payload?.status;
      })
      // createSheet
      .addCase(createSheet.fulfilled, (state, action) => {
        upsertSheet(state, action.payload);
      })
      // renameSheet
      .addCase(renameSheet.fulfilled, (state, action) => {
        upsertSheet(state, action.payload);
      })
      // duplicateSheet
      .addCase(duplicateSheet.fulfilled, (state, action) => {
        upsertSheet(state, action.payload);
      })
      // deleteSheet
      .addCase(deleteSheet.fulfilled, (state, action) => {
        const sheetId = action.payload;
        const sheet = state.byId[sheetId];
        if (sheet) {
          const wsId = sheet.workspaceId;
          if (state.byWorkspace[wsId]) {
            state.byWorkspace[wsId] = state.byWorkspace[wsId].filter((id) => id !== sheetId);
          }
        }
        delete state.byId[sheetId];
        if (state.currentSheetId === sheetId) {
          state.currentSheetId = null;
        }
      })
      // fetchSharedWithMe
      .addCase(fetchSharedWithMe.pending, (state) => { state.sharedWithMeStatus = 'loading'; })
      .addCase(fetchSharedWithMe.fulfilled, (state, action) => {
        state.sharedWithMeStatus = 'succeeded';
        state.sharedWithMe = action.payload;
      })
      .addCase(fetchSharedWithMe.rejected, (state) => { state.sharedWithMeStatus = 'failed'; })
      // fetchSheetMembers
      .addCase(fetchSheetMembers.pending, (state) => { state.sheetMembersStatus = 'loading'; state.sheetMembers = null; })
      .addCase(fetchSheetMembers.fulfilled, (state, action) => {
        state.sheetMembersStatus = 'succeeded';
        state.sheetMembers = action.payload;
      })
      .addCase(fetchSheetMembers.rejected, (state) => { state.sheetMembersStatus = 'failed'; })
      // addSheetMember
      .addCase(addSheetMember.fulfilled, (state, action) => {
        state.sheetMembers = action.payload;
      })
      // updateSheetMemberRole
      .addCase(updateSheetMemberRole.fulfilled, (state, action) => {
        state.sheetMembers = action.payload;
      })
      // removeSheetMember
      .addCase(removeSheetMember.fulfilled, (state, action) => {
        state.sheetMembers = action.payload;
      });
  },
});

export const { clearCurrentSheet, upsertSheetAction } = sheetsSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────

export const selectSheetsLoading = (state: RootState) => state.sheets.loading;
export const selectSheetsError = (state: RootState) => state.sheets.error;
export const selectSheetsErrorStatus = (state: RootState) => state.sheets.errorStatus;
export const selectCurrentSheetId = (state: RootState) => state.sheets.currentSheetId;

export const selectCurrentSheet = (state: RootState) => {
  const id = state.sheets.currentSheetId;
  return id ? state.sheets.byId[id] ?? null : null;
};

export const selectSheetsByWorkspace = createSelector(
  [(state: RootState) => state.sheets.byId,
   (state: RootState, workspaceId: string) => state.sheets.byWorkspace[workspaceId]],
  (byId, ids) => (ids ?? []).map(id => byId[id]).filter(Boolean) as Sheet[],
);

export const selectSharedWithMe = (state: RootState) => state.sheets.sharedWithMe;
export const selectSharedWithMeStatus = (state: RootState) => state.sheets.sharedWithMeStatus;
export const selectSheetMembers = (state: RootState) => state.sheets.sheetMembers;
export const selectSheetMembersStatus = (state: RootState) => state.sheets.sheetMembersStatus;

export default sheetsSlice.reducer;
