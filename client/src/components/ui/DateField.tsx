import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import CalendarDatePicker from './CalendarDatePicker';
import { cn } from '@/utils/cn';

interface DateFieldProps {
  value: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/** Format an ISO date string to a human-readable form. */
function formatDateDisplay(value: string | null): string | null {
  if (!value) return null;
  try {
    const d = new Date(value + 'T00:00:00');
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return value;
  }
}

/**
 * Shared date picker field — styled trigger button that opens CalendarDatePicker.
 * Styled to match the Input component appearance.
 */
export default function DateField({
  value,
  onChange,
  disabled = false,
  placeholder = 'Pick a date',
  className,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const formattedDate = formatDateDisplay(value);

  const handleTriggerClick = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen((prev) => !prev);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div
      ref={anchorRef}
      className={cn('relative', className)}
      data-icod-id="src_components_ui_datefield_tsx_root">
      {/* Trigger — styled like Input */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex w-full items-center rounded-[var(--radius-sm)] border border-border bg-card px-3 py-1.5 text-sm transition-colors duration-150 ease-in-out',
          formattedDate ? 'text-foreground' : 'text-muted-foreground',
          'hover:bg-muted',
          open && 'border-primary shadow-[var(--focus-ring)]',
          disabled && 'cursor-not-allowed bg-muted text-muted-foreground',
        )}
        data-icod-id="src_components_ui_datefield_tsx_trigger">
        <span className="min-w-0 flex-1 truncate" data-icod-id="src_components_ui_datefield_tsx_text">
          {formattedDate || placeholder}
        </span>
        {value != null && !disabled && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                handleClear(e as unknown as React.MouseEvent);
              }
            }}
            className="ml-1 shrink-0 rounded p-0.5 hover:bg-muted"
            aria-label="Clear date"
            data-icod-id="src_components_ui_datefield_tsx_clear">
            <X className="h-3 w-3 text-muted-foreground" data-icod-id="src_components_ui_datefield_tsx_clear_icon" />
          </span>
        )}
      </div>

      {/* Calendar popover */}
      {open && (
        <CalendarDatePicker
          value={value}
          onChange={(dateVal) => {
            onChange(dateVal);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
          anchorRef={anchorRef}
          data-icod-id="src_components_ui_datefield_tsx_calendar" />
      )}
    </div>
  );
}
