import { createAsyncThunk, type ActionReducerMapBuilder } from '@reduxjs/toolkit';
import * as gridService from '../../../services/gridService';
import { parseApiError } from '../../../utils/parseApiError';
import type { GridRow } from '../../../types';
import type { RootState } from '../../store';
import type { GridSliceState } from './types';

// ─── Thunks ────────────────────────────────────────────────────────────────

export const addRow = createAsyncThunk(
  'grid/addRow',
  async (
    { sheetId, data }: { sheetId: string; data?: { afterRowId?: string; beforeRowId?: string; cells?: Record<string, unknown>; isParentExpanded?: boolean } },
    { rejectWithValue },
  ) => {
    try {
      const res = await gridService.addRow(sheetId, data);
      const payload = res.data.data as { row: GridRow; rows: GridRow[] };
      return payload;
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

/** Insert a row above or below a reference row. Uses beforeRowId / afterRowId. */
export const insertRow = createAsyncThunk(
  'grid/insertRow',
  async (
    { sheetId, afterRowId, beforeRowId, isParentExpanded }: { sheetId: string; afterRowId?: string; beforeRowId?: string; isParentExpanded?: boolean },
    { rejectWithValue },
  ) => {
    try {
      const res = await gridService.addRow(sheetId, { afterRowId, beforeRowId, isParentExpanded });
      const payload = res.data.data as { row: GridRow; rows: GridRow[] };
      return payload;
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
      // Server may return a single cell update or an array (for computed fields like Duration)
      const raw = res.data.data;
      const updates: Array<{ rowId: string; columnId: string; value: unknown }> = Array.isArray(raw) ? raw : [raw];
      return updates;
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const reorderRows = createAsyncThunk(
  'grid/reorderRows',
  async (
    { sheetId, orderedIds, parentUpdates }: {
      sheetId: string;
      orderedIds: string[];
      parentUpdates?: Array<{ rowId: string; parentId: string | null; depth: number }>;
    },
    { getState, rejectWithValue },
  ) => {
    // Save previous state for rollback
    const state = getState() as RootState;
    const prevRows = state.grid.rows.map((r) => ({ ...r }));

    try {
      const res = await gridService.reorderRows(sheetId, orderedIds, parentUpdates);
      const payload = res.data.data as { reordered: number; rows: GridRow[] };
      return { rows: payload.rows, prevRows };
    } catch (err: unknown) {
      return rejectWithValue({ message: parseApiError(err).message, prevRows });
    }
  },
);

// deleteRows thunk — uses lazy import for optimistic actions to avoid circular dependency
export const deleteRows = createAsyncThunk(
  'grid/deleteRows',
  async ({ sheetId, rowIds, includeDescendants }: { sheetId: string; rowIds: string[]; includeDescendants?: boolean }, { getState, dispatch, rejectWithValue }) => {
    // Optimistic: remove rows immediately, save them for rollback
    const state = getState() as RootState;
    const removedRows: Array<{ row: GridRow; index: number }> = [];
    for (const id of rowIds) {
      const idx = state.grid.rows.findIndex((r) => r.id === id);
      if (idx !== -1) {
        removedRows.push({ row: state.grid.rows[idx], index: idx });
      }
    }

    // Lazy import to avoid circular dependency
    const { optimisticDeleteRows, rollbackDeleteRows } = await import('../gridSlice');

    // Optimistically remove from state
    dispatch(optimisticDeleteRows(rowIds));

    try {
      const res = await gridService.deleteRows(sheetId, rowIds, !!includeDescendants);
      const payload = res.data.data as { deleted: number; rows: GridRow[] };
      return { rowIds, rows: payload.rows };
    } catch (err: unknown) {
      // Rollback: re-insert removed rows at their original positions
      dispatch(rollbackDeleteRows(removedRows.map((r) => ({ row: r.row, index: r.index }))));
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

// indentSelectedRows — uses lazy import for optimistic actions
export const indentSelectedRows = createAsyncThunk(
  'grid/indentRows',
  async ({ sheetId, rowIds }: { sheetId: string; rowIds: string[] }, { getState, dispatch, rejectWithValue }) => {
    const state = getState() as RootState;
    const rows = state.grid.rows;

    const optimisticUpdates: Array<{ rowId: string; prevParentId: string | null; prevDepth: number; newParentId: string | null; newDepth: number }> = [];

    for (const rowId of rowIds) {
      const idx = rows.findIndex((r) => r.id === rowId);
      if (idx <= 0) continue;
      const aboveRow = rows[idx - 1];
      const currentRow = rows[idx];
      const aboveDepth = aboveRow.depth ?? 0;
      const currentDepth = currentRow.depth ?? 0;
      if (aboveDepth < currentDepth) continue;
      const newDepth = aboveDepth + 1;
      if (newDepth > 10) continue;

      optimisticUpdates.push({
        rowId,
        prevParentId: currentRow.parentId,
        prevDepth: currentDepth,
        newParentId: aboveRow.id,
        newDepth,
      });
    }

    const { optimisticIndentOutdent } = await import('../gridSlice');

    for (const u of optimisticUpdates) {
      dispatch(optimisticIndentOutdent({ rowId: u.rowId, parentId: u.newParentId, depth: u.newDepth }));
    }

    try {
      const res = await gridService.indentRows(sheetId, rowIds);
      const payload = res.data.data as { updated: number; rows: GridRow[] };
      return { rows: payload.rows };
    } catch (err: unknown) {
      for (const u of optimisticUpdates) {
        dispatch(optimisticIndentOutdent({ rowId: u.rowId, parentId: u.prevParentId, depth: u.prevDepth }));
      }
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

// outdentSelectedRows — uses lazy import for optimistic actions
export const outdentSelectedRows = createAsyncThunk(
  'grid/outdentRows',
  async ({ sheetId, rowIds }: { sheetId: string; rowIds: string[] }, { getState, dispatch, rejectWithValue }) => {
    const state = getState() as RootState;
    const rows = state.grid.rows;
    const rowMap = new Map(rows.map((r) => [r.id, r]));

    const optimisticUpdates: Array<{ rowId: string; prevParentId: string | null; prevDepth: number; newParentId: string | null; newDepth: number }> = [];

    for (const rowId of rowIds) {
      const row = rowMap.get(rowId);
      if (!row || !row.parentId) continue;

      const parentRow = rowMap.get(row.parentId);
      const grandparentId = parentRow?.parentId ?? null;
      const newDepth = Math.max(0, (row.depth ?? 0) - 1);

      optimisticUpdates.push({
        rowId,
        prevParentId: row.parentId,
        prevDepth: row.depth ?? 0,
        newParentId: grandparentId,
        newDepth,
      });
    }

    const { optimisticIndentOutdent } = await import('../gridSlice');

    for (const u of optimisticUpdates) {
      dispatch(optimisticIndentOutdent({ rowId: u.rowId, parentId: u.newParentId, depth: u.newDepth }));
    }

    try {
      const res = await gridService.outdentRows(sheetId, rowIds);
      const payload = res.data.data as { updated: number; rows: GridRow[] };
      return { rows: payload.rows };
    } catch (err: unknown) {
      for (const u of optimisticUpdates) {
        dispatch(optimisticIndentOutdent({ rowId: u.rowId, parentId: u.prevParentId, depth: u.prevDepth }));
      }
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const resizeRows = createAsyncThunk(
  'grid/resizeRows',
  async (
    { sheetId, updates }: { sheetId: string; updates: Array<{ rowId: string; height: number }> },
    { dispatch, getState, rejectWithValue },
  ) => {
    const state = getState() as RootState;
    const prevHeights = updates.map((u) => {
      const row = state.grid.rows.find((r) => r.id === u.rowId);
      return { rowId: u.rowId, prevHeight: row?.height };
    });

    const { optimisticResizeRows, rollbackRowHeights } = await import('../gridSlice');
    dispatch(optimisticResizeRows(updates));

    try {
      const res = await gridService.updateRowHeights(sheetId, updates);
      return res.data.data as { updated: number };
    } catch (err: unknown) {
      dispatch(rollbackRowHeights(prevHeights));
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

// ─── Extra Reducers ────────────────────────────────────────────────────────

export function buildRowExtraReducers(builder: ActionReducerMapBuilder<GridSliceState>): void {
  builder
    // addRow
    .addCase(addRow.pending, (state) => { state.saving = true; state.saveError = null; })
    .addCase(addRow.fulfilled, (state, action) => {
      state.saving = false;
      state.rows = action.payload.rows;
    })
    .addCase(addRow.rejected, (state, action) => {
      state.saving = false;
      state.saveError = (action.payload as string) || 'Failed to add row';
    })
    // insertRow
    .addCase(insertRow.pending, (state) => { state.saving = true; state.saveError = null; })
    .addCase(insertRow.fulfilled, (state, action) => {
      state.saving = false;
      state.rows = action.payload.rows;
    })
    .addCase(insertRow.rejected, (state, action) => {
      state.saving = false;
      state.saveError = (action.payload as string) || 'Failed to insert row';
    })
    // updateCell
    .addCase(updateCell.pending, (state) => { state.saving = true; state.saveError = null; })
    .addCase(updateCell.fulfilled, (state, action) => {
      state.saving = false;
      const updates = action.payload;
      for (const { rowId, columnId, value } of updates) {
        const row = state.rows.find((r) => r.id === rowId);
        if (row) {
          row.cells[columnId] = value as string | number | boolean | null;
        }
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
      if (action.payload.rows) {
        state.rows = action.payload.rows;
      }
    })
    .addCase(deleteRows.rejected, (state, action) => {
      state.saving = false;
      state.saveError = (action.payload as string) || 'Failed to delete rows';
    })
    // reorderRows
    .addCase(reorderRows.pending, (state) => { state.saving = true; state.saveError = null; })
    .addCase(reorderRows.fulfilled, (state, action) => {
      state.saving = false;
      state.rows = action.payload.rows;
    })
    .addCase(reorderRows.rejected, (state, action) => {
      state.saving = false;
      const payload = action.payload as { message: string; prevRows?: GridRow[] } | undefined;
      if (payload?.prevRows) {
        state.rows = payload.prevRows;
      }
      state.saveError = payload?.message || 'Failed to reorder rows';
    })
    // indentSelectedRows
    .addCase(indentSelectedRows.pending, (state) => { state.saving = true; state.saveError = null; })
    .addCase(indentSelectedRows.fulfilled, (state, action) => {
      state.saving = false;
      if (action.payload.rows) {
        state.rows = action.payload.rows;
      }
    })
    .addCase(indentSelectedRows.rejected, (state, action) => {
      state.saving = false;
      state.saveError = (action.payload as string) || 'Failed to indent rows';
    })
    // outdentSelectedRows
    .addCase(outdentSelectedRows.pending, (state) => { state.saving = true; state.saveError = null; })
    .addCase(outdentSelectedRows.fulfilled, (state, action) => {
      state.saving = false;
      if (action.payload.rows) {
        state.rows = action.payload.rows;
      }
    })
    .addCase(outdentSelectedRows.rejected, (state, action) => {
      state.saving = false;
      state.saveError = (action.payload as string) || 'Failed to outdent rows';
    })
    // resizeRows
    .addCase(resizeRows.pending, (state) => { state.saving = true; state.saveError = null; })
    .addCase(resizeRows.fulfilled, (state) => {
      state.saving = false;
    })
    .addCase(resizeRows.rejected, (state, action) => {
      state.saving = false;
      state.saveError = (action.payload as string) || 'Failed to resize rows';
    });
}
