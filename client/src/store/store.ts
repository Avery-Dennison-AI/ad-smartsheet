import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';
import adminReducer from './slices/adminSlice';
import workspacesReducer from './slices/workspaceSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    admin: adminReducer,
    workspaces: workspacesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
