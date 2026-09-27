import { type ReactNode, Children, isValidElement } from 'react';
import { cn } from '@/utils/cn';

export interface ToolbarProps {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export interface ToolbarGroupProps {
  children: ReactNode;
}

/** A slim horizontal toolbar row. */
export function Toolbar({ children, disabled = false, className }: ToolbarProps) {
  const items = Children.toArray(children).filter(isValidElement);

  return (
    <div
      role="toolbar"
      className={cn(
        'flex items-center h-8 px-2 gap-0 border-b bg-card',
        disabled && 'opacity-50 pointer-events-none',
        className,
      )}
      style={{ borderColor: 'rgb(var(--border))' }}
      data-icod-id="src_components_ui_toolbar_tsx_f1a0">
      {items.map((child, idx) => (
        <span
          key={idx}
          className="contents"
          data-icod-id={`src_components_ui_toolbar_tsx_b4b7_${idx}`}>
          {idx > 0 && (
            <div
              className="w-px h-4 mx-1.5 shrink-0"
              style={{ backgroundColor: 'rgb(var(--border))' }}
              data-icod-id={`src_components_ui_toolbar_tsx_2e77_${idx}`} />
          )}
          {child}
        </span>
      ))}
    </div>
  );
}

/** Groups related toolbar items together. */
export function ToolbarGroup({ children }: ToolbarGroupProps) {
  return (
    <div
      className="flex items-center gap-0.5"
      data-icod-id="src_components_ui_toolbar_tsx_fed9">{children}</div>
  );
}
