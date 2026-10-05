import { createAsyncThunk, type ActionReducerMapBuilder } from '@reduxjs/toolkit';
import * as gridService from '../../../services/gridService';
import { parseApiError } from '../../../utils/parseApiError';
import type { Column, GridRow } from '../../../types';
import type { RootState } from '../../store';
import type { GridSliceState } from './types';

// ─── Thunks ────────────────────────────────────────────────────────────────

export const fetchGrid = createAsyncThunk(
  'grid/fetch',
  async (sheetId: string, { rejectWithValue }) => {
    try {
      const { data } = await gridService.getGrid(sheetId);
      const payload = data.data as { columns: Column[]; rows: GridRow[]; members?: Array<{ id: string; fullName: string; email: string }> };
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

export const resizeColumn = createAsyncThunk(
  'grid/resizeColumn',
  async (
    { sheetId, columnId, width }: { sheetId: string; columnId: string; width: number },
    { dispatch, getState, rejectWithValue },
  ) => {
    const state = getState() as RootState;
    const col = state.grid.columns.find((c) => c.id === columnId);
    const prevWidth = col?.width;

    // Lazy import to avoid circular dependency
    const { optimisticResizeColumn, rollbackColumnWidth } = await import('../gridSlice');
    dispatch(optimisticResizeColumn({ columnId, width }));

    try {
      const res = await gridService.updateColumnWidth(sheetId, columnId, width);
      return res.data.data as Column;
    } catch (err: unknown) {
      dispatch(rollbackColumnWidth({ columnId, prevWidth }));
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

// ─── Extra Reducers ────────────────────────────────────────────────────────

export function buildColumnExtraReducers(builder: ActionReducerMapBuilder<GridSliceState>): void {
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
    // resizeColumn
    .addCase(resizeColumn.pending, (state) => { state.saving = true; state.saveError = null; })
    .addCase(resizeColumn.fulfilled, (state, action) => {
      state.saving = false;
      const idx = state.columns.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) state.columns[idx] = action.payload;
    })
    .addCase(resizeColumn.rejected, (state, action) => {
      state.saving = false;
      state.saveError = (action.payload as string) || 'Failed to resize column';
    });
}
