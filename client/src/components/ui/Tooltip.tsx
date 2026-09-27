import { useState, useRef, useEffect, useLayoutEffect, type ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { cn } from '@/utils/cn';

export interface TooltipProps {
  content: string;
  children: ReactNode;
  className?: string;
}

/** Hover/focus triggered tooltip positioned above the target.
 *  Renders via a portal into document.body so it is never clipped
 *  by overflow-hidden or scrollable parent containers. */
export default function Tooltip({ content, children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; placement: 'above' | 'below' } | null>(null);

  const show = () => {
    clearTimeout(timeoutRef.current);
    setVisible(true);
  };

  const hide = () => {
    timeoutRef.current = setTimeout(() => setVisible(false), 100);
  };

  // Compute position whenever visible changes
  useLayoutEffect(() => {
    if (!visible || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const gap = 8;
    const triggerTop = rect.top;
    const triggerCenterX = rect.left + rect.width / 2;

    // Default: above the trigger
    let placement: 'above' | 'below' = 'above';
    let top = triggerTop - gap;

    // Flip to below if not enough room above (trigger within ~40px of viewport top)
    if (triggerTop < 40) {
      placement = 'below';
      top = rect.bottom + gap;
    }

    setPos({ top, left: triggerCenterX, placement });
  }, [visible]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const tooltipPortal = visible && pos
    ? ReactDOM.createPortal(
        <div
          role="tooltip"
          className={cn(
            'fixed whitespace-nowrap',
            'rounded-[var(--radius-sm)] bg-foreground px-2 py-1 text-xs text-card',
            'shadow-[var(--shadow-sm)] pointer-events-none',
          )}
          style={{
            zIndex: 'var(--z-tooltip)',
            top: pos.placement === 'above' ? pos.top : pos.top,
            left: pos.left,
            transform: pos.placement === 'above'
              ? 'translate(-50%, -100%)'
              : 'translate(-50%, 0)',
          }}
          data-icod-id="src_components_ui_tooltip_tsx_9194">
          {content}
          {/* Arrow */}
          {pos.placement === 'above' ? (
            <div
              className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground"
              data-icod-id="src_components_ui_tooltip_tsx_9349" />
          ) : (
            <div
              className="absolute left-1/2 bottom-full -translate-x-1/2 border-4 border-transparent border-b-foreground"
              data-icod-id="src_components_ui_tooltip_tsx_arrow_below" />
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <div
      ref={wrapperRef}
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      data-icod-id="src_components_ui_tooltip_tsx_5f6b">
      {children}
      {tooltipPortal}
    </div>
  );
}
