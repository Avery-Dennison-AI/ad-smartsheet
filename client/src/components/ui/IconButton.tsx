import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import Tooltip from './Tooltip';

export type IconButtonSize = 'sm' | 'md' | 'lg';

const sizeClass: Record<IconButtonSize, string> = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

const iconSizeClass: Record<IconButtonSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-5 w-5',
};

export interface IconButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'title'> {
  size?: IconButtonSize;
  /** Accessible label — rendered as aria-label and tooltip content. Required. */
  tooltip: string;
  /** The icon element to render (lucide-react component). */
  children: ReactNode;
}

/** Square ghost button for icon-only actions. */
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { size = 'md', tooltip, className, children, ...rest },
  ref,
) {
  return (
    <Tooltip content={tooltip} data-icod-id="src_components_ui_iconbutton_tsx_d8d9">
      <button
        ref={ref}
        type="button"
        aria-label={tooltip}
        className={cn(
          'inline-flex items-center justify-center rounded-[var(--radius-md)] text-muted-foreground',
          'transition-colors duration-150 ease-in-out',
          'hover:bg-muted hover:text-foreground active:bg-muted/80',
          'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]',
          'disabled:pointer-events-none disabled:opacity-50',
          sizeClass[size],
          className,
        )}
        data-icod-id="src_components_ui_iconbutton_tsx_e994"
        {...rest}>
        <span
          className={iconSizeClass[size]}
          data-icod-id="src_components_ui_iconbutton_tsx_dc6b">{children}</span>
      </button>
    </Tooltip>
  );
});

export default IconButton;
