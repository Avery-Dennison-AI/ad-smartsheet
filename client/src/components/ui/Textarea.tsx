import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/utils/cn';

export interface TextareaProps extends Omit<ComponentPropsWithoutRef<'textarea'>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
}

/** Base form-control tokens shared between Input and Textarea (border, ring, colour). */
const textareaBaseClass = cn(
  'w-full rounded-[var(--radius-sm)] border border-border bg-card text-foreground leading-normal',
  'placeholder:text-muted-foreground/70 transition-colors duration-150 ease-in-out',
  'focus:border-primary focus:outline-none focus:shadow-[var(--focus-ring)]',
  'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground',
);

/** Auto-resizable textarea with the same prop API as Input. */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, helperText, error, className, id, ...rest },
  ref,
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div
      className="flex flex-col gap-1.5"
      data-icod-id="src_components_ui_textarea_tsx_eae4">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-foreground"
          data-icod-id="src_components_ui_textarea_tsx_0dd1">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          textareaBaseClass,
          'py-2 px-3 text-sm',
          error && 'border-destructive focus:border-destructive focus:shadow-[var(--focus-ring-danger)]',
          className,
        )}
        aria-invalid={!!error}
        data-icod-id="src_components_ui_textarea_tsx_b7b7"
        {...rest} />
      {error && <p
        className="text-xs text-destructive"
        data-icod-id="src_components_ui_textarea_tsx_39e1">{error}</p>}
      {!error && helperText && <p
        className="text-xs text-muted-foreground"
        data-icod-id="src_components_ui_textarea_tsx_6c3b">{helperText}</p>}
    </div>
  );
});

export default Textarea;
