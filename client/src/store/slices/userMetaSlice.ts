import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as sheetService from '../../services/sheetService';
import type { SheetMetaItem } from '../../types';
import type { RootState } from '../store';
import { deleteSheet as deleteSheetThunk } from './sheetsSlice';

interface UserMetaState {
  recents: SheetMetaItem[];
  favorites: SheetMetaItem[];
  loading: boolean;
  error: string | null;
}

const initialState: UserMetaState = {
  recents: [],
  favorites: [],
  loading: false,
  error: null,
};

// ─── Thunks ────────────────────────────────────────────────────────────────

export const fetchRecents = createAsyncThunk(
  'userMeta/fetchRecents',
  async () => {
    const { data } = await sheetService.getRecents();
    return data.data as SheetMetaItem[];
  },
);

export const fetchFavorites = createAsyncThunk(
  'userMeta/fetchFavorites',
  async () => {
    const { data } = await sheetService.getFavorites();
    return data.data as SheetMetaItem[];
  },
);

export const setFavoriteMeta = createAsyncThunk(
  'userMeta/setFavorite',
  async ({ sheetId, starred }: { sheetId: string; starred: boolean }) => {
    const res = await sheetService.setFavorite(sheetId, starred);
    return res.data.data as { sheetId: string; isFavorite: boolean };
  },
);

// ─── Slice ─────────────────────────────────────────────────────────────────

const userMetaSlice = createSlice({
  name: 'userMeta',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchRecents
      .addCase(fetchRecents.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchRecents.fulfilled, (state, action) => {
        state.loading = false;
        state.recents = action.payload;
      })
      .addCase(fetchRecents.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to load recents';
      })
      // fetchFavorites
      .addCase(fetchFavorites.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload;
      })
      .addCase(fetchFavorites.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to load favorites';
      })
      // setFavoriteMeta
      .addCase(setFavoriteMeta.fulfilled, (state, action) => {
        const { sheetId, isFavorite } = action.payload;
        // Update in recents
        const recentIdx = state.recents.findIndex((r) => r.sheet.id === sheetId);
        if (recentIdx !== -1) {
          state.recents[recentIdx] = { ...state.recents[recentIdx], isFavorite };
        }
        // Update in favorites
        if (isFavorite) {
          // If favorited and not already in favorites, we don't add here — let the user refresh
          const favIdx = state.favorites.findIndex((f) => f.sheet.id === sheetId);
          if (favIdx !== -1) {
            state.favorites[favIdx] = { ...state.favorites[favIdx], isFavorite };
          }
        } else {
          // If unfavorited, remove from favorites list
          state.favorites = state.favorites.filter((f) => f.sheet.id !== sheetId);
        }
      })
      // When a sheet is deleted, remove it from recents and favorites
      .addCase(deleteSheetThunk.fulfilled, (state, action) => {
        const sheetId = action.payload;
        state.recents = state.recents.filter((r) => r.sheet.id !== sheetId);
        state.favorites = state.favorites.filter((f) => f.sheet.id !== sheetId);
      });
  },
});

// ─── Selectors ─────────────────────────────────────────────────────────────

export const selectRecents = (state: RootState) => state.userMeta.recents;
export const selectFavorites = (state: RootState) => state.userMeta.favorites;
export const selectUserMetaLoading = (state: RootState) => state.userMeta.loading;
export const selectUserMetaError = (state: RootState) => state.userMeta.error;

export default userMetaSlice.reducer;
