import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getOrgPolicy as fetchOrgPolicyApi, updateOrgPolicy as updateOrgPolicyApi } from '../../services/orgPolicyService';
import { parseApiError } from '../../utils/parseApiError';
import type { OrgPolicy } from '../../types';

interface OrgPolicyState {
  policy: OrgPolicy | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
}

const initialState: OrgPolicyState = {
  policy: null,
  loading: false,
  error: null,
  saving: false,
};

export const fetchOrgPolicy = createAsyncThunk(
  'orgPolicy/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await fetchOrgPolicyApi();
      return data.data;
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

export const saveOrgPolicy = createAsyncThunk(
  'orgPolicy/save',
  async (patch: Partial<OrgPolicy>, { rejectWithValue }) => {
    try {
      const { data } = await updateOrgPolicyApi(patch);
      return data.data;
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err).message);
    }
  },
);

const orgPolicySlice = createSlice({
  name: 'orgPolicy',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrgPolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrgPolicy.fulfilled, (state, action) => {
        state.loading = false;
        state.policy = action.payload;
      })
      .addCase(fetchOrgPolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to fetch organization policy';
      })
      .addCase(saveOrgPolicy.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveOrgPolicy.fulfilled, (state, action) => {
        state.saving = false;
        state.policy = action.payload;
      })
      .addCase(saveOrgPolicy.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) ?? 'Failed to save organization policy';
      });
  },
});

export const selectOrgPolicy = (state: { orgPolicy: OrgPolicyState }) => state.orgPolicy.policy;
export const selectOrgPolicyLoading = (state: { orgPolicy: OrgPolicyState }) => state.orgPolicy.loading;
export const selectOrgPolicySaving = (state: { orgPolicy: OrgPolicyState }) => state.orgPolicy.saving;
export const selectOrgPolicyError = (state: { orgPolicy: OrgPolicyState }) => state.orgPolicy.error;

export default orgPolicySlice.reducer;
