import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as sheetService from '../../services/sheetService';
import { parseApiError } from '../../utils/parseApiError';
import type { Sheet } from '../../types';
import type { RootState } from '../store';

interface SheetsState {
  byId: Record<string, Sheet>;
  byWorkspace: Record<string, string[]>;
  currentSheetId: string | null;
  loading: boolean;
  error: string | null;
  errorStatus?: number;
}

const initialState: SheetsState = {
  byId: {},
  byWorkspace: {},
  currentSheetId: null,
  loading: false,
  error: null,
  errorStatus: undefined,
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
      });
  },
});

export const { clearCurrentSheet } = sheetsSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────

export const selectSheetsLoading = (state: RootState) => state.sheets.loading;
export const selectSheetsError = (state: RootState) => state.sheets.error;
export const selectSheetsErrorStatus = (state: RootState) => state.sheets.errorStatus;
export const selectCurrentSheetId = (state: RootState) => state.sheets.currentSheetId;

export const selectCurrentSheet = (state: RootState) => {
  const id = state.sheets.currentSheetId;
  return id ? state.sheets.byId[id] ?? null : null;
};

export const selectSheetsByWorkspace = (workspaceId: string) => (state: RootState) => {
  const ids = state.sheets.byWorkspace[workspaceId] ?? [];
  return ids.map((id) => state.sheets.byId[id]).filter(Boolean) as Sheet[];
};

export default sheetsSlice.reducer;
