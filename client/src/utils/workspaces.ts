export interface WorkspaceItem {
  name: string;
  slug: string;
  colorVar: string;
}

/** Shared placeholder workspace data used by AppShell sidebar and HomePage. */
export const PLACEHOLDER_WORKSPACES: WorkspaceItem[] = [
  { name: 'Product Launch', slug: 'product-launch', colorVar: 'var(--status-blue)' },
  { name: 'Q3 Planning', slug: 'q3-planning', colorVar: 'var(--status-green)' },
  { name: 'Design System', slug: 'design-system', colorVar: 'var(--status-yellow)' },
];
