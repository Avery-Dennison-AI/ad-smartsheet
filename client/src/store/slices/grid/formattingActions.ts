import { createAsyncThunk, type ActionReducerMapBuilder } from '@reduxjs/toolkit';
import * as gridService from '../../../services/gridService';
import { parseApiError } from '../../../utils/parseApiError';
import type { CellFormatting } from '../../../types';
import type { RootState } from '../../store';
import type { GridSliceState } from './types';

// ─── Thunk ─────────────────────────────────────────────────────────────────

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
    // Lazy import to avoid circular dependency
    const {
      optimisticApplyFormatting,
      rollbackFormatting,
      optimisticApplyColumnFormatting,
      rollbackColumnFormatting,
      clearCellFormattingOverrides,
    } = await import('../gridSlice');

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

// ─── Extra Reducers ────────────────────────────────────────────────────────

export function buildFormattingExtraReducers(builder: ActionReducerMapBuilder<GridSliceState>): void {
  builder
    .addCase(applyFormatting.pending, (state) => { state.saving = true; state.saveError = null; })
    .addCase(applyFormatting.fulfilled, (state) => {
      state.saving = false;
    })
    .addCase(applyFormatting.rejected, (state, action) => {
      state.saving = false;
      state.saveError = (action.payload as string) || 'Failed to update formatting';
    });
}
