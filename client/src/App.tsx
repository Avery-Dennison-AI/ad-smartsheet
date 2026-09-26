import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import { ToastProvider, Spinner } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMe, selectCurrentUser, selectAuthInitialized } from '@/store/slices/authSlice';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import RecentsPage from '@/pages/RecentsPage';
import FavoritesPage from '@/pages/FavoritesPage';
import DesignSystemPage from '@/pages/DesignSystemPage';
import WorkspacePage from '@/pages/WorkspacePage';
import AcceptInvitePage from '@/pages/AcceptInvitePage';
import AdminUsersPage from '@/pages/AdminUsersPage';

/** Shows a full-page centered spinner while auth is initializing. */
function AuthLoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-card" data-icod-id="auth_loading">
      <Spinner size="lg" data-icod-id="src_app_tsx_720a" />
    </div>
  );
}

/** Redirects to /login if not authenticated; renders children if authenticated. */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAppSelector(selectCurrentUser);
  const initialized = useAppSelector(selectAuthInitialized);
  const location = useLocation();

  if (!initialized) return <AuthLoadingScreen data-icod-id="src_app_tsx_f5b4" />;
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  return <>{children}</>;
}

/** Redirects to /home if already authenticated; renders children if not. */
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const user = useAppSelector(selectCurrentUser);
  const initialized = useAppSelector(selectAuthInitialized);

  if (!initialized) return <AuthLoadingScreen data-icod-id="src_app_tsx_2137" />;
  if (user) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

/** Requires authenticated admin user; redirects non-admins to /home. */
function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const user = useAppSelector(selectCurrentUser);
  const initialized = useAppSelector(selectAuthInitialized);
  const location = useLocation();

  if (!initialized) return <AuthLoadingScreen data-icod-id="src_app_tsx_0a02" />;
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (user.role !== 'admin') return <Navigate to="/home" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector(selectAuthInitialized);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  if (!initialized) return <AuthLoadingScreen data-icod-id="src_app_tsx_0b9a" />;

  return (
    <Routes>
      {/* Public routes (no shell) */}
      <Route path="/" element={<LandingPage data-icod-id="src_app_tsx_291f" />} />
      <Route path="/login" element={<PublicOnlyRoute data-icod-id="src_app_tsx_90ed"><LoginPage data-icod-id="src_app_tsx_5879" /></PublicOnlyRoute>} />
      <Route path="/invite/:token" element={<AcceptInvitePage data-icod-id="src_app_tsx_0255" />} />
      {/* Protected routes (wrapped in AppShell) */}
      <Route path="/home" element={<ProtectedRoute data-icod-id="src_app_tsx_17a0"><AppShell data-icod-id="src_app_tsx_2d74"><HomePage data-icod-id="src_app_tsx_6d06" /></AppShell></ProtectedRoute>} />
      <Route path="/recents" element={<ProtectedRoute data-icod-id="src_app_tsx_306b"><AppShell data-icod-id="src_app_tsx_a900"><RecentsPage data-icod-id="src_app_tsx_6633" /></AppShell></ProtectedRoute>} />
      <Route path="/favorites" element={<ProtectedRoute data-icod-id="src_app_tsx_0c3a"><AppShell data-icod-id="src_app_tsx_3d12"><FavoritesPage data-icod-id="src_app_tsx_997c" /></AppShell></ProtectedRoute>} />
      <Route path="/design-system" element={<ProtectedRoute data-icod-id="src_app_tsx_22ed"><AppShell data-icod-id="src_app_tsx_5e50"><DesignSystemPage data-icod-id="src_app_tsx_0ba9" /></AppShell></ProtectedRoute>} />
      <Route path="/workspaces/:id" element={<ProtectedRoute data-icod-id="src_app_tsx_157a"><AppShell data-icod-id="src_app_tsx_66f4"><WorkspacePage data-icod-id="src_app_tsx_e7d0" /></AppShell></ProtectedRoute>} />
      <Route path="/admin/users" element={<AdminOnlyRoute data-icod-id="src_app_tsx_c855"><AppShell data-icod-id="src_app_tsx_a0a1"><AdminUsersPage data-icod-id="src_app_tsx_4c46" /></AppShell></AdminOnlyRoute>} />
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider data-icod-id="src_app_tsx_7e45">
      <BrowserRouter>
        <AppRoutes data-icod-id="src_app_tsx_e30a" />
      </BrowserRouter>
    </ToastProvider>
  );
}
