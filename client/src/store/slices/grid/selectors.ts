import type { CellFormatting, GridRow } from '../../../types';
import type { RootState } from '../../store';
import { getVisibleRows } from '../../../features/sheets/grid/hierarchyHelpers';
import { EMPTY_FORMATTING } from './types';

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
