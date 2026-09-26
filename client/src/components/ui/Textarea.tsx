import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/utils/cn';
import { inputClass } from './Input';

export interface TextareaProps extends ComponentPropsWithoutRef<'textarea'> {
  label?: string;
  helperText?: string;
  error?: string;
}

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
          inputClass('min-h-[80px] resize-y'),
          error && 'border-destructive focus:border-destructive focus:shadow-[0_0_0_2px_#FFFFFF,_0_0_0_4px_var(--color-danger)]',
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
