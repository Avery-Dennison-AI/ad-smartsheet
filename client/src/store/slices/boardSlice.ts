import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { BoardFilters } from '@/features/board/boardTypes';

interface BoardSheetState {
  groupByColumnId: string | null;
  filters: BoardFilters;
}

interface BoardState {
  bySheet: Record<string, BoardSheetState>;
}

const defaultSheetState: BoardSheetState = {
  groupByColumnId: null,
  filters: { assigneeIds: [], typeIds: [], search: '' },
};

const initialState: BoardState = {
  bySheet: {},
};

function getSheetState(state: BoardState, sheetId: string): BoardSheetState {
  if (!state.bySheet[sheetId]) {
    state.bySheet[sheetId] = { ...defaultSheetState, filters: { ...defaultSheetState.filters } };
  }
  return state.bySheet[sheetId];
}

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    setGroupBy(state, action: PayloadAction<{ sheetId: string; columnId: string | null }>) {
      const s = getSheetState(state, action.payload.sheetId);
      s.groupByColumnId = action.payload.columnId;
    },
    setAssigneeFilter(state, action: PayloadAction<{ sheetId: string; assigneeIds: string[] }>) {
      const s = getSheetState(state, action.payload.sheetId);
      s.filters.assigneeIds = action.payload.assigneeIds;
    },
    setTypeFilter(state, action: PayloadAction<{ sheetId: string; typeIds: string[] }>) {
      const s = getSheetState(state, action.payload.sheetId);
      s.filters.typeIds = action.payload.typeIds;
    },
    setSearch(state, action: PayloadAction<{ sheetId: string; search: string }>) {
      const s = getSheetState(state, action.payload.sheetId);
      s.filters.search = action.payload.search;
    },
    clearFilters(state, action: PayloadAction<{ sheetId: string }>) {
      const s = getSheetState(state, action.payload.sheetId);
      s.filters = { assigneeIds: [], typeIds: [], search: '' };
    },
  },
});

export const { setGroupBy, setAssigneeFilter, setTypeFilter, setSearch, clearFilters } = boardSlice.actions;

// ─── Selectors ──────────────────────────────────────────────────────────────

export const selectBoardGroupBy = (state: RootState, sheetId: string) =>
  state.board.bySheet[sheetId]?.groupByColumnId ?? null;

export const selectBoardFilters = (state: RootState, sheetId: string): BoardFilters =>
  state.board.bySheet[sheetId]?.filters ?? { assigneeIds: [], typeIds: [], search: '' };

export default boardSlice.reducer;
