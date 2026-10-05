import { useLocation, useParams } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentWorkspace } from '@/store/slices/workspaceSlice';
import { selectCurrentSheet } from '@/store/slices/sheetsSlice';
import { selectCurrentUser } from '@/store/slices/authSlice';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

/** Derives breadcrumb items from the current route. */
export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation();
  const params = useParams();
  const pathname = location.pathname;
  const workspace = useAppSelector(selectCurrentWorkspace);
  const sheet = useAppSelector(selectCurrentSheet);
  const user = useAppSelector(selectCurrentUser);
  const isGuest = user?.orgRole === 'guest';

  if (pathname === '/home') {
    return [{ label: 'Home' }];
  }

  if (pathname === '/recents') {
    return [{ label: 'Recents' }];
  }

  if (pathname === '/favorites') {
    return [{ label: 'Favorites' }];
  }

  if (pathname === '/shared-with-me') {
    return [{ label: 'Shared with me' }];
  }

  if (pathname.startsWith('/sheets/')) {
    const sheetName = sheet?.name || params.sheetId || 'Sheet';
    const workspaceId = sheet?.workspaceId;
    const workspaceName = workspace?.name || 'Workspace';
    const items: BreadcrumbItem[] = [];
    if (workspaceId && !isGuest) {
      items.push({ label: workspaceName, to: `/workspaces/${workspaceId}` });
    } else if (workspaceId && isGuest) {
      // Guests see workspace name as plain text, not a link
      items.push({ label: workspaceName });
    }
    items.push({ label: sheetName });
    return items;
  }

  if (pathname.startsWith('/workspaces/')) {
    const label = workspace?.name || params.id || 'Workspace';
    return [
      { label: 'Workspaces', to: '/home' },
      { label },
    ];
  }

  if (pathname === '/admin/users') {
    return [{ label: 'Settings', to: '/settings' }, { label: 'Users' }];
  }

  if (pathname === '/settings/appearance') {
    return [{ label: 'Settings', to: '/settings' }, { label: 'Appearance' }];
  }

  if (pathname === '/settings/users') {
    return [{ label: 'Settings', to: '/settings' }, { label: 'Users' }];
  }

  if (pathname === '/settings') {
    return [{ label: 'Settings' }];
  }

  if (pathname === '/design-system') {
    return [{ label: 'Design System' }];
  }

  return [];
}
