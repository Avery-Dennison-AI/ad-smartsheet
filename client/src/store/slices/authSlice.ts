import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  initialized: false,
};

/** Fetches the current user from /api/auth/me. Marks initialized on completion. */
export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.get('/auth/me');
    return data.user as AuthUser;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } };
    if (error.response?.status === 401) {
      return rejectWithValue(null);
    }
    throw err;
  }
});

/** Logs out the current user by calling POST /api/auth/logout. */
export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await apiClient.post('/auth/logout');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearUser(state) {
      state.user = null;
      state.initialized = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchMe
      .addCase(fetchMe.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.initialized = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.status = 'failed';
        state.user = null;
        state.initialized = true;
      })
      // logout
      .addCase(logoutUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = 'idle';
        state.user = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.status = 'idle';
        state.user = null;
      });
  },
});

export const { clearUser } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthInitialized = (state: { auth: AuthState }) => state.auth.initialized;
export const selectAuthStatus = (state: { auth: AuthState }) => state.auth.status;

export default authSlice.reducer;
