import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface CardProps extends ComponentPropsWithoutRef<'div'> {
  header?: ReactNode;
  footer?: ReactNode;
}

/**
 * White surface with border, radius-lg. No drop shadow on flat surfaces.
 * Optional header/footer sections.
 */
export default function Card({ header, footer, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-border bg-card text-card-foreground',
        className,
      )}
      data-icod-id="src_components_ui_card_tsx_6f5d"
      {...rest}>
      {header && (
        <div
          className="border-b border-border px-4 py-3 font-medium text-sm"
          data-icod-id="src_components_ui_card_tsx_2c16">
          {header}
        </div>
      )}
      <div data-icod-id="src_components_ui_card_tsx_5279">{children}</div>
      {footer && (
        <div
          className="border-t border-border px-4 py-3"
          data-icod-id="src_components_ui_card_tsx_787f">
          {footer}
        </div>
      )}
    </div>
  );
}
