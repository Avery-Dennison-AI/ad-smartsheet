import { useEffect, useState } from 'react';
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
  Settings,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { logoutUser, selectCurrentUser, selectAuthInitialized } from '@/store/slices/authSlice';
import { fetchWorkspaces, selectWorkspaceList, selectWorkspaceStatus } from '@/store/slices/workspaceSlice';
import { IconButton, DropdownMenu, Avatar, Tooltip, Input, Breadcrumbs, useToast, WorkspaceIcon } from '@/components/ui';
import SidebarNavItem from './SidebarNavItem';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { CreateWorkspaceModal } from '@/features/workspaces';

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
  const initialized = useAppSelector(selectAuthInitialized);
  const workspaces = useAppSelector(selectWorkspaceList);
  const wsStatus = useAppSelector(selectWorkspaceStatus);
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const breadcrumbItems = useBreadcrumbs();
  const [createOpen, setCreateOpen] = useState(false);

  // Fetch workspaces on mount when authenticated
  useEffect(() => {
    if (initialized && user && wsStatus === 'idle') {
      dispatch(fetchWorkspaces());
    }
  }, [initialized, user, wsStatus, dispatch]);

  async function handleLogout() {
    await dispatch(logoutUser());
    addToast('success', "You've been logged out");
    navigate('/login');
  }

  const userDropdownItems = [
    {
      label: 'Settings',
      icon: <Settings
        className="h-4 w-4"
        data-icod-id="src_components_layout_appshell_tsx_e8f2" />,
      onClick: () => navigate('/settings'),
    },
    { type: 'divider' as const },
    {
      label: 'Log out',
      icon: <LogOut
        className="h-4 w-4"
        data-icod-id="src_components_layout_appshell_tsx_eb3a" />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  const userDropdownHeader = user ? (
    <div data-icod-id="src_components_layout_appshell_tsx_675b">
      <div
        className="text-sm font-medium text-foreground"
        data-icod-id="src_components_layout_appshell_tsx_7097">{user.fullName}</div>
      <div
        className="text-xs text-muted-foreground"
        data-icod-id="src_components_layout_appshell_tsx_a563">{user.email}</div>
    </div>
  ) : undefined;

  return (
    <div
      className="flex h-screen w-full overflow-hidden bg-card"
      data-icod-id="src_components_layout_appshell_tsx_4274">
      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-muted/30 transition-all duration-200 ease-in-out',
          collapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]',
        )}
        data-icod-id="src_components_layout_appshell_tsx_8812">
        {/* Logo area */}
        <div
          className="flex h-[var(--topbar-height)] items-center justify-between border-b border-border px-3"
          data-icod-id="src_components_layout_appshell_tsx_bc76">
          {collapsed ? (
            <div
              className="flex w-full flex-col items-center gap-1"
              data-icod-id="src_components_layout_appshell_tsx_6aaf">
              <Tooltip content="AD Smartsheet" data-icod-id="src_components_layout_appshell_tsx_b053">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-lg)] bg-primary text-sm font-bold text-primary-foreground"
                  data-icod-id="src_components_layout_appshell_tsx_e6ea">
                  AD
                </div>
              </Tooltip>
              <IconButton
                size="sm"
                tooltip="Expand sidebar"
                onClick={() => dispatch(toggleSidebar())}
                data-icod-id="src_components_layout_appshell_tsx_a462">
                <ChevronRight
                  className="h-4 w-4"
                  data-icod-id="src_components_layout_appshell_tsx_7469" />
              </IconButton>
            </div>
          ) : (
            <>
              <div
                className="flex items-center gap-2"
                data-icod-id="src_components_layout_appshell_tsx_1472">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-lg)] bg-primary text-sm font-bold text-primary-foreground"
                  data-icod-id="src_components_layout_appshell_tsx_e5ea">
                  AD
                </div>
                <span
                  className="text-sm font-semibold text-foreground"
                  data-icod-id="src_components_layout_appshell_tsx_2cd4">AD Smartsheet</span>
              </div>
              <IconButton
                size="sm"
                tooltip="Collapse sidebar"
                onClick={() => dispatch(toggleSidebar())}
                className="ml-auto"
                data-icod-id="src_components_layout_appshell_tsx_4c0e">
                <ChevronLeft
                  className="h-4 w-4"
                  data-icod-id="src_components_layout_appshell_tsx_45c7" />
              </IconButton>
            </>
          )}
        </div>

        {/* Navigation + Workspaces (scrollable region for workspaces only) */}
        <nav
          className="flex flex-col px-2 pt-2"
          data-icod-id="src_components_layout_appshell_tsx_2bfb">
          {/* Main nav items */}
          <div
            className="flex flex-col gap-0.5"
            data-icod-id="src_components_layout_appshell_tsx_c094">
            {navItems.map((item) => (
              <SidebarNavItem
                key={item.path}
                icon={<item.icon className="h-4 w-4" />}
                label={item.label}
                active={location.pathname === item.path}
                collapsed={collapsed}
                to={item.path}
                data-icod-id={`src_components_layout_appshell_tsx_bd24_${item.path}`} />
            ))}
          </div>

          {/* Divider */}
          <div
            className="my-3 border-t border-border"
            data-icod-id="src_components_layout_appshell_tsx_9839" />

          {/* Workspaces section header */}
          {!collapsed && (
            <div
              className="mb-1 flex items-center justify-between px-1"
              data-icod-id="src_components_layout_appshell_tsx_98e2">
              <span
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                data-icod-id="src_components_layout_appshell_tsx_a7a2">
                Workspaces
              </span>
              <IconButton
                size="sm"
                tooltip="New workspace"
                onClick={() => setCreateOpen(true)}
                data-icod-id="src_components_layout_appshell_tsx_a774">
                <Plus
                  className="h-3.5 w-3.5"
                  data-icod-id="src_components_layout_appshell_tsx_a5e7" />
              </IconButton>
            </div>
          )}
          {collapsed && (
            <div
              className="mb-1 flex justify-center"
              data-icod-id="src_components_layout_appshell_tsx_d281">
              <IconButton
                size="sm"
                tooltip="New workspace"
                onClick={() => setCreateOpen(true)}
                data-icod-id="src_components_layout_appshell_tsx_d4d7">
                <Plus
                  className="h-3.5 w-3.5"
                  data-icod-id="src_components_layout_appshell_tsx_9198" />
              </IconButton>
            </div>
          )}

          {/* Workspace items — scrollable region */}
          <div
            className="flex flex-1 flex-col gap-0.5 overflow-y-auto"
            data-icod-id="src_components_layout_appshell_tsx_f2c5">
            {workspaces.length === 0 && !collapsed && (
              <div
                className="px-3 py-2 text-xs text-muted-foreground"
                data-icod-id="src_components_layout_appshell_tsx_62b4">No workspaces</div>
            )}
            {workspaces.map((ws) => (
              <SidebarNavItem
                key={ws.id}
                iconNode={<WorkspaceIcon
                  name={ws.name}
                  color={ws.color}
                  size="sm"
                  data-icod-id={`src_components_layout_appshell_tsx_0203_${ws.id}`} />}
                label={ws.name}
                collapsed={collapsed}
                active={location.pathname === `/workspaces/${ws.id}`}
                to={`/workspaces/${ws.id}`}
                data-icod-id={`src_components_layout_appshell_tsx_d3ca_${ws.id}`} />
            ))}
          </div>
        </nav>

        {/* Footer area */}
        <div
          className="mt-auto px-2 pb-2"
          data-icod-id="src_components_layout_appshell_tsx_4dec">
          {/* Settings nav item */}
          <div
            className="border-t border-border my-3 pt-2"
            data-icod-id="src_components_layout_appshell_tsx_8396">
            <SidebarNavItem
              icon={<Settings
                className="h-4 w-4"
                data-icod-id="src_components_layout_appshell_tsx_2c36" />}
              label="Settings"
              active={location.pathname === '/settings'}
              collapsed={collapsed}
              to="/settings"
              data-icod-id="src_components_layout_appshell_tsx_2379" />
          </div>
          {/* Admin section — only visible to admins */}
          {user?.role === 'admin' && (
            <>
              <div
                className="border-t border-border my-3 pt-2"
                data-icod-id="src_components_layout_appshell_tsx_a363">
                {!collapsed && (
                  <div
                    className="mb-1 px-1"
                    data-icod-id="src_components_layout_appshell_tsx_b8e7">
                    <span
                      className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                      data-icod-id="src_components_layout_appshell_tsx_e57e">
                      Admin
                    </span>
                  </div>
                )}
                <SidebarNavItem
                  icon={<Users
                    className="h-4 w-4"
                    data-icod-id="src_components_layout_appshell_tsx_1805" />}
                  label="Users"
                  active={location.pathname === '/admin/users'}
                  collapsed={collapsed}
                  to="/admin/users"
                  data-icod-id="src_components_layout_appshell_tsx_63ac" />
              </div>
            </>
          )}
        </div>
      </aside>
      {/* ─── Right panel ──────────────────────────────────────────────────── */}
      <div
        className="flex flex-1 flex-col min-w-0"
        data-icod-id="src_components_layout_appshell_tsx_b0c7">
        {/* Top bar */}
        <header
          className="flex h-12 shrink-0 items-center gap-4 border-b border-border bg-muted/30 px-4"
          data-icod-id="src_components_layout_appshell_tsx_0217">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={breadcrumbItems}
            data-icod-id="src_components_layout_appshell_tsx_abab" />

          {/* Search */}
          <div
            className="hidden sm:block w-56 md:w-72 mx-auto"
            data-icod-id="src_components_layout_appshell_tsx_2d23">
            <Input
              leftIcon={<Search
                className="h-4 w-4"
                data-icod-id="src_components_layout_appshell_tsx_c13b" />}
              placeholder="Search..."
              size="md"
              readOnly
              rightIcon={
                <kbd
                  className="flex items-center rounded border border-border bg-muted px-1 font-mono leading-none text-2xs text-muted-foreground"
                  data-icod-id="src_components_layout_appshell_tsx_2d49">
                  ⌘K
                </kbd>
              }
              data-icod-id="src_components_layout_appshell_tsx_d8c9" />
          </div>

          {/* Right actions */}
          <div
            className="flex items-center gap-2 ml-auto"
            data-icod-id="src_components_layout_appshell_tsx_d1da">
            <IconButton
              size="md"
              tooltip="Notifications"
              data-icod-id="src_components_layout_appshell_tsx_3d87">
              <Bell
                className="h-4 w-4"
                data-icod-id="src_components_layout_appshell_tsx_6f09" />
            </IconButton>
            <DropdownMenu
              trigger={<Avatar
                name={user?.fullName || 'User'}
                size="sm"
                data-icod-id="src_components_layout_appshell_tsx_8354" />}
              header={userDropdownHeader}
              items={userDropdownItems}
              data-icod-id="src_components_layout_appshell_tsx_70af" />
          </div>
        </header>

        {/* Main content */}
        <main
          className="flex-1 min-h-0 overflow-hidden"
          data-icod-id="src_components_layout_appshell_tsx_ad68">{children}</main>
      </div>
      {/* Create workspace modal */}
      <CreateWorkspaceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        data-icod-id="src_components_layout_appshell_tsx_a343" />
    </div>
  );
}
