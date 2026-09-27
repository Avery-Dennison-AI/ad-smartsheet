import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import Tooltip from '@/components/ui/Tooltip';

interface SidebarNavItemProps {
  icon?: ReactNode;
  /** A custom node rendered in place of the icon (e.g. WorkspaceIcon). */
  iconNode?: ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
  to?: string;
  colorDot?: string;
}

const focusRingClasses =
  'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]';

export default function SidebarNavItem({
  icon,
  iconNode,
  label,
  active = false,
  collapsed = false,
  onClick,
  to,
  colorDot,
}: SidebarNavItemProps) {
  const baseClasses = cn(
    'flex items-center rounded-[var(--radius-md)] transition-colors duration-150',
    focusRingClasses,
  );

  // Determine what to render as the leading visual
  const leadingVisual = iconNode
    ? <span
    className="shrink-0"
    data-icod-id="src_components_layout_sidebarnavitem_tsx_6b82">{iconNode}</span>
    : colorDot
      ? (
        <div
          className="h-2 w-2 shrink-0 rounded-[var(--radius-sm)]"
          style={{ backgroundColor: colorDot }}
          data-icod-id="src_components_layout_sidebarnavitem_tsx_d0e8" />
      )
      : (
        <span
          className="flex h-4 w-4 shrink-0 items-center justify-center"
          data-icod-id="src_components_layout_sidebarnavitem_tsx_f53e">
          {icon}
        </span>
      );

  // Collapsed leading visual — use iconNode if available, else dot, else icon
  const collapsedVisual = iconNode
    ? <span
    className="shrink-0"
    data-icod-id="src_components_layout_sidebarnavitem_tsx_a812">{iconNode}</span>
    : colorDot
      ? (
        <div
          className="h-2 w-2 rounded-[var(--radius-sm)]"
          style={{ backgroundColor: colorDot }}
          data-icod-id="src_components_layout_sidebarnavitem_tsx_5e16" />
      )
      : (
        <span
          className="h-4 w-4"
          data-icod-id="src_components_layout_sidebarnavitem_tsx_10d3">{icon}</span>
      );

  if (collapsed) {
    const inner = (
      <span
        className={cn(
          'flex h-8 w-full items-center justify-center',
          baseClasses,
          active
            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
            : 'text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)] hover:text-foreground',
        )}
        data-icod-id="src_components_layout_sidebarnavitem_tsx_a1c8">
        {collapsedVisual}
      </span>
    );

    const wrapped = to ? (
      <Link
        to={to}
        className={cn('block w-full', focusRingClasses)}
        data-icod-id="src_components_layout_sidebarnavitem_tsx_f374">
        {inner}
      </Link>
    ) : (
      <button
        type="button"
        className={cn('appearance-none bg-transparent border-0 p-0 text-left w-full cursor-default', focusRingClasses)}
        onClick={onClick}
        data-icod-id="src_components_layout_sidebarnavitem_tsx_c4ab">
        {inner}
      </button>
    );

    return (
      <Tooltip
        content={label}
        data-icod-id="src_components_layout_sidebarnavitem_tsx_b5f6">
        {wrapped}
      </Tooltip>
    );
  }

  // Expanded mode
  const activeStyle = active
    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
    : 'text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)] hover:text-foreground';

  const inner = (
    <span
      className={cn(
        'flex h-8 w-full items-center gap-2 px-2 text-token-sm',
        baseClasses,
        activeStyle,
      )}
      data-icod-id="src_components_layout_sidebarnavitem_tsx_08ae">
      {leadingVisual}
      <span
        className="truncate"
        data-icod-id="src_components_layout_sidebarnavitem_tsx_8fe5">{label}</span>
    </span>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={cn('block w-full', focusRingClasses)}
        data-icod-id="src_components_layout_sidebarnavitem_tsx_455a">
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn('appearance-none bg-transparent border-0 p-0 text-left w-full cursor-default', focusRingClasses)}
      onClick={onClick}
      data-icod-id="src_components_layout_sidebarnavitem_tsx_8464">
      {inner}
    </button>
  );
}
