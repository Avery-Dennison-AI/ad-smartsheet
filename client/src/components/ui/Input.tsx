import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/utils/cn';

/**
 * The form-control look as a class string. Use it directly on <textarea> and
 * <select>; use <Input> for <input>.
 */
export function inputClass(className?: string): string {
  return cn(
    'w-full rounded-[var(--radius-sm)] border border-border bg-card px-3 py-2 text-sm text-foreground',
    'placeholder:text-muted-foreground/70 transition-colors duration-150 ease-in-out',
    'focus:border-primary focus:outline-none focus:shadow-[var(--focus-ring)]',
    'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground',
    className,
  );
}

export interface InputProps extends ComponentPropsWithoutRef<'input'> {
  /** Label rendered above the input. */
  label?: string;
  /** Helper text below the input (hidden when error is present). */
  helperText?: string;
  /** Error message — switches to error styling. */
  error?: string;
}

/** Text input with optional label, helper text, and error state. */
const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helperText, error, className, id, ...rest },
  ref,
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div
      className="flex flex-col gap-1.5"
      data-icod-id="src_components_ui_input_tsx_3df0">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-foreground"
          data-icod-id="src_components_ui_input_tsx_923c">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          inputClass(),
          error && 'border-destructive focus:border-destructive focus:shadow-[0_0_0_2px_#FFFFFF,_0_0_0_4px_var(--color-danger)]',
          className,
        )}
        aria-invalid={!!error}
        data-icod-id="src_components_ui_input_tsx_3a37"
        {...rest} />
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
