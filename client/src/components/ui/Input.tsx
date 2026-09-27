import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type InputSize = 'sm' | 'md';

const sizeStyles: Record<InputSize, string> = {
  sm: 'h-7 text-xs px-2',
  md: 'h-8 text-sm px-3',
};

const iconPaddingClass: Record<InputSize, string> = {
  sm: 'pl-8',
  md: 'pl-8',
};

const rightIconPaddingClass: Record<InputSize, string> = {
  sm: 'pr-8',
  md: 'pr-8',
};

/**
 * The form-control look as a class string. Use it directly on <textarea> and
 * <select>; use <Input> for <input>.
 */
export function inputClass(className?: string, size: InputSize = 'md'): string {
  return cn(
    'w-full rounded-[var(--radius-sm)] border border-border bg-card text-foreground leading-tight',
    'placeholder:text-muted-foreground/70 transition-colors duration-150 ease-in-out',
    'focus:border-primary focus:outline-none focus:shadow-[var(--focus-ring)]',
    'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground',
    sizeStyles[size],
    className,
  );
}

export interface InputProps extends Omit<ComponentPropsWithoutRef<'input'>, 'size'> {
  /** Label rendered above the input. */
  label?: string;
  /** Helper text below the input (hidden when error is present). */
  helperText?: string;
  /** Error message — switches to error styling. */
  error?: string;
  /** Icon rendered inside the input on the left side. */
  leftIcon?: ReactNode;
  /** Icon rendered inside the input on the right side. */
  rightIcon?: ReactNode;
  /** Size variant. Default 'md'. */
  size?: InputSize;
  /** Extra classes applied to the outermost wrapper div. */
  containerClassName?: string;
}

/** Text input with optional label, helper text, and error state. */
const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helperText, error, className, id, leftIcon, rightIcon, size = 'md', containerClassName, ...rest },
  ref,
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div
      className={cn('flex flex-col gap-1.5', containerClassName)}
      data-icod-id="src_components_ui_input_tsx_3df0">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-foreground"
          data-icod-id="src_components_ui_input_tsx_923c">
          {label}
        </label>
      )}
      <div className="relative" data-icod-id="src_components_ui_input_tsx_wrapper">
        {leftIcon && (
          <span
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-gray-400)] pointer-events-none"
            data-icod-id="src_components_ui_input_tsx_icon">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            inputClass(undefined, size),
            leftIcon && iconPaddingClass[size],
            rightIcon && rightIconPaddingClass[size],
            error && 'border-destructive focus:border-destructive focus:shadow-[var(--focus-ring-danger)]',
            className,
          )}
          aria-invalid={!!error}
          data-icod-id="src_components_ui_input_tsx_3a37"
          {...rest} />
        {rightIcon && (
          <span
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-gray-400)]"
            data-icod-id="src_components_ui_input_tsx_right_icon">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p
        className="text-xs text-destructive"
        data-icod-id="src_components_ui_input_tsx_7c5a">{error}</p>}
      {!error && helperText && <p
        className="text-xs text-muted-foreground"
        data-icod-id="src_components_ui_input_tsx_2ae3">{helperText}</p>}
    </div>
  );
});

export default Input;
