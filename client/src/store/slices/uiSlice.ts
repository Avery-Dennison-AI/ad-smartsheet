import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  globalLoading: boolean;
  sidebarCollapsed: boolean;
}

const initialState: UiState = {
  globalLoading: false,
  sidebarCollapsed: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setGlobalLoading(state, action: PayloadAction<boolean>) {
      state.globalLoading = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
  },
});

export const { setGlobalLoading, toggleSidebar, setSidebarCollapsed } = uiSlice.actions;
export default uiSlice.reducer;
