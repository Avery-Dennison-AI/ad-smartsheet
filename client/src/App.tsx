import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import { ToastProvider } from '@/components/ui';
import HomePage from '@/pages/HomePage';
import RecentsPage from '@/pages/RecentsPage';
import FavoritesPage from '@/pages/FavoritesPage';
import DesignSystemPage from '@/pages/DesignSystemPage';

export default function App() {
  return (
    <ToastProvider data-icod-id="src_app_tsx_7e45">
      <BrowserRouter>
        <AppShell data-icod-id="src_app_tsx_2398">
          <Routes>
            <Route path="/" element={<HomePage data-icod-id="src_app_tsx_7842" />} />
            <Route path="/recents" element={<RecentsPage data-icod-id="src_app_tsx_b41d" />} />
            <Route path="/favorites" element={<FavoritesPage data-icod-id="src_app_tsx_9cfc" />} />
            <Route path="/design-system" element={<DesignSystemPage data-icod-id="src_app_tsx_11f8" />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </ToastProvider>
  );
}
