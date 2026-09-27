import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as workspaceService from '../../services/workspaceService';
import type { Workspace, WorkspaceRole } from '../../types';
import type { RootState } from '../store';

interface WorkspaceState {
  list: Workspace[];
  current: Workspace | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  currentStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  currentError: { status?: number; message?: string } | null;
}

const initialState: WorkspaceState = {
  list: [],
  current: null,
  status: 'idle',
  currentStatus: 'idle',
  error: null,
  currentError: null,
};

// ─── Thunks ────────────────────────────────────────────────────────────────

export const fetchWorkspaces = createAsyncThunk('workspaces/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await workspaceService.listWorkspaces();
    return data.data as Workspace[];
  } catch (err: unknown) {
    const error = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
    return rejectWithValue(error.response?.data?.error?.message ?? error.message ?? 'Failed to load workspaces');
  }
});

export const fetchWorkspace = createAsyncThunk(
  'workspaces/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await workspaceService.getWorkspace(id);
      return data.data as Workspace;
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { error?: string; statusCode?: number } } };
      const status = error.response?.status;
      if (status === 403 || status === 404) {
        return rejectWithValue({ status, message: error.response?.data?.error || 'Access denied' });
      }
      throw err;
    }
  },
);

export const createWorkspace = createAsyncThunk(
  'workspaces/create',
  async (data: { name: string; description?: string; color: string }) => {
    const res = await workspaceService.createWorkspace(data);
    return res.data.data as Workspace;
  },
);

export const updateWorkspace = createAsyncThunk(
  'workspaces/update',
  async ({ id, data }: { id: string; data: { name?: string; description?: string; color?: string } }) => {
    const res = await workspaceService.updateWorkspace(id, data);
    return res.data.data as Workspace;
  },
);

export const deleteWorkspace = createAsyncThunk('workspaces/delete', async (id: string) => {
  await workspaceService.deleteWorkspace(id);
  return id;
});

export const addMember = createAsyncThunk(
  'workspaces/addMember',
  async ({ workspaceId, data }: { workspaceId: string; data: { userId: string; role: WorkspaceRole } }) => {
    const res = await workspaceService.addMember(workspaceId, data);
    return res.data.data as Workspace;
  },
);

export const removeMember = createAsyncThunk(
  'workspaces/removeMember',
  async ({ workspaceId, memberId }: { workspaceId: string; memberId: string }) => {
    await workspaceService.removeMember(workspaceId, memberId);
    return { workspaceId, memberId };
  },
);

export const updateMemberRole = createAsyncThunk(
  'workspaces/updateMemberRole',
  async ({ workspaceId, memberId, role }: { workspaceId: string; memberId: string; role: WorkspaceRole }) => {
    const res = await workspaceService.updateMemberRole(workspaceId, memberId, role);
    return res.data.data as Workspace;
  },
);

// ─── Slice ─────────────────────────────────────────────────────────────────

const workspaceSlice = createSlice({
  name: 'workspaces',
  initialState,
  reducers: {
    clearCurrentWorkspace(state) {
      state.current = null;
      state.currentStatus = 'idle';
      state.currentError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchWorkspaces
      .addCase(fetchWorkspaces.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to load workspaces';
      })
      // fetchWorkspace
      .addCase(fetchWorkspace.pending, (state) => {
        state.currentStatus = 'loading';
        state.currentError = null;
      })
      .addCase(fetchWorkspace.fulfilled, (state, action) => {
        state.currentStatus = 'succeeded';
        state.current = action.payload;
        state.currentError = null;
      })
      .addCase(fetchWorkspace.rejected, (state, action) => {
        state.currentStatus = 'failed';
        state.current = null;
        const payload = action.payload as { status?: number; message?: string } | undefined;
        state.currentError = payload || { message: 'Failed to load workspace' };
      })
      // createWorkspace
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.list.push(action.payload);
        state.current = action.payload;
      })
      // updateWorkspace
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        const idx = state.list.findIndex((w) => w.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.current?.id === action.payload.id) state.current = action.payload;
      })
      // deleteWorkspace
      .addCase(deleteWorkspace.fulfilled, (state, action) => {
        state.list = state.list.filter((w) => w.id !== action.payload);
        if (state.current?.id === action.payload) state.current = null;
      })
      // addMember
      .addCase(addMember.fulfilled, (state, action) => {
        const idx = state.list.findIndex((w) => w.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.current?.id === action.payload.id) state.current = action.payload;
      })
      // removeMember
      .addCase(removeMember.fulfilled, (state, action) => {
        if (state.current && state.current.id === action.payload.workspaceId) {
          state.current = {
            ...state.current,
            members: state.current.members.filter(
              (m) => m.id !== action.payload.memberId,
            ),
          };
        }
        const listIdx = state.list.findIndex((w) => w.id === action.payload.workspaceId);
        if (listIdx !== -1) {
          state.list[listIdx] = {
            ...state.list[listIdx],
            members: state.list[listIdx].members.filter(
              (m) => m.id !== action.payload.memberId,
            ),
          };
        }
      })
      // updateMemberRole
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        const idx = state.list.findIndex((w) => w.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.current?.id === action.payload.id) state.current = action.payload;
      });
  },
});

export const { clearCurrentWorkspace } = workspaceSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────

export const selectWorkspaceList = (state: RootState) => state.workspaces.list;
export const selectCurrentWorkspace = (state: RootState) => state.workspaces.current;
export const selectWorkspaceStatus = (state: RootState) => state.workspaces.status;
export const selectCurrentWorkspaceStatus = (state: RootState) => state.workspaces.currentStatus;
export const selectCurrentWorkspaceError = (state: RootState) => state.workspaces.currentError;

export default workspaceSlice.reducer;
