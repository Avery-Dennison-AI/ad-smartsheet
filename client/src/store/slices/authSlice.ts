import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';
import { parseApiError } from '../../utils/parseApiError';
import { applyAccent } from '../../utils/theme';
import type { Accent } from '../../utils/theme';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  accentColor?: Accent;
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
    const parsed = parseApiError(err);
    if (parsed.status === 401) {
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
      const parsed = parseApiError(err);
      if (parsed.status && parsed.status >= 400 && parsed.status < 500) {
        return rejectWithValue(parsed.message);
      }
      return rejectWithValue(parsed.message);
    }
  },
);

/** Logs out the current user by calling POST /api/auth/logout. */
export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await apiClient.post('/api/auth/logout');
  } catch (err: unknown) {
    const parsed = parseApiError(err);
    return rejectWithValue(parsed.message);
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
        if (action.payload.accentColor) {
          applyAccent(action.payload.accentColor);
        }
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
        if (action.payload.user.accentColor) {
          applyAccent(action.payload.user.accentColor);
        }
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
        applyAccent('teal');
      })
      .addCase(logoutUser.rejected, (state) => {
        state.status = 'idle';
        state.user = null;
        applyAccent('teal');
      });
  },
});

export const { clearUser } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthInitialized = (state: { auth: AuthState }) => state.auth.initialized;
export const selectAuthStatus = (state: { auth: AuthState }) => state.auth.status;

export default authSlice.reducer;
