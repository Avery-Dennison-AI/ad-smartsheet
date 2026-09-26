import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/utils/cn';

export interface CheckboxProps extends Omit<ComponentPropsWithoutRef<'input'>, 'type'> {
  label?: string;
  helperText?: string;
  error?: string;
  indeterminate?: boolean;
}

/** Checkbox with label, helper text, error, and indeterminate state. */
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, helperText, error, indeterminate, className, id, ...rest },
  ref,
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div
      className={cn('flex flex-col gap-1', className)}
      data-icod-id="src_components_ui_checkbox_tsx_b590">
      <div
        className="flex items-center gap-2"
        data-icod-id="src_components_ui_checkbox_tsx_a4d7">
        <input
          ref={(node) => {
            if (node) {
              node.indeterminate = !!indeterminate;
            }
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          type="checkbox"
          id={inputId}
          className={cn(
            'h-4 w-4 shrink-0 rounded-[var(--radius-sm)] border border-border text-primary',
            'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive',
          )}
          aria-invalid={!!error}
          data-icod-id="src_components_ui_checkbox_tsx_8f3f"
          {...rest} />
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm text-foreground select-none cursor-pointer"
            data-icod-id="src_components_ui_checkbox_tsx_ecc1">
            {label}
          </label>
        )}
      </div>
      {error && <p
        className="text-xs text-destructive"
        data-icod-id="src_components_ui_checkbox_tsx_390b">{error}</p>}
      {!error && helperText && <p
        className="text-xs text-muted-foreground"
        data-icod-id="src_components_ui_checkbox_tsx_2607">{helperText}</p>}
    </div>
  );
});

export default Checkbox;
