import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import * as gridService from '../../services/gridService';
import { parseApiError } from '../../utils/parseApiError';
import type { Column, GridRow, CellFormatting } from '../../types';
import type { RootState } from '../store';

interface GridMember {
  id: string;
  fullName: string;
  email: string;
}

interface GridSliceState {
  columns: Column[];
  rows: GridRow[];
  members: GridMember[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveError: string | null;
  errorStatus?: number;
}

const initialState: GridSliceState = {
  columns: [],
  rows: [],
  members: [],
  loading: false,
  saving: false,
  error: null,
  saveError: null,
  errorStatus: undefined,
};

// ─── Thunks ────────────────────────────────────────────────────────────────

export const fetchGrid = createAsyncThunk(
  'grid/fetch',
  async (sheetId: string, { rejectWithValue }) => {
    try {
      const { data } = await gridService.getGrid(sheetId);
      const payload = data.data as { columns: Column[]; rows: GridRow[]; members?: GridMember[] };
      return { columns: payload.columns, rows: payload.rows, members: payload.members ?? [] };
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      return rejectWithValue({ status: parsed.status, message: parsed.message });
    }
  },
);

export const addColumn = createAsyncThunk(
  'grid/addColumn',
  async (
    { sheetId, data }: { sheetId: string; data: { name: string; type: string; position?: number; options?: { label: string; color: string }[] } },
    { rejectWithValue },
  ) => {
    try {
      const res = await gridService.addColumn(sheetId, data);
      // Server now returns the full sorted column list
      return res.data.data as Column[];
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const updateColumn = createAsyncThunk(
  'grid/updateColumn',
  async (
    { sheetId, columnId, patch }: { sheetId: string; columnId: string; patch: { name?: string; type?: string; options?: { label: string; color: string }[] } },
    { rejectWithValue },
  ) => {
    try {
      const res = await gridService.updateColumn(sheetId, columnId, patch);
      return res.data.data as Column;
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const deleteColumn = createAsyncThunk(
  'grid/deleteColumn',
  async ({ sheetId, columnId }: { sheetId: string; columnId: string }, { rejectWithValue }) => {
    try {
      await gridService.deleteColumn(sheetId, columnId);
      return columnId;
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const reorderColumns = createAsyncThunk(
  'grid/reorderColumns',
  async ({ sheetId, orderedIds }: { sheetId: string; orderedIds: string[] }, { rejectWithValue }) => {
    try {
      const res = await gridService.reorderColumns(sheetId, orderedIds);
      return res.data.data as Column[];
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const setPrimaryColumn = createAsyncThunk(
  'grid/setPrimaryColumn',
  async ({ sheetId, columnId }: { sheetId: string; columnId: string }, { rejectWithValue }) => {
    try {
      const res = await gridService.setPrimaryColumn(sheetId, columnId);
      return res.data.data as Column[];
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const addRow = createAsyncThunk(
  'grid/addRow',
  async (
    { sheetId, data }: { sheetId: string; data?: { afterRowId?: string; cells?: Record<string, unknown> } },
    { rejectWithValue },
  ) => {
    try {
      const res = await gridService.addRow(sheetId, data);
      return res.data.data as GridRow;
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const updateCell = createAsyncThunk(
  'grid/updateCell',
  async (
    { sheetId, rowId, columnId, value }: { sheetId: string; rowId: string; columnId: string; value: unknown },
    { rejectWithValue },
  ) => {
    try {
      const res = await gridService.updateCell(sheetId, rowId, columnId, value);
      return res.data.data as { rowId: string; columnId: string; value: unknown };
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const deleteRows = createAsyncThunk(
  'grid/deleteRows',
  async ({ sheetId, rowIds }: { sheetId: string; rowIds: string[] }, { rejectWithValue }) => {
    try {
      await gridService.deleteRows(sheetId, rowIds);
      return rowIds;
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const reorderRows = createAsyncThunk(
  'grid/reorderRows',
  async ({ sheetId, orderedIds }: { sheetId: string; orderedIds: string[] }, { rejectWithValue }) => {
    try {
      await gridService.reorderRows(sheetId, orderedIds);
      return orderedIds;
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

// ─── Slice ─────────────────────────────────────────────────────────────────

const gridSlice = createSlice({
  name: 'grid',
  initialState,
  reducers: {
    clearGrid(state) {
      state.columns = [];
      state.rows = [];
      state.members = [];
      state.error = null;
      state.saveError = null;
      state.errorStatus = undefined;
    },
    optimisticUpdateCell(
      state,
      action: PayloadAction<{ rowId: string; columnId: string; value: unknown }>,
    ) {
      const row = state.rows.find((r) => r.id === action.payload.rowId);
      if (row) {
        row.cells[action.payload.columnId] = action.payload.value as string | number | boolean | null;
      }
    },
    rollbackCell(
      state,
      action: PayloadAction<{ rowId: string; columnId: string; previousValue: unknown }>,
    ) {
      const row = state.rows.find((r) => r.id === action.payload.rowId);
      if (row) {
        row.cells[action.payload.columnId] = action.payload.previousValue as string | number | boolean | null;
      }
    },
    clearSaveError(state) {
      state.saveError = null;
    },
    optimisticApplyFormatting(
      state,
      action: PayloadAction<Array<{ rowId: string; columnId: string; formatting: CellFormatting | null }>>,
    ) {
      for (const entry of action.payload) {
        const row = state.rows.find((r) => r.id === entry.rowId);
        if (row) {
          if (!row.formatting) row.formatting = {};
          if (entry.formatting && Object.keys(entry.formatting).length > 0) {
            row.formatting[entry.columnId] = entry.formatting;
          } else {
            delete row.formatting[entry.columnId];
          }
        }
      }
    },
    rollbackFormatting(
      state,
      action: PayloadAction<Array<{ rowId: string; columnId: string; prev: CellFormatting | undefined }>>,
    ) {
      for (const entry of action.payload) {
        const row = state.rows.find((r) => r.id === entry.rowId);
        if (row) {
          if (!row.formatting) row.formatting = {};
          if (entry.prev) {
            row.formatting[entry.columnId] = entry.prev;
          } else {
            delete row.formatting[entry.columnId];
          }
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchGrid
      .addCase(fetchGrid.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.errorStatus = undefined;
      })
      .addCase(fetchGrid.fulfilled, (state, action) => {
        state.loading = false;
        state.columns = action.payload.columns;
        state.rows = action.payload.rows;
        state.members = action.payload.members;
      })
      .addCase(fetchGrid.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { status?: number; message?: string } | undefined;
        state.error = payload?.message || 'Failed to load grid';
        state.errorStatus = payload?.status;
      })
      // addColumn
      .addCase(addColumn.pending, (state) => { state.saving = true; state.saveError = null; })
      .addCase(addColumn.fulfilled, (state, action) => {
        state.saving = false;
        // Replace with full server-returned column list (already sorted by order)
        state.columns = action.payload;
      })
      .addCase(addColumn.rejected, (state, action) => {
        state.saving = false;
        state.saveError = (action.payload as string) || 'Failed to add column';
      })
      // updateColumn
      .addCase(updateColumn.pending, (state) => { state.saving = true; state.saveError = null; })
      .addCase(updateColumn.fulfilled, (state, action) => {
        state.saving = false;
        const idx = state.columns.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.columns[idx] = action.payload;
      })
      .addCase(updateColumn.rejected, (state, action) => {
        state.saving = false;
        state.saveError = (action.payload as string) || 'Failed to update column';
      })
      // deleteColumn
      .addCase(deleteColumn.pending, (state) => { state.saving = true; state.saveError = null; })
      .addCase(deleteColumn.fulfilled, (state, action) => {
        state.saving = false;
        state.columns = state.columns.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteColumn.rejected, (state, action) => {
        state.saving = false;
        state.saveError = (action.payload as string) || 'Failed to delete column';
      })
      // reorderColumns
      .addCase(reorderColumns.pending, (state) => { state.saving = true; state.saveError = null; })
      .addCase(reorderColumns.fulfilled, (state, action) => {
        state.saving = false;
        state.columns = action.payload;
      })
      .addCase(reorderColumns.rejected, (state, action) => {
        state.saving = false;
        state.saveError = (action.payload as string) || 'Failed to reorder columns';
      })
      // setPrimaryColumn
      .addCase(setPrimaryColumn.pending, (state) => { state.saving = true; state.saveError = null; })
      .addCase(setPrimaryColumn.fulfilled, (state, action) => {
        state.saving = false;
        state.columns = action.payload;
      })
      .addCase(setPrimaryColumn.rejected, (state, action) => {
        state.saving = false;
        state.saveError = (action.payload as string) || 'Failed to set primary column';
      })
      // addRow
      .addCase(addRow.pending, (state) => { state.saving = true; state.saveError = null; })
      .addCase(addRow.fulfilled, (state, action) => {
        state.saving = false;
        state.rows.push(action.payload);
        state.rows.sort((a, b) => a.order - b.order);
      })
      .addCase(addRow.rejected, (state, action) => {
        state.saving = false;
        state.saveError = (action.payload as string) || 'Failed to add row';
      })
      // updateCell
      .addCase(updateCell.pending, (state) => { state.saving = true; state.saveError = null; })
      .addCase(updateCell.fulfilled, (state, action) => {
        state.saving = false;
        const { rowId, columnId, value } = action.payload;
        const row = state.rows.find((r) => r.id === rowId);
        if (row) {
          row.cells[columnId] = value as string | number | boolean | null;
        }
      })
      .addCase(updateCell.rejected, (state, action) => {
        state.saving = false;
        state.saveError = (action.payload as string) || 'Failed to update cell';
      })
      // deleteRows
      .addCase(deleteRows.pending, (state) => { state.saving = true; state.saveError = null; })
      .addCase(deleteRows.fulfilled, (state, action) => {
        state.saving = false;
        const deletedIds = new Set(action.payload);
        state.rows = state.rows.filter((r) => !deletedIds.has(r.id));
      })
      .addCase(deleteRows.rejected, (state, action) => {
        state.saving = false;
        state.saveError = (action.payload as string) || 'Failed to delete rows';
      })
      // reorderRows
      .addCase(reorderRows.pending, (state) => { state.saving = true; state.saveError = null; })
      .addCase(reorderRows.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(reorderRows.rejected, (state, action) => {
        state.saving = false;
        state.saveError = (action.payload as string) || 'Failed to reorder rows';
      })
      // applyFormatting
      .addCase(applyFormatting.pending, (state) => { state.saving = true; state.saveError = null; })
      .addCase(applyFormatting.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(applyFormatting.rejected, (state, action) => {
        state.saving = false;
        state.saveError = (action.payload as string) || 'Failed to update formatting';
      });
  },
});

export const { clearGrid, optimisticUpdateCell, rollbackCell, clearSaveError, optimisticApplyFormatting, rollbackFormatting } = gridSlice.actions;

// ─── Thunk: applyFormatting (defined after slice so it can reference actions) ──

export const applyFormatting = createAsyncThunk(
  'grid/applyFormatting',
  async (
    { sheetId, cells }: { sheetId: string; cells: Array<{ rowId: string; columnId: string; formatting: CellFormatting | null }> },
    { dispatch, getState, rejectWithValue },
  ) => {
    // Optimistic update: immediately apply formatting to state
    const state = getState() as RootState;
    const previousValues: Array<{ rowId: string; columnId: string; prev: CellFormatting | undefined }> = [];

    for (const entry of cells) {
      const row = state.grid.rows.find((r) => r.id === entry.rowId);
      if (row) {
        const prev = row.formatting?.[entry.columnId];
        previousValues.push({ rowId: entry.rowId, columnId: entry.columnId, prev });
      }
    }

    dispatch(optimisticApplyFormatting(cells));

    try {
      const res = await gridService.updateFormatting(sheetId, cells);
      return res.data.data as { updated: number };
    } catch (err: unknown) {
      // Rollback on failure
      dispatch(rollbackFormatting(previousValues));
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

// ─── Selectors ─────────────────────────────────────────────────────────────

export const selectGridColumns = (state: RootState) => state.grid.columns;
export const selectGridRows = (state: RootState) => state.grid.rows;
export const selectGridMembers = (state: RootState) => state.grid.members;
export const selectGridLoading = (state: RootState) => state.grid.loading;
export const selectGridSaving = (state: RootState) => state.grid.saving;
export const selectGridError = (state: RootState) => state.grid.error;
export const selectGridSaveError = (state: RootState) => state.grid.saveError;
export const selectGridErrorStatus = (state: RootState) => state.grid.errorStatus;

/** Returns the CellFormatting for a specific cell, or {} if none. */
export function selectCellFormatting(state: RootState, rowId: string, columnId: string): CellFormatting {
  const row = state.grid.rows.find((r) => r.id === rowId);
  return row?.formatting?.[columnId] ?? {};
}

export default gridSlice.reducer;
