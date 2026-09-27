import { useLocation, useParams } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentWorkspace } from '@/store/slices/workspaceSlice';

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

  if (pathname === '/home') {
    return [{ label: 'Home' }];
  }

  if (pathname === '/recents') {
    return [{ label: 'Recents' }];
  }

  if (pathname === '/favorites') {
    return [{ label: 'Favorites' }];
  }

  if (pathname.startsWith('/workspaces/')) {
    const label = workspace?.name || params.id || 'Workspace';
    return [
      { label: 'Workspaces', to: '/home' },
      { label },
    ];
  }

  if (pathname === '/admin/users') {
    return [{ label: 'Admin' }, { label: 'Users' }];
  }

  if (pathname === '/design-system') {
    return [{ label: 'Design System' }];
  }

  return [];
}
