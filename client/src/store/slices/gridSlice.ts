import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import * as gridService from '../../services/gridService';
import { parseApiError } from '../../utils/parseApiError';
import type { Column, GridRow, CellFormatting } from '../../types';
import type { RootState } from '../store';
import { getVisibleRows } from '../../features/sheets/grid/hierarchyHelpers';

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
      return res.data.data as { rowId: string; columnId: string; value: unknown };
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

// deleteRows thunk is defined after the slice so it can reference optimisticDeleteRows/rollbackDeleteRows
// indentSelectedRows and outdentSelectedRows are also defined after the slice

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

          if (entry.formatting === null) {
            // Null formatting = remove all cell-level formatting for this column
            delete row.formatting[entry.columnId];
          } else {
            // Merge patch into existing cell formatting; null values delete keys
            const existing = row.formatting[entry.columnId] ?? {};
            const merged: Record<string, unknown> = { ...existing };
            for (const [k, v] of Object.entries(entry.formatting)) {
              if (v === null) {
                delete merged[k];
              } else {
                merged[k] = v;
              }
            }
            if (Object.keys(merged).length > 0) {
              row.formatting[entry.columnId] = merged as CellFormatting;
            } else {
              delete row.formatting[entry.columnId];
            }
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
    optimisticApplyColumnFormatting(
      state,
      action: PayloadAction<{ columnId: string; formatting: CellFormatting | null }>,
    ) {
      const col = state.columns.find((c) => c.id === action.payload.columnId);
      if (col) {
        if (action.payload.formatting && Object.keys(action.payload.formatting).length > 0) {
          col.formatting = action.payload.formatting;
        } else {
          col.formatting = undefined;
        }
      }
    },
    rollbackColumnFormatting(
      state,
      action: PayloadAction<{ columnId: string; prev: CellFormatting | undefined }>,
    ) {
      const col = state.columns.find((c) => c.id === action.payload.columnId);
      if (col) {
        col.formatting = action.payload.prev;
      }
    },
    /** Clear specific cell-level formatting overrides for cells in given columns.
     *  Used when applying column formatting with cascade. */
    clearCellFormattingOverrides(
      state,
      action: PayloadAction<{ columnIds: string[]; patchKeys: string[] }>,
    ) {
      const { columnIds, patchKeys } = action.payload;
      for (const row of state.rows) {
        if (!row.formatting) continue;
        for (const colId of columnIds) {
          const cellFmt = row.formatting[colId];
          if (!cellFmt) continue;
          let changed = false;
          for (const key of patchKeys) {
            if (key in cellFmt) {
              delete (cellFmt as Record<string, unknown>)[key];
              changed = true;
            }
          }
          if (changed && Object.keys(cellFmt).length === 0) {
            delete row.formatting[colId];
          }
        }
      }
    },
    optimisticResizeColumn(
      state,
      action: PayloadAction<{ columnId: string; width: number }>,
    ) {
      const col = state.columns.find((c) => c.id === action.payload.columnId);
      if (col) {
        col.width = action.payload.width;
      }
    },
    rollbackColumnWidth(
      state,
      action: PayloadAction<{ columnId: string; prevWidth: number | undefined }>,
    ) {
      const col = state.columns.find((c) => c.id === action.payload.columnId);
      if (col) {
        col.width = action.payload.prevWidth;
      }
    },
    optimisticResizeRows(
      state,
      action: PayloadAction<Array<{ rowId: string; height: number }>>,
    ) {
      for (const entry of action.payload) {
        const row = state.rows.find((r) => r.id === entry.rowId);
        if (row) {
          row.height = entry.height;
        }
      }
    },
    rollbackRowHeights(
      state,
      action: PayloadAction<Array<{ rowId: string; prevHeight: number | undefined }>>,
    ) {
      for (const entry of action.payload) {
        const row = state.rows.find((r) => r.id === entry.rowId);
        if (row) {
          row.height = entry.prevHeight;
        }
      }
    },
    optimisticDeleteRows(
      state,
      action: PayloadAction<string[]>,
    ) {
      const deletedIds = new Set(action.payload);
      state.rows = state.rows.filter((r) => !deletedIds.has(r.id));
    },
    rollbackDeleteRows(
      state,
      action: PayloadAction<Array<{ row: GridRow; index: number }>>,
    ) {
      // Re-insert rows at their original positions
      for (const entry of action.payload) {
        const insertIdx = Math.min(entry.index, state.rows.length);
        state.rows.splice(insertIdx, 0, entry.row);
      }
    },
    optimisticIndentOutdent(
      state,
      action: PayloadAction<{ rowId: string; parentId: string | null; depth: number }>,
    ) {
      const row = state.rows.find((r) => r.id === action.payload.rowId);
      if (row) {
        row.parentId = action.payload.parentId;
        row.depth = action.payload.depth;
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
      // deleteRows (optimistic — rows removed in thunk, rollback on failure)
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
      .addCase(indentSelectedRows.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(indentSelectedRows.rejected, (state, action) => {
        state.saving = false;
        state.saveError = (action.payload as string) || 'Failed to indent rows';
      })
      // outdentSelectedRows
      .addCase(outdentSelectedRows.pending, (state) => { state.saving = true; state.saveError = null; })
      .addCase(outdentSelectedRows.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(outdentSelectedRows.rejected, (state, action) => {
        state.saving = false;
        state.saveError = (action.payload as string) || 'Failed to outdent rows';
      })
      // applyFormatting
      .addCase(applyFormatting.pending, (state) => { state.saving = true; state.saveError = null; })
      .addCase(applyFormatting.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(applyFormatting.rejected, (state, action) => {
        state.saving = false;
        state.saveError = (action.payload as string) || 'Failed to update formatting';
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
  },
});

export const { clearGrid, optimisticUpdateCell, rollbackCell, clearSaveError, optimisticApplyFormatting, rollbackFormatting, optimisticApplyColumnFormatting, rollbackColumnFormatting, clearCellFormattingOverrides, optimisticResizeColumn, rollbackColumnWidth, optimisticResizeRows, rollbackRowHeights, optimisticDeleteRows, rollbackDeleteRows, optimisticIndentOutdent } = gridSlice.actions;

// ─── Thunk: deleteRows (optimistic with rollback, defined after slice) ──

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

// ─── Thunk: indentSelectedRows (optimistic with rollback) ──────────────────

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

    for (const u of optimisticUpdates) {
      dispatch(optimisticIndentOutdent({ rowId: u.rowId, parentId: u.newParentId, depth: u.newDepth }));
    }

    try {
      const res = await gridService.indentRows(sheetId, rowIds);
      return res.data.data as { updated: number; rows: Record<string, { parentId: string | null; depth: number }> };
    } catch (err: unknown) {
      for (const u of optimisticUpdates) {
        dispatch(optimisticIndentOutdent({ rowId: u.rowId, parentId: u.prevParentId, depth: u.prevDepth }));
      }
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

// ─── Thunk: outdentSelectedRows (optimistic with rollback) ─────────────────

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

    for (const u of optimisticUpdates) {
      dispatch(optimisticIndentOutdent({ rowId: u.rowId, parentId: u.newParentId, depth: u.newDepth }));
    }

    try {
      const res = await gridService.outdentRows(sheetId, rowIds);
      return res.data.data as { updated: number; rows: Record<string, { parentId: string | null; depth: number }> };
    } catch (err: unknown) {
      for (const u of optimisticUpdates) {
        dispatch(optimisticIndentOutdent({ rowId: u.rowId, parentId: u.prevParentId, depth: u.prevDepth }));
      }
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

// ─── Thunk: applyFormatting (defined after slice so it can reference actions) ──

export const applyFormatting = createAsyncThunk(
  'grid/applyFormatting',
  async (
    { sheetId, cells, columnFormatting, cascadePatch }: {
      sheetId: string;
      cells?: Array<{ rowId: string; columnId: string; formatting: CellFormatting | null }>;
      columnFormatting?: Array<{ columnId: string; formatting: CellFormatting | null }>;
      /** When applying column formatting with cascade, this patch is also sent to clear matching cell overrides. */
      cascadePatch?: CellFormatting;
    },
    { dispatch, getState, rejectWithValue },
  ) => {
    // Optimistic update: immediately apply formatting to state
    const state = getState() as RootState;

    // Handle column-level formatting
    if (columnFormatting && columnFormatting.length > 0) {
      const prevColumnValues: Array<{ columnId: string; prev: CellFormatting | undefined }> = [];
      for (const entry of columnFormatting) {
        const col = state.grid.columns.find((c) => c.id === entry.columnId);
        prevColumnValues.push({ columnId: entry.columnId, prev: col?.formatting });
      }

      for (const entry of columnFormatting) {
        dispatch(optimisticApplyColumnFormatting({ columnId: entry.columnId, formatting: entry.formatting }));
      }

      // If cascading, optimistically clear cell-level overrides for the patched keys
      if (cascadePatch) {
        const patchKeys = Object.keys(cascadePatch);
        const columnIds = columnFormatting.map((e) => e.columnId);
        dispatch(clearCellFormattingOverrides({ columnIds, patchKeys }));
      }

      try {
        const res = await gridService.updateColumnFormatting(sheetId, columnFormatting, cascadePatch);
        return res.data.data as { updated: number };
      } catch (err: unknown) {
        for (const prev of prevColumnValues) {
          dispatch(rollbackColumnFormatting({ columnId: prev.columnId, prev: prev.prev }));
        }
        return rejectWithValue(parseApiError(err).message);
      }
    }

    // Handle cell-level formatting
    if (cells && cells.length > 0) {
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
    }

    return { updated: 0 };
  },
);

// ─── Stable empty formatting constant (avoids re-renders) ──────────────

const EMPTY_FORMATTING: CellFormatting = {};

// ─── Thunk: resizeColumn (optimistic with rollback) ───────────────────────

export const resizeColumn = createAsyncThunk(
  'grid/resizeColumn',
  async (
    { sheetId, columnId, width }: { sheetId: string; columnId: string; width: number },
    { dispatch, getState, rejectWithValue },
  ) => {
    const state = getState() as RootState;
    const col = state.grid.columns.find((c) => c.id === columnId);
    const prevWidth = col?.width;

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

// ─── Thunk: resizeRows (optimistic with rollback) ─────────────────────────

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

// ─── Selectors ─────────────────────────────────────────────────────────────

export const selectGridColumns = (state: RootState) => state.grid.columns;
export const selectGridRows = (state: RootState) => state.grid.rows;
export const selectGridMembers = (state: RootState) => state.grid.members;
export const selectGridLoading = (state: RootState) => state.grid.loading;
export const selectGridSaving = (state: RootState) => state.grid.saving;
export const selectGridError = (state: RootState) => state.grid.error;
export const selectGridSaveError = (state: RootState) => state.grid.saveError;
export const selectGridErrorStatus = (state: RootState) => state.grid.errorStatus;

/** Returns the CellFormatting for a specific cell, or a stable empty object if none. */
export function selectCellFormatting(state: RootState, rowId: string, columnId: string): CellFormatting {
  const row = state.grid.rows.find((r) => r.id === rowId);
  return row?.formatting?.[columnId] ?? EMPTY_FORMATTING;
}

/** Returns the column-level formatting for a column, or a stable empty object if none. */
export function selectColumnFormatting(state: RootState, columnId: string): CellFormatting {
  const col = state.grid.columns.find((c) => c.id === columnId);
  return col?.formatting ?? EMPTY_FORMATTING;
}

/** Returns visible rows filtered by collapsed IDs. */
export function selectVisibleRows(state: RootState, collapsedIds: Set<string>): GridRow[] {
  return getVisibleRows(state.grid.rows, collapsedIds);
}

export default gridSlice.reducer;
