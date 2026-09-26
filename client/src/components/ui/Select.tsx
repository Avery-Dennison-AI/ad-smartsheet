import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { inputClass } from './Input';

export interface SelectProps extends ComponentPropsWithoutRef<'select'> {
  label?: string;
  helperText?: string;
  error?: string;
}

/** Native select styled to match Input. */
const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, helperText, error, className, id, children, ...rest },
  ref,
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div
      className="flex flex-col gap-1.5"
      data-icod-id="src_components_ui_select_tsx_c0ee">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-foreground"
          data-icod-id="src_components_ui_select_tsx_1d55">
          {label}
        </label>
      )}
      <div className="relative" data-icod-id="src_components_ui_select_tsx_5e1a">
        <select
          ref={ref}
          id={inputId}
          className={cn(
            inputClass('appearance-none pr-8'),
            error && 'border-destructive focus:border-destructive focus:shadow-[0_0_0_2px_#FFFFFF,_0_0_0_4px_var(--color-danger)]',
            className,
          )}
          aria-invalid={!!error}
          data-icod-id="src_components_ui_select_tsx_b6c3"
          {...rest}>
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          data-icod-id="src_components_ui_select_tsx_29f8" />
      </div>
      {error && <p
        className="text-xs text-destructive"
        data-icod-id="src_components_ui_select_tsx_31f7">{error}</p>}
      {!error && helperText && <p
        className="text-xs text-muted-foreground"
        data-icod-id="src_components_ui_select_tsx_db09">{helperText}</p>}
    </div>
  );
});

export default Select;
