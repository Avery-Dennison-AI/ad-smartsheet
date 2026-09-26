import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
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
import { IconButton, DropdownMenu, Avatar, Tooltip, Input, Breadcrumbs } from '@/components/ui';
import SidebarNavItem from './SidebarNavItem';

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
  { name: 'Product Launch', slug: 'product-launch', colorVar: 'var(--status-blue)' },
  { name: 'Q3 Planning', slug: 'q3-planning', colorVar: 'var(--status-green)' },
  { name: 'Design System', slug: 'design-system', colorVar: 'var(--status-yellow)' },
];

interface AppShellProps {
  children: ReactNode;
}

/** Top-level layout wrapper used by all pages. */
export default function AppShell({ children }: AppShellProps) {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const location = useLocation();

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
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.path}
              icon={<item.icon className="h-5 w-5" />}
              label={item.label}
              active={location.pathname === item.path}
              collapsed={collapsed}
              to={item.path}
              data-icod-id={`src_components_layout_appshell_tsx_6389_${item.path}`} />
          ))}
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
            {placeholderWorkspaces.map((ws) => (
              <SidebarNavItem
                key={ws.name}
                icon={<div
                  className="h-2 w-2 rounded-[var(--radius-sm)]"
                  style={{ backgroundColor: ws.colorVar }}
                  data-icod-id={`src_components_layout_appshell_tsx_73ad_${ws.name}`} />}
                label={ws.name}
                collapsed={collapsed}
                colorDot={ws.colorVar}
                active={location.pathname === `/workspaces/${ws.slug}`}
                to={`/workspaces/${ws.slug}`}
                data-icod-id={`src_components_layout_appshell_tsx_55ae_${ws.name}`} />
            ))}
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
          <Breadcrumbs
            items={[{ label: 'Workspace' }, { label: 'My Sheet' }]}
            data-icod-id="src_components_layout_appshell_tsx_9b90" />

          {/* Search */}
          <div
            className="hidden sm:block max-w-[320px]"
            data-icod-id="src_components_layout_appshell_tsx_ad42">
            <Input
              leftIcon={<Search
                className="h-4 w-4"
                data-icod-id="src_components_layout_appshell_tsx_ccf2" />}
              placeholder="Search..."
              size="md"
              data-icod-id="src_components_layout_appshell_tsx_1e85" />
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
