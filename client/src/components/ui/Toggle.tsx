import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/utils/cn';

export interface ToggleProps extends Omit<ComponentPropsWithoutRef<'input'>, 'type'> {
  label?: string;
}

/** Switch toggle with label and disabled state. */
const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
  { label, className, id, checked, disabled, ...rest },
  ref,
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div
      className={cn('flex items-center gap-3', className)}
      data-icod-id="src_components_ui_toggle_tsx_4704">
      <label
        htmlFor={inputId}
        className="relative inline-flex cursor-pointer items-center"
        data-icod-id="src_components_ui_toggle_tsx_4862">
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          data-icod-id="src_components_ui_toggle_tsx_9b12"
          {...rest} />
        <span
          className={cn(
            'h-5 w-9 rounded-full transition-colors duration-200 ease-in-out',
            'bg-muted peer-checked:bg-primary',
            'peer-focus-visible:shadow-[var(--focus-ring)]',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          )}
          data-icod-id="src_components_ui_toggle_tsx_821d" />
        <span
          className={cn(
            'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-card transition-transform duration-200 ease-in-out',
            'peer-checked:translate-x-4',
          )}
          data-icod-id="src_components_ui_toggle_tsx_6bcb" />
      </label>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm text-foreground select-none cursor-pointer"
          data-icod-id="src_components_ui_toggle_tsx_0a5a">
          {label}
        </label>
      )}
    </div>
  );
});

export default Toggle;
