import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Clock,
  Star,
  Plus,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { IconButton, DropdownMenu, Avatar, Tooltip } from '@/components/ui';

interface NavItem {
  label: string;
  path: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Recents', path: '/recents', icon: Clock },
  { label: 'Favorites', path: '/favorites', icon: Star },
];

const placeholderWorkspaces = [
  { name: 'Product Launch', color: 'bg-[var(--status-blue)]' },
  { name: 'Q3 Planning', color: 'bg-[var(--status-green)]' },
  { name: 'Design System', color: 'bg-[var(--status-yellow)]' },
];

interface AppShellProps {
  children: ReactNode;
}

/** Top-level layout wrapper used by all pages. */
export default function AppShell({ children }: AppShellProps) {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div
      className="flex h-screen w-full overflow-hidden bg-[var(--color-bg-app)]"
      data-icod-id="src_components_layout_appshell_tsx_28d4">
      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-card transition-all duration-200 ease-in-out',
          collapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]',
        )}
        data-icod-id="src_components_layout_appshell_tsx_d7bf">
        {/* Logo area */}
        <div
          className="flex h-[var(--topbar-height)] items-center px-3"
          data-icod-id="src_components_layout_appshell_tsx_ccfe">
          {collapsed ? (
            <Tooltip content="GridFlow" data-icod-id="src_components_layout_appshell_tsx_7395">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-primary text-primary-foreground"
                data-icod-id="src_components_layout_appshell_tsx_6d5b">
                <LayoutGrid
                  className="h-4 w-4"
                  data-icod-id="src_components_layout_appshell_tsx_9c43" />
              </div>
            </Tooltip>
          ) : (
            <span
              className="text-[var(--text-md)] font-bold text-primary"
              data-icod-id="src_components_layout_appshell_tsx_a275">GridFlow</span>
          )}
          {!collapsed && (
            <IconButton
              size="sm"
              tooltip="Collapse sidebar"
              onClick={() => dispatch(toggleSidebar())}
              className="ml-auto"
              data-icod-id="src_components_layout_appshell_tsx_eda3">
              <ChevronLeft
                className="h-4 w-4"
                data-icod-id="src_components_layout_appshell_tsx_2971" />
            </IconButton>
          )}
          {collapsed && (
            <div
              className="ml-auto"
              data-icod-id="src_components_layout_appshell_tsx_7b53">
              <IconButton
                size="sm"
                tooltip="Expand sidebar"
                onClick={() => dispatch(toggleSidebar())}
                data-icod-id="src_components_layout_appshell_tsx_e3ad">
                <ChevronRight
                  className="h-4 w-4"
                  data-icod-id="src_components_layout_appshell_tsx_564c" />
              </IconButton>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav
          className="flex flex-1 flex-col gap-0.5 px-2 py-2"
          data-icod-id="src_components_layout_appshell_tsx_be7f">
          {navItems.map((item, __icodIdx0) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return collapsed ? (
              <Tooltip
                key={item.path}
                content={item.label}
                data-icod-id={`src_components_layout_appshell_tsx_7915_${__icodIdx0}`}>
                <button
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'flex h-9 w-full items-center justify-center rounded-[var(--radius-md)] transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]',
                    isActive
                      ? 'bg-accent text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                  data-icod-id={`src_components_layout_appshell_tsx_07ba_${__icodIdx0}`}>
                  <Icon
                    className="h-5 w-5"
                    data-icod-id={`src_components_layout_appshell_tsx_2db7_${__icodIdx0}`} />
                </button>
              </Tooltip>
            ) : (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex h-9 w-full items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]',
                  isActive
                    ? 'border-l-[3px] border-l-primary bg-accent text-primary font-medium'
                    : 'border-l-[3px] border-l-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                data-icod-id={`src_components_layout_appshell_tsx_1960_${__icodIdx0}`}>
                <Icon
                  className="h-5 w-5 shrink-0"
                  data-icod-id={`src_components_layout_appshell_tsx_b920_${__icodIdx0}`} />
                <span data-icod-id={`src_components_layout_appshell_tsx_74e2_${__icodIdx0}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Workspaces section */}
        <div
          className="border-t border-border px-2 py-3"
          data-icod-id="src_components_layout_appshell_tsx_76ae">
          {!collapsed && (
            <div
              className="mb-2 flex items-center justify-between px-1"
              data-icod-id="src_components_layout_appshell_tsx_238d">
              <span
                className="text-[var(--text-xs)] font-medium uppercase tracking-wider text-[var(--color-gray-600)]"
                data-icod-id="src_components_layout_appshell_tsx_b6da">
                Workspaces
              </span>
              <IconButton
                size="sm"
                tooltip="New workspace"
                data-icod-id="src_components_layout_appshell_tsx_8213">
                <Plus
                  className="h-3.5 w-3.5"
                  data-icod-id="src_components_layout_appshell_tsx_cbcc" />
              </IconButton>
            </div>
          )}
          <div
            className="flex flex-col gap-0.5"
            data-icod-id="src_components_layout_appshell_tsx_fd6f">
            {placeholderWorkspaces.map((ws, __icodIdx1) => collapsed ? (
              <Tooltip
                key={ws.name}
                content={ws.name}
                data-icod-id={`src_components_layout_appshell_tsx_aa05_${__icodIdx1}`}>
                <div
                  className="flex h-9 w-full items-center justify-center rounded-[var(--radius-md)] text-muted-foreground hover:bg-muted transition-colors duration-150 cursor-pointer"
                  data-icod-id={`src_components_layout_appshell_tsx_fc74_${__icodIdx1}`}>
                  <div
                    className={cn('h-2 w-2 rounded-[var(--radius-sm)]', ws.color)}
                    data-icod-id={`src_components_layout_appshell_tsx_0f3a_${__icodIdx1}`} />
                </div>
              </Tooltip>
            ) : (
              <div
                key={ws.name}
                className="flex h-8 w-full items-center gap-2.5 rounded-[var(--radius-md)] px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150 cursor-pointer"
                data-icod-id={`src_components_layout_appshell_tsx_b35b_${__icodIdx1}`}>
                <div
                  className={cn('h-2 w-2 shrink-0 rounded-[var(--radius-sm)]', ws.color)}
                  data-icod-id={`src_components_layout_appshell_tsx_814d_${__icodIdx1}`} />
                <span
                  className="truncate"
                  data-icod-id={`src_components_layout_appshell_tsx_0f48_${__icodIdx1}`}>{ws.name}</span>
              </div>
            ),
            )}
          </div>
        </div>
      </aside>
      {/* ─── Right panel ──────────────────────────────────────────────────── */}
      <div
        className="flex flex-1 flex-col min-w-0"
        data-icod-id="src_components_layout_appshell_tsx_a2eb">
        {/* Top bar */}
        <header
          className="flex h-[var(--topbar-height)] shrink-0 items-center justify-between border-b border-border bg-card px-4"
          data-icod-id="src_components_layout_appshell_tsx_f2bf">
          {/* Breadcrumbs */}
          <div
            className="flex items-center gap-1 text-[var(--text-sm)]"
            data-icod-id="src_components_layout_appshell_tsx_2f26">
            <span
              className="text-[var(--color-gray-600)]"
              data-icod-id="src_components_layout_appshell_tsx_a2c6">Workspace</span>
            <span
              className="text-[var(--color-gray-400)]"
              data-icod-id="src_components_layout_appshell_tsx_b404">&rsaquo;</span>
            <span
              className="font-medium text-[var(--color-gray-900)]"
              data-icod-id="src_components_layout_appshell_tsx_e214">Sheet name</span>
          </div>

          {/* Search */}
          <div
            className="relative hidden sm:block"
            data-icod-id="src_components_layout_appshell_tsx_ad42">
            <Search
              className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              data-icod-id="src_components_layout_appshell_tsx_9c0e" />
            <input
              type="text"
              placeholder="Search..."
              className="h-8 max-w-[320px] rounded-[var(--radius-sm)] border border-border bg-muted/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:bg-card focus:outline-none focus:shadow-[var(--focus-ring)] transition-colors duration-150"
              data-icod-id="src_components_layout_appshell_tsx_3b3a" />
          </div>

          {/* Right actions */}
          <div
            className="flex items-center gap-2"
            data-icod-id="src_components_layout_appshell_tsx_77f1">
            <IconButton
              size="md"
              tooltip="Notifications"
              data-icod-id="src_components_layout_appshell_tsx_e85c">
              <Bell
                className="h-5 w-5"
                data-icod-id="src_components_layout_appshell_tsx_14ba" />
            </IconButton>
            <DropdownMenu
              trigger={<Avatar
                name="Demo User"
                size="md"
                data-icod-id="src_components_layout_appshell_tsx_32b9" />}
              items={[
                { label: 'Profile', icon: <User
                  className="h-4 w-4"
                  data-icod-id="src_components_layout_appshell_tsx_ae81" /> },
                { label: 'Settings', icon: <Settings
                  className="h-4 w-4"
                  data-icod-id="src_components_layout_appshell_tsx_d1dd" /> },
                { type: 'divider' },
                { label: 'Log out', icon: <LogOut
                  className="h-4 w-4"
                  data-icod-id="src_components_layout_appshell_tsx_6b6d" />, danger: true },
              ]}
              data-icod-id="src_components_layout_appshell_tsx_8dbc" />
          </div>
        </header>

        {/* Main content */}
        <main
          className="flex-1 overflow-y-auto p-[var(--space-6)]"
          data-icod-id="src_components_layout_appshell_tsx_338c">
          {children}
        </main>
      </div>
    </div>
  );
}
