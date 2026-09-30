import { useLocation, useParams } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentWorkspace } from '@/store/slices/workspaceSlice';
import { selectCurrentSheet } from '@/store/slices/sheetsSlice';

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

  if (pathname === '/home') {
    return [{ label: 'Home' }];
  }

  if (pathname === '/recents') {
    return [{ label: 'Recents' }];
  }

  if (pathname === '/favorites') {
    return [{ label: 'Favorites' }];
  }

  if (pathname.startsWith('/sheets/')) {
    const sheetName = sheet?.name || params.sheetId || 'Sheet';
    const workspaceId = sheet?.workspaceId;
    const workspaceName = workspace?.name || 'Workspace';
    const items: BreadcrumbItem[] = [];
    if (workspaceId) {
      items.push({ label: workspaceName, to: `/workspaces/${workspaceId}` });
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
