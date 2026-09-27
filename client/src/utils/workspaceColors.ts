import type { WorkspaceColor } from '../types';

/** Maps workspace palette names to CSS custom property values. */
export const WORKSPACE_COLOR_VALUES: Record<WorkspaceColor, string> = {
  teal: 'var(--color-primary)',
  blue: 'var(--color-info)',
  green: 'var(--color-success)',
  yellow: 'var(--color-warning)',
  red: 'var(--color-danger)',
  purple: 'var(--status-purple)',
  gray: 'var(--color-gray-400)',
};

/** Returns the resolved CSS colour value for a workspace palette name. */
export function workspaceColorValue(name: string): string {
  return WORKSPACE_COLOR_VALUES[name as WorkspaceColor] || WORKSPACE_COLOR_VALUES.gray;
}
