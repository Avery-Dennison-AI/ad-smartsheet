import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';

// Add one entry per slice in ./slices — e.g. products: productsReducer.
export const store = configureStore({
  reducer: {
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
