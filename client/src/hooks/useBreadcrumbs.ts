import { useLocation, useParams } from 'react-router-dom';
import { PLACEHOLDER_WORKSPACES } from '@/utils/workspaces';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

/** Derives breadcrumb items from the current route. */
export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation();
  const params = useParams();
  const pathname = location.pathname;

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
    const slug = params.id || '';
    const workspace = PLACEHOLDER_WORKSPACES.find((ws) => ws.slug === slug);
    const label = workspace?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
