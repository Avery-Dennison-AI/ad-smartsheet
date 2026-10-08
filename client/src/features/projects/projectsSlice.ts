import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as projectService from './projectService';
import { parseApiError } from '../../utils/parseApiError';
import type { Sheet } from '../../types';
import type { AppDispatch } from '../../store/store';
import { upsertSheetAction } from '../../store/slices/sheetsSlice';

interface CreateProjectResult {
  _id: string;
  kind: 'project';
  keyPrefix: string;
}

// ─── Thunks ────────────────────────────────────────────────────────────────

export const createProject = createAsyncThunk<
  CreateProjectResult,
  { workspaceId: string; name: string; keyPrefix: string; template: string },
  { dispatch: AppDispatch; rejectValue: { message: string; status?: number } }
>(
  'projects/create',
  async ({ workspaceId, name, keyPrefix, template }, { dispatch, rejectWithValue }) => {
    try {
      const res = await projectService.createProject(workspaceId, { name, keyPrefix, template });
      const sheet = res.data.data as Sheet;

      // Upsert the new sheet into sheetsSlice state
      dispatch(upsertSheetAction(sheet));

      return {
        _id: sheet.id,
        kind: 'project' as const,
        keyPrefix: sheet.keyPrefix ?? keyPrefix,
      };
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      return rejectWithValue({ message: parsed.message, status: parsed.status });
    }
  },
);

// ─── Slice ─────────────────────────────────────────────────────────────────

interface ProjectsState {
  creating: boolean;
  createError: { message: string; status?: number } | null;
}

const initialState: ProjectsState = {
  creating: false,
  createError: null,
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearCreateError(state) {
      state.createError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createProject.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createProject.fulfilled, (state) => {
        state.creating = false;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload ?? { message: 'Failed to create project' };
      });
  },
});

export const { clearCreateError } = projectsSlice.actions;

export default projectsSlice.reducer;
