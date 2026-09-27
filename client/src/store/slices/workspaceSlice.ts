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
}

const initialState: WorkspaceState = {
  list: [],
  current: null,
  status: 'idle',
  currentStatus: 'idle',
  error: null,
};

// ─── Thunks ────────────────────────────────────────────────────────────────

export const fetchWorkspaces = createAsyncThunk('workspaces/fetchAll', async () => {
  const { data } = await workspaceService.listWorkspaces();
  return data.data as Workspace[];
});

export const fetchWorkspace = createAsyncThunk('workspaces/fetchOne', async (id: string) => {
  const { data } = await workspaceService.getWorkspace(id);
  return data.data as Workspace;
});

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
      .addCase(fetchWorkspaces.rejected, (state) => {
        state.status = 'failed';
        state.error = 'Failed to load workspaces';
      })
      // fetchWorkspace
      .addCase(fetchWorkspace.pending, (state) => { state.currentStatus = 'loading'; })
      .addCase(fetchWorkspace.fulfilled, (state, action) => {
        state.currentStatus = 'succeeded';
        state.current = action.payload;
      })
      .addCase(fetchWorkspace.rejected, (state) => {
        state.currentStatus = 'failed';
        state.current = null;
      })
      // createWorkspace
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.list.push(action.payload);
        state.current = action.payload;
      })
      // updateWorkspace
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        const idx = state.list.findIndex((w) => w._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.current?._id === action.payload._id) state.current = action.payload;
      })
      // deleteWorkspace
      .addCase(deleteWorkspace.fulfilled, (state, action) => {
        state.list = state.list.filter((w) => w._id !== action.payload);
        if (state.current?._id === action.payload) state.current = null;
      })
      // addMember
      .addCase(addMember.fulfilled, (state, action) => {
        const idx = state.list.findIndex((w) => w._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.current?._id === action.payload._id) state.current = action.payload;
      })
      // removeMember
      .addCase(removeMember.fulfilled, (state, action) => {
        if (state.current && state.current._id === action.payload.workspaceId) {
          state.current = {
            ...state.current,
            members: state.current.members.filter(
              (m) => m.user._id !== action.payload.memberId,
            ),
          };
        }
        const listIdx = state.list.findIndex((w) => w._id === action.payload.workspaceId);
        if (listIdx !== -1) {
          state.list[listIdx] = {
            ...state.list[listIdx],
            members: state.list[listIdx].members.filter(
              (m) => m.user._id !== action.payload.memberId,
            ),
          };
        }
      })
      // updateMemberRole
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        const idx = state.list.findIndex((w) => w._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.current?._id === action.payload._id) state.current = action.payload;
      });
  },
});

export const { clearCurrentWorkspace } = workspaceSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────

export const selectWorkspaceList = (state: RootState) => state.workspaces.list;
export const selectCurrentWorkspace = (state: RootState) => state.workspaces.current;
export const selectWorkspaceStatus = (state: RootState) => state.workspaces.status;
export const selectCurrentWorkspaceStatus = (state: RootState) => state.workspaces.currentStatus;

export default workspaceSlice.reducer;
