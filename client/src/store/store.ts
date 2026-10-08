import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';
import adminReducer from './slices/adminSlice';
import workspacesReducer from './slices/workspaceSlice';
import sheetsReducer from './slices/sheetsSlice';
import userMetaReducer from './slices/userMetaSlice';
import gridReducer from './slices/gridSlice';
import orgPolicyReducer from './slices/orgPolicySlice';
import myWorkReducer from './slices/myWorkSlice';
import projectsReducer from './slices/projectsSlice';
import itemDetailReducer from './slices/itemDetailSlice';
import commentsReducer from './slices/commentsSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    admin: adminReducer,
    workspaces: workspacesReducer,
    sheets: sheetsReducer,
    userMeta: userMetaReducer,
    grid: gridReducer,
    orgPolicy: orgPolicyReducer,
    myWork: myWorkReducer,
    projects: projectsReducer,
    itemDetail: itemDetailReducer,
    comments: commentsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
