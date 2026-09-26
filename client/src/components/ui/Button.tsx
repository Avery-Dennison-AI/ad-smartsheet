import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import Spinner from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 ease-in-out ' +
  'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] ' +
  'disabled:pointer-events-none disabled:opacity-50';

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-pressed)]',
  secondary:
    'border border-border bg-transparent text-foreground hover:bg-muted active:bg-muted/80',
  ghost:
    'text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80',
  danger:
    'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-xs rounded-[var(--radius-sm)]',
  md: 'h-8 px-4 text-sm rounded-[var(--radius-md)]',
  lg: 'h-10 px-5 text-sm rounded-[var(--radius-md)]',
};

/**
 * The Button look as a class string — for an element that must stay an <a> or
 * a react-router <Link>.
 */
export function buttonClass(
  opts: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {},
): string {
  const { variant = 'primary', size = 'md', className } = opts;
  return cn(base, variantClass[variant], sizeClass[size], className);
}

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon rendered before children. */
  leftIcon?: ReactNode;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
}

/** Every clickable action in the app. */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', leftIcon, loading = false, disabled, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={buttonClass({ variant, size, className })}
      disabled={disabled || loading}
      data-icod-id="src_components_ui_button_tsx_40b3"
      {...rest}>
      {loading && <Spinner
        size="sm"
        className="border-current border-t-transparent"
        data-icod-id="src_components_ui_button_tsx_8bb5" />}
      {!loading && leftIcon && <span className="shrink-0" data-icod-id="src_components_ui_button_tsx_6751">{leftIcon}</span>}
      {children}
    </button>
  );
});

export default Button;
