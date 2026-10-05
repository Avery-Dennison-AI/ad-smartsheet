import type { Column, GridRow, CellFormatting } from '../../../types';

export interface GridMember {
  id: string;
  fullName: string;
  email: string;
}

export interface GridSliceState {
  columns: Column[];
  rows: GridRow[];
  members: GridMember[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveError: string | null;
  errorStatus?: number;
}

export const initialState: GridSliceState = {
  columns: [],
  rows: [],
  members: [],
  loading: false,
  saving: false,
  error: null,
  saveError: null,
  errorStatus: undefined,
};

/** Stable empty formatting constant (avoids re-renders). */
export const EMPTY_FORMATTING: CellFormatting = {};
