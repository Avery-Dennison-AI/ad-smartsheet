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
    const { data } = await apiClient.get('/api/auth/me');
    return data.data as AuthUser;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number; data?: { error?: { message?: string } } } };
    if (error.response?.status === 401) {
      return rejectWithValue(null);
    }
    throw err;
  }
});

/** Authenticates a user with email + password via POST /api/auth/login. */
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/api/auth/login', credentials);
      return data.data as { user: AuthUser };
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { error?: { message?: string }; message?: string } } };
      if (error.response) {
        const status = error.response.status;
        if (status && status >= 400 && status < 500) {
          return rejectWithValue(error.response.data?.error?.message || 'Request failed');
        }
        return rejectWithValue('Something went wrong. Please try again.');
      }
      return rejectWithValue('Network error. Please try again.');
    }
  },
);

/** Logs out the current user by calling POST /api/auth/logout. */
export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await apiClient.post('/api/auth/logout');
  } catch (err: unknown) {
    const error = err as { response?: { data?: { error?: { message?: string } } } };
    return rejectWithValue(error.response?.data?.error?.message ?? 'Logout failed');
  }
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
      // login
      .addCase(login.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state) => {
        state.status = 'failed';
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
