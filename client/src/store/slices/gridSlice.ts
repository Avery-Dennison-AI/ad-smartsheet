import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { GridRow, CellFormatting } from '../../types';
import type { GridSliceState } from './grid/types';
export type { GridSliceState } from './grid/types';
export { initialState } from './grid/types';

// ─── Re-export thunks from sub-modules ─────────────────────────────────────

export { fetchGrid, addColumn, updateColumn, deleteColumn, reorderColumns, setPrimaryColumn, resizeColumn } from './grid/columnActions';
export { addRow, insertRow, updateCell, deleteRows, reorderRows, indentSelectedRows, outdentSelectedRows, resizeRows } from './grid/rowActions';
export { applyFormatting } from './grid/formattingActions';

// ─── Re-export selectors from sub-module ───────────────────────────────────

export {
  selectGridColumns,
  selectGridRows,
  selectGridMembers,
  selectGridLoading,
  selectGridSaving,
  selectGridError,
  selectGridSaveError,
  selectGridErrorStatus,
  selectCellFormatting,
  selectColumnFormatting,
  selectVisibleRows,
} from './grid/selectors';

// ─── Import builder functions ──────────────────────────────────────────────

import { buildColumnExtraReducers } from './grid/columnActions';
import { buildRowExtraReducers } from './grid/rowActions';
import { buildFormattingExtraReducers } from './grid/formattingActions';
import { initialState } from './grid/types';

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
    buildColumnExtraReducers(builder);
    buildRowExtraReducers(builder);
    buildFormattingExtraReducers(builder);
  },
});

export const { clearGrid, optimisticUpdateCell, rollbackCell, clearSaveError, optimisticApplyFormatting, rollbackFormatting, optimisticApplyColumnFormatting, rollbackColumnFormatting, clearCellFormattingOverrides, optimisticResizeColumn, rollbackColumnWidth, optimisticResizeRows, rollbackRowHeights, optimisticDeleteRows, rollbackDeleteRows, optimisticIndentOutdent } = gridSlice.actions;

export default gridSlice.reducer;
