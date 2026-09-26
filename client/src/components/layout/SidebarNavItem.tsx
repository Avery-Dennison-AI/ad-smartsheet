import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import Tooltip from '@/components/ui/Tooltip';

interface SidebarNavItemProps {
  icon: ReactNode;
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

  if (collapsed) {
    const content = colorDot ? (
      <div
        className="h-2 w-2 rounded-[var(--radius-sm)]"
        style={{ backgroundColor: colorDot }}
        data-icod-id="src_components_layout_sidebarnavitem_tsx_169c" />
    ) : (
      <span
        className="h-5 w-5"
        data-icod-id="src_components_layout_sidebarnavitem_tsx_4afb">{icon}</span>
    );

    const inner = (
      <span
        className={cn(
          'flex h-9 w-full items-center justify-center',
          baseClasses,
          active
            ? 'bg-accent text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
        data-icod-id="src_components_layout_sidebarnavitem_tsx_e69c">
        {content}
      </span>
    );

    const wrapped = to ? (
      <Link
        to={to}
        className={cn('block w-full', focusRingClasses)}
        data-icod-id="src_components_layout_sidebarnavitem_tsx_2a53">{inner}</Link>
    ) : (
      <button
        type="button"
        className={cn('appearance-none bg-transparent border-0 p-0 text-left w-full cursor-default', focusRingClasses)}
        onClick={onClick}
        data-icod-id="src_components_layout_sidebarnavitem_tsx_8338">
        {inner}
      </button>
    );

    return (
      <Tooltip
        content={label}
        data-icod-id="src_components_layout_sidebarnavitem_tsx_ac6f">
        {wrapped}
      </Tooltip>
    );
  }

  // Expanded mode
  const activeStyle = active
    ? 'border-l-[3px] border-l-primary bg-[var(--color-primary-bg)] text-primary font-medium'
    : 'border-l-[3px] border-l-transparent text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)] hover:text-foreground';

  const inner = (
    <span
      className={cn(
        'flex h-9 w-full items-center gap-3 px-3 text-sm',
        baseClasses,
        activeStyle,
      )}
      data-icod-id="src_components_layout_sidebarnavitem_tsx_0d26">
      {colorDot ? (
        <div
          className="h-2 w-2 shrink-0 rounded-[var(--radius-sm)]"
          style={{ backgroundColor: colorDot }}
          data-icod-id="src_components_layout_sidebarnavitem_tsx_975b" />
      ) : (
        <span
          className="h-5 w-5 shrink-0"
          data-icod-id="src_components_layout_sidebarnavitem_tsx_0569">{icon}</span>
      )}
      <span
        className="truncate"
        data-icod-id="src_components_layout_sidebarnavitem_tsx_3a95">{label}</span>
    </span>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={cn('block w-full', focusRingClasses)}
        data-icod-id="src_components_layout_sidebarnavitem_tsx_c18b">{inner}</Link>
    );
  }

  return (
    <button
      type="button"
      className={cn('appearance-none bg-transparent border-0 p-0 text-left w-full cursor-default', focusRingClasses)}
      onClick={onClick}
      data-icod-id="src_components_layout_sidebarnavitem_tsx_2942">
      {inner}
    </button>
  );
}
