import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import {
  fetchUsers as fetchUsersApi,
  updateUserRole,
  updateUserStatus,
  fetchInvitations as fetchInvitationsApi,
  createInvitation as createInvitationApi,
  regenerateInvitation as regenerateInvitationApi,
  revokeInvitation as revokeInvitationApi,
} from '../../services/adminService';
import { parseApiError } from '../../utils/parseApiError';
import type { AdminUser, UserListResponse, InvitationItem } from '../../types';

// ─── Users State ────────────────────────────────────────────────────────────

interface UsersState {
  items: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialUsersState: UsersState = {
  items: [],
  total: 0,
  page: 1,
  totalPages: 0,
  status: 'idle',
  error: null,
};

export const fetchAdminUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (params: { search?: string; status?: 'active' | 'deactivated' | 'all'; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      return await fetchUsersApi(params);
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const updateAdminUserRole = createAsyncThunk(
  'admin/updateUserRole',
  async ({ userId, role }: { userId: string; role: 'admin' | 'member' }, { rejectWithValue }) => {
    try {
      return await updateUserRole(userId, role);
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const updateAdminUserStatus = createAsyncThunk(
  'admin/updateUserStatus',
  async ({ userId, isActive }: { userId: string; isActive: boolean }, { rejectWithValue }) => {
    try {
      return await updateUserStatus(userId, isActive);
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

// ─── Invitations State ──────────────────────────────────────────────────────

interface InvitationsState {
  items: InvitationItem[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialInvitationsState: InvitationsState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchAdminInvitations = createAsyncThunk(
  'admin/fetchInvitations',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchInvitationsApi();
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const createAdminInvitation = createAsyncThunk(
  'admin/createInvitation',
  async (data: { email: string; fullName?: string; role: 'admin' | 'member' | 'guest'; guestExpiresAt?: string }, { rejectWithValue }) => {
    try {
      return await createInvitationApi(data);
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const regenerateAdminInvitation = createAsyncThunk(
  'admin/regenerateInvitation',
  async (invitationId: string, { rejectWithValue }) => {
    try {
      return await regenerateInvitationApi(invitationId);
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const revokeAdminInvitation = createAsyncThunk(
  'admin/revokeInvitation',
  async (invitationId: string, { rejectWithValue }) => {
    try {
      return await revokeInvitationApi(invitationId);
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

// ─── Slice ──────────────────────────────────────────────────────────────────

interface AdminState {
  users: UsersState;
  invitations: InvitationsState;
}

const initialState: AdminState = {
  users: initialUsersState,
  invitations: initialInvitationsState,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // ─── Users ────────────────────────────────────────────────────────────
    builder
      .addCase(fetchAdminUsers.pending, (state) => {
        state.users.status = 'loading';
        state.users.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.users.status = 'succeeded';
        const payload = action.payload as UserListResponse;
        state.users.items = payload.users;
        state.users.total = payload.total;
        state.users.page = payload.page;
        state.users.totalPages = payload.totalPages;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.users.status = 'failed';
        state.users.error = (action.payload as string) ?? 'Failed to fetch users';
      });

    // ─── Update User Role ─────────────────────────────────────────────────
    builder
      .addCase(updateAdminUserRole.fulfilled, (state, action) => {
        const updated = action.payload as AdminUser;
        const idx = state.users.items.findIndex((u) => u.id === updated.id);
        if (idx !== -1) state.users.items[idx] = updated;
      })
      .addCase(updateAdminUserRole.rejected, (state, action) => {
        state.users.error = (action.payload as string) ?? 'Failed to update user role';
      });

    // ─── Update User Status ───────────────────────────────────────────────
    builder
      .addCase(updateAdminUserStatus.fulfilled, (state, action) => {
        const updated = action.payload as AdminUser;
        const idx = state.users.items.findIndex((u) => u.id === updated.id);
        if (idx !== -1) state.users.items[idx] = updated;
      })
      .addCase(updateAdminUserStatus.rejected, (state, action) => {
        state.users.error = (action.payload as string) ?? 'Failed to update user status';
      });

    // ─── Invitations ──────────────────────────────────────────────────────
    builder
      .addCase(fetchAdminInvitations.pending, (state) => {
        state.invitations.status = 'loading';
        state.invitations.error = null;
      })
      .addCase(fetchAdminInvitations.fulfilled, (state, action) => {
        state.invitations.status = 'succeeded';
        state.invitations.items = action.payload as InvitationItem[];
      })
      .addCase(fetchAdminInvitations.rejected, (state, action) => {
        state.invitations.status = 'failed';
        state.invitations.error = (action.payload as string) ?? 'Failed to fetch invitations';
      });

    // ─── Create Invitation ────────────────────────────────────────────────
    builder
      .addCase(createAdminInvitation.fulfilled, (state, action) => {
        const result = action.payload as { invitation: InvitationItem; invitePath: string };
        state.invitations.items.unshift(result.invitation);
      })
      .addCase(createAdminInvitation.rejected, (state, action) => {
        state.invitations.error = (action.payload as string) ?? 'Failed to create invitation';
      });

    // ─── Regenerate Invitation ────────────────────────────────────────────
    builder
      .addCase(regenerateAdminInvitation.fulfilled, (state, action) => {
        const result = action.payload as { invitation: InvitationItem; invitePath: string };
        const idx = state.invitations.items.findIndex((i) => i.id === result.invitation.id);
        if (idx !== -1) state.invitations.items[idx] = result.invitation;
      })
      .addCase(regenerateAdminInvitation.rejected, (state, action) => {
        state.invitations.error = (action.payload as string) ?? 'Failed to regenerate invitation';
      });

    // ─── Revoke Invitation ────────────────────────────────────────────────
    builder
      .addCase(revokeAdminInvitation.fulfilled, (state, action) => {
        const revoked = action.payload as InvitationItem;
        const idx = state.invitations.items.findIndex((i) => i.id === revoked.id);
        if (idx !== -1) state.invitations.items[idx] = revoked;
      })
      .addCase(revokeAdminInvitation.rejected, (state, action) => {
        state.invitations.error = (action.payload as string) ?? 'Failed to revoke invitation';
      });
  },
});

// ─── Selectors ──────────────────────────────────────────────────────────────

export const selectAdminUsers = (state: { admin: AdminState }) => state.admin.users.items;
export const selectAdminUsersStatus = (state: { admin: AdminState }) => state.admin.users.status;
export const selectAdminUsersError = (state: { admin: AdminState }) => state.admin.users.error;
export const selectAdminUsersPagination = createSelector(
  (state: { admin: AdminState }) => state.admin.users,
  (users) => ({ total: users.total, page: users.page, totalPages: users.totalPages }),
);

export const selectAdminInvitations = (state: { admin: AdminState }) => state.admin.invitations.items;
export const selectAdminInvitationsStatus = (state: { admin: AdminState }) => state.admin.invitations.status;
export const selectAdminInvitationsError = (state: { admin: AdminState }) => state.admin.invitations.error;

export default adminSlice.reducer;
