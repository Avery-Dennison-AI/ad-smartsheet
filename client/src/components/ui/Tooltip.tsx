import { useState, useRef, useEffect, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface TooltipProps {
  content: string;
  children: ReactNode;
  className?: string;
}

/** Hover/focus triggered tooltip positioned above the target. */
export default function Tooltip({ content, children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const show = () => {
    clearTimeout(timeoutRef.current);
    setVisible(true);
  };

  const hide = () => {
    timeoutRef.current = setTimeout(() => setVisible(false), 100);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      data-icod-id="src_components_ui_tooltip_tsx_5f6b">
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            'absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap',
            'rounded-[var(--radius-sm)] bg-foreground px-2 py-1 text-xs text-card',
            'shadow-[var(--shadow-sm)] pointer-events-none',
          )}
          data-icod-id="src_components_ui_tooltip_tsx_9194">
          {content}
          {/* Arrow */}
          <div
            className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground"
            data-icod-id="src_components_ui_tooltip_tsx_9349" />
        </div>
      )}
    </div>
  );
}
