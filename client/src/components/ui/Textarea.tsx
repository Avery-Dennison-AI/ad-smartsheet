import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/utils/cn';
import { inputClass, type InputSize } from './Input';

export interface TextareaProps extends Omit<ComponentPropsWithoutRef<'textarea'>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  /** Size variant. Default 'md'. */
  size?: InputSize;
}

/** Auto-resizable textarea with the same prop API as Input. */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, helperText, error, className, id, size = 'md', ...rest },
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
          inputClass('min-h-[80px] resize-y', size),
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
