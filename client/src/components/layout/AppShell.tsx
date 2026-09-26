import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Clock,
  Star,
  Plus,
  Search,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { logoutUser, selectCurrentUser } from '@/store/slices/authSlice';
import { IconButton, DropdownMenu, Avatar, Tooltip, Input, Breadcrumbs, useToast, WorkspaceIcon } from '@/components/ui';
import SidebarNavItem from './SidebarNavItem';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { PLACEHOLDER_WORKSPACES } from '@/utils/workspaces';

interface NavItem {
  label: string;
  path: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  { label: 'Home', path: '/home', icon: Home },
  { label: 'Recents', path: '/recents', icon: Clock },
  { label: 'Favorites', path: '/favorites', icon: Star },
];

interface AppShellProps {
  children: ReactNode;
}

/** Top-level layout wrapper used by all pages. */
export default function AppShell({ children }: AppShellProps) {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const user = useAppSelector(selectCurrentUser);
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const breadcrumbItems = useBreadcrumbs();

  async function handleLogout() {
    await dispatch(logoutUser());
    addToast('success', "You've been logged out");
    navigate('/login');
  }

  const userDropdownItems = [
    { type: 'divider' as const },
    {
      label: 'Log out',
      icon: <LogOut
        className="h-4 w-4"
        data-icod-id="src_components_layout_appshell_tsx_604d" />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  const userDropdownHeader = user ? (
    <div data-icod-id="src_components_layout_appshell_tsx_d948">
      <div
        className="text-[var(--text-sm)] font-medium text-[var(--color-gray-900)]"
        data-icod-id="src_components_layout_appshell_tsx_6e5e">
        {user.fullName}
      </div>
      <div
        className="text-[var(--text-xs)] text-[var(--color-gray-600)]"
        data-icod-id="src_components_layout_appshell_tsx_28b7">
        {user.email}
      </div>
    </div>
  ) : undefined;

  return (
    <div
      className="flex h-screen w-full overflow-hidden bg-[var(--color-bg-app)]"
      data-icod-id="src_components_layout_appshell_tsx_506d">
      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-[var(--color-bg-surface)] transition-all duration-200 ease-in-out',
          collapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]',
        )}
        data-icod-id="src_components_layout_appshell_tsx_63f3">
        {/* Logo area */}
        <div
          className="flex h-[var(--topbar-height)] items-center justify-between border-b border-border px-3"
          data-icod-id="src_components_layout_appshell_tsx_de83">
          {collapsed ? (
            <div
              className="flex w-full flex-col items-center gap-1"
              data-icod-id="src_components_layout_appshell_tsx_1e53">
              <Tooltip content="GridFlow" data-icod-id="src_components_layout_appshell_tsx_cfcf">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[var(--text-sm)] font-bold text-white"
                  data-icod-id="src_components_layout_appshell_tsx_4cd2">
                  GF
                </div>
              </Tooltip>
              <IconButton
                size="sm"
                tooltip="Expand sidebar"
                onClick={() => dispatch(toggleSidebar())}
                data-icod-id="src_components_layout_appshell_tsx_78bc">
                <ChevronRight
                  className="h-4 w-4"
                  data-icod-id="src_components_layout_appshell_tsx_c966" />
              </IconButton>
            </div>
          ) : (
            <>
              <div
                className="flex items-center gap-2"
                data-icod-id="src_components_layout_appshell_tsx_1947">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[var(--text-sm)] font-bold text-white"
                  data-icod-id="src_components_layout_appshell_tsx_eca9">
                  GF
                </div>
                <span
                  className="text-[var(--text-sm)] font-semibold text-[var(--color-gray-900)]"
                  data-icod-id="src_components_layout_appshell_tsx_c345">
                  GridFlow
                </span>
              </div>
              <IconButton
                size="sm"
                tooltip="Collapse sidebar"
                onClick={() => dispatch(toggleSidebar())}
                className="ml-auto"
                data-icod-id="src_components_layout_appshell_tsx_afd7">
                <ChevronLeft
                  className="h-4 w-4"
                  data-icod-id="src_components_layout_appshell_tsx_fb24" />
              </IconButton>
            </>
          )}
        </div>

        {/* Navigation + Workspaces (scrollable region for workspaces only) */}
        <nav
          className="flex flex-col px-2 pt-2"
          data-icod-id="src_components_layout_appshell_tsx_3a94">
          {/* Main nav items */}
          <div
            className="flex flex-col gap-0.5"
            data-icod-id="src_components_layout_appshell_tsx_bbe3">
            {navItems.map((item) => (
              <SidebarNavItem
                key={item.path}
                icon={<item.icon className="h-4 w-4" />}
                label={item.label}
                active={location.pathname === item.path}
                collapsed={collapsed}
                to={item.path}
                data-icod-id={`src_components_layout_appshell_tsx_2132_${item.path}`} />
            ))}
          </div>

          {/* Divider */}
          <div
            className="my-3 border-t border-border"
            data-icod-id="src_components_layout_appshell_tsx_2801" />

          {/* Workspaces section header */}
          {!collapsed && (
            <div
              className="mb-1 flex items-center justify-between px-1"
              data-icod-id="src_components_layout_appshell_tsx_47c8">
              <span
                className="text-[var(--text-xs)] font-semibold uppercase tracking-widest text-[var(--color-gray-400)]"
                data-icod-id="src_components_layout_appshell_tsx_b5c2">
                Workspaces
              </span>
              <IconButton
                size="sm"
                tooltip="New workspace"
                data-icod-id="src_components_layout_appshell_tsx_e5d4">
                <Plus
                  className="h-3.5 w-3.5"
                  data-icod-id="src_components_layout_appshell_tsx_f9b1" />
              </IconButton>
            </div>
          )}
          {collapsed && (
            <div
              className="mb-1 flex justify-center"
              data-icod-id="src_components_layout_appshell_tsx_de28">
              <IconButton
                size="sm"
                tooltip="New workspace"
                data-icod-id="src_components_layout_appshell_tsx_ea4d">
                <Plus
                  className="h-3.5 w-3.5"
                  data-icod-id="src_components_layout_appshell_tsx_9a53" />
              </IconButton>
            </div>
          )}

          {/* Workspace items — scrollable region */}
          <div
            className="flex flex-1 flex-col gap-0.5 overflow-y-auto"
            data-icod-id="src_components_layout_appshell_tsx_0a49">
            {PLACEHOLDER_WORKSPACES.map((ws) => (
              <SidebarNavItem
                key={ws.slug}
                iconNode={
                  <WorkspaceIcon
                    name={ws.name}
                    color={ws.colorVar}
                    size="sm"
                    data-icod-id={`src_components_layout_appshell_tsx_9409_${ws.slug}`} />
                }
                label={ws.name}
                collapsed={collapsed}
                active={location.pathname === `/workspaces/${ws.slug}`}
                to={`/workspaces/${ws.slug}`}
                data-icod-id={`src_components_layout_appshell_tsx_7345_${ws.slug}`} />
            ))}
          </div>
        </nav>

        {/* Footer area */}
        <div
          className="mt-auto px-2 pb-2"
          data-icod-id="src_components_layout_appshell_tsx_fe25">
          {/* Admin section — only visible to admins */}
          {user?.role === 'admin' && (
            <>
              <div
                className="border-t border-border my-3 pt-2"
                data-icod-id="src_components_layout_appshell_tsx_eee9">
                {!collapsed && (
                  <div
                    className="mb-1 px-1"
                    data-icod-id="src_components_layout_appshell_tsx_2284">
                    <span
                      className="text-[var(--text-xs)] font-semibold uppercase tracking-widest text-[var(--color-gray-400)]"
                      data-icod-id="src_components_layout_appshell_tsx_e56e">
                      Admin
                    </span>
                  </div>
                )}
                <SidebarNavItem
                  icon={<Users
                    className="h-4 w-4"
                    data-icod-id="src_components_layout_appshell_tsx_8c20" />}
                  label="Users"
                  active={location.pathname === '/admin/users'}
                  collapsed={collapsed}
                  to="/admin/users"
                  data-icod-id="src_components_layout_appshell_tsx_053e" />
              </div>
            </>
          )}
        </div>
      </aside>
      {/* ─── Right panel ──────────────────────────────────────────────────── */}
      <div
        className="flex flex-1 flex-col min-w-0"
        data-icod-id="src_components_layout_appshell_tsx_c6e5">
        {/* Top bar */}
        <header
          className="flex h-12 shrink-0 items-center gap-4 border-b border-border bg-[var(--color-bg-surface)] px-4"
          data-icod-id="src_components_layout_appshell_tsx_88b5">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={breadcrumbItems}
            data-icod-id="src_components_layout_appshell_tsx_c446" />

          {/* Search */}
          <div
            className="hidden sm:block w-56 md:w-72 mx-auto"
            data-icod-id="src_components_layout_appshell_tsx_8348">
            <Input
              leftIcon={<Search
                className="h-4 w-4"
                data-icod-id="src_components_layout_appshell_tsx_85d3" />}
              placeholder="Search..."
              size="md"
              readOnly
              rightIcon={
                <kbd
                  className="flex items-center rounded border border-border bg-[var(--color-gray-100)] px-1 font-mono leading-none text-[var(--text-2xs)] text-[var(--color-gray-400)]"
                  data-icod-id="src_components_layout_appshell_tsx_d263">
                  ⌘K
                </kbd>
              }
              data-icod-id="src_components_layout_appshell_tsx_7c08" />
          </div>

          {/* Right actions */}
          <div
            className="flex items-center gap-2 ml-auto"
            data-icod-id="src_components_layout_appshell_tsx_2ec4">
            <IconButton
              size="md"
              tooltip="Notifications"
              data-icod-id="src_components_layout_appshell_tsx_1802">
              <Bell
                className="h-4 w-4"
                data-icod-id="src_components_layout_appshell_tsx_caa1" />
            </IconButton>
            <DropdownMenu
              trigger={<Avatar
                name={user?.fullName || 'User'}
                size="sm"
                data-icod-id="src_components_layout_appshell_tsx_a642" />}
              header={userDropdownHeader}
              items={userDropdownItems}
              data-icod-id="src_components_layout_appshell_tsx_d3f6" />
          </div>
        </header>

        {/* Main content */}
        <main
          className="flex-1 overflow-y-auto"
          data-icod-id="src_components_layout_appshell_tsx_c856">
          {children}
        </main>
      </div>
    </div>
  );
}
