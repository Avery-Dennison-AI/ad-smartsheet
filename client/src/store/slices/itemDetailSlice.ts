import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export type ItemDetailTab = 'comments' | 'activity' | 'attachments';

interface ItemDetailState {
  openRowId: string | null;
  activeTab: ItemDetailTab;
}

const initialState: ItemDetailState = {
  openRowId: null,
  activeTab: 'comments',
};

const itemDetailSlice = createSlice({
  name: 'itemDetail',
  initialState,
  reducers: {
    openItem(state, action: PayloadAction<{ rowId: string; tab?: ItemDetailTab }>) {
      state.openRowId = action.payload.rowId;
      if (action.payload.tab) {
        state.activeTab = action.payload.tab;
      }
    },
    closeItem(state) {
      state.openRowId = null;
    },
    setTab(state, action: PayloadAction<ItemDetailTab>) {
      state.activeTab = action.payload;
    },
  },
});

export const { openItem, closeItem, setTab } = itemDetailSlice.actions;

// ─── Selectors ──────────────────────────────────────────────────────────────

export const selectOpenRowId = (state: RootState) => state.itemDetail.openRowId;
export const selectActiveTab = (state: RootState) => state.itemDetail.activeTab;

export default itemDetailSlice.reducer;
