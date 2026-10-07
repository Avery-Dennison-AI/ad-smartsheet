import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as homeService from '../../services/homeService';
import { parseApiError } from '../../utils/parseApiError';
import type { MyWorkResponse } from '../../types';
import type { RootState } from '../store';

interface MyWorkState {
  groups: MyWorkResponse | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: MyWorkState = {
  groups: null,
  status: 'idle',
  error: null,
};

export const fetchMyWork = createAsyncThunk(
  'myWork/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await homeService.fetchMyWork();
      return data.data;
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

const myWorkSlice = createSlice({
  name: 'myWork',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyWork.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMyWork.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.groups = action.payload;
      })
      .addCase(fetchMyWork.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to load your work';
      });
  },
});

// ─── Selectors ──────────────────────────────────────────────────────────────

export const selectMyWorkGroups = (state: RootState) => state.myWork.groups;
export const selectMyWorkStatus = (state: RootState) => state.myWork.status;
export const selectMyWorkError = (state: RootState) => state.myWork.error;

export default myWorkSlice.reducer;
