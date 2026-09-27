import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface CalendarDatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const parts = value.split('-');
  if (parts.length !== 3) return null;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (isNaN(d.getTime())) return null;
  return d;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function CalendarDatePicker({
  value,
  onChange,
  onClose,
  anchorRef,
}: CalendarDatePickerProps) {
  const selectedDate = parseDate(value);
  const todayStr = toISODate(new Date());

  const [viewYear, setViewYear] = useState(selectedDate ? selectedDate.getFullYear() : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate ? selectedDate.getMonth() : new Date().getMonth());
  const [focusedDay, setFocusedDay] = useState<number>(selectedDate ? selectedDate.getDate() : new Date().getDate());

  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; placement: 'below' | 'above' } | null>(null);

  // Compute position
  useLayoutEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const gap = 4;
    const panelHeight = 310; // approximate calendar height

    let placement: 'below' | 'above' = 'below';
    let top = rect.bottom + gap;

    if (top + panelHeight > window.innerHeight && rect.top - gap - panelHeight >= 0) {
      placement = 'above';
      top = rect.top - gap;
    }

    setPos({ top, left: rect.left, placement });
  }, [anchorRef]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        if (anchorRef.current && anchorRef.current.contains(target)) return;
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, anchorRef]);

  // Focus the panel for keyboard navigation
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  const handlePrevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  const handleNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  const handleSelectDay = useCallback((day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    onChange(toISODate(d));
    onClose();
  }, [viewYear, viewMonth, onChange, onClose]);

  const handleToday = useCallback(() => {
    const now = new Date();
    onChange(toISODate(now));
    onClose();
  }, [onChange, onClose]);

  const handleClear = useCallback(() => {
    onChange(null);
    onClose();
  }, [onChange, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);

    switch (e.key) {
      case 'ArrowLeft': {
        e.preventDefault();
        e.stopPropagation();
        if (focusedDay > 1) {
          setFocusedDay(focusedDay - 1);
        } else {
          // Move to previous month's last day
          handlePrevMonth();
          const prevMonthDays = getDaysInMonth(
            viewMonth === 0 ? viewYear - 1 : viewYear,
            viewMonth === 0 ? 11 : viewMonth - 1,
          );
          setFocusedDay(prevMonthDays);
        }
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        e.stopPropagation();
        if (focusedDay < daysInMonth) {
          setFocusedDay(focusedDay + 1);
        } else {
          handleNextMonth();
          setFocusedDay(1);
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        e.stopPropagation();
        if (focusedDay > 7) {
          setFocusedDay(focusedDay - 7);
        } else {
          handlePrevMonth();
          const prevMonthDays = getDaysInMonth(
            viewMonth === 0 ? viewYear - 1 : viewYear,
            viewMonth === 0 ? 11 : viewMonth - 1,
          );
          setFocusedDay(prevMonthDays - (7 - focusedDay));
        }
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        e.stopPropagation();
        if (focusedDay + 7 <= daysInMonth) {
          setFocusedDay(focusedDay + 7);
        } else {
          handleNextMonth();
          setFocusedDay(focusedDay + 7 - daysInMonth);
        }
        break;
      }
      case 'Enter': {
        e.preventDefault();
        e.stopPropagation();
        handleSelectDay(focusedDay);
        break;
      }
      case 'Escape': {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        break;
      }
    }
  }, [focusedDay, viewYear, viewMonth, handlePrevMonth, handleNextMonth, handleSelectDay, onClose]);

  // Build calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const days: Array<number | null> = [];

  // Padding before first day
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  if (!pos) return null;

  const isSelected = (day: number) =>
    selectedDate &&
    selectedDate.getFullYear() === viewYear &&
    selectedDate.getMonth() === viewMonth &&
    selectedDate.getDate() === day;

  const isToday = (day: number) => {
    const now = new Date();
    return now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === day;
  };

  const portalContent = (
    <div
      ref={panelRef}
      className="fixed w-[260px] rounded-md border border-border bg-card shadow-lg"
      style={{
        zIndex: 'var(--z-dropdown)',
        top: pos.placement === 'below' ? pos.top : undefined,
        bottom: pos.placement === 'above' ? window.innerHeight - pos.top : undefined,
        left: pos.left,
      }}
      onKeyDown={handleKeyDown}
      onMouseDown={(e) => e.preventDefault()}
      tabIndex={-1}
      data-calendar-picker="true"
      data-icod-id="src_components_ui_calendardatepicker_tsx_6bcc">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        data-icod-id="src_components_ui_calendardatepicker_tsx_a44f">
        <button
          type="button"
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={handlePrevMonth}
          aria-label="Previous month"
          data-icod-id="src_components_ui_calendardatepicker_tsx_9790">
          <ChevronLeft
            className="h-4 w-4"
            data-icod-id="src_components_ui_calendardatepicker_tsx_565c" />
        </button>
        <span
          className="text-sm font-medium text-foreground"
          data-icod-id="src_components_ui_calendardatepicker_tsx_20fd">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={handleNextMonth}
          aria-label="Next month"
          data-icod-id="src_components_ui_calendardatepicker_tsx_198c">
          <ChevronRight
            className="h-4 w-4"
            data-icod-id="src_components_ui_calendardatepicker_tsx_0df5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div
        className="grid grid-cols-7 px-2 pb-1"
        data-icod-id="src_components_ui_calendardatepicker_tsx_45ee">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="py-1 text-center text-[10px] font-medium text-muted-foreground"
            data-icod-id={`src_components_ui_calendardatepicker_tsx_363e_${wd}`}>
            {wd}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div
        className="grid grid-cols-7 px-2 pb-2"
        data-icod-id="src_components_ui_calendardatepicker_tsx_18a5">
        {days.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                data-icod-id={`src_components_ui_calendardatepicker_tsx_46fb_${day}`} />
            );
          }
          const sel = isSelected(day);
          const today = isToday(day);
          const focused = focusedDay === day;

          return (
            <button
              key={day}
              type="button"
              className={cn(
                'flex h-8 w-full items-center justify-center rounded text-xs transition-colors',
                sel && 'bg-primary text-primary-foreground',
                !sel && today && 'ring-1 ring-inset ring-primary/50',
                !sel && !today && 'text-foreground hover:bg-muted',
                focused && !sel && 'ring-2 ring-inset ring-ring',
              )}
              onClick={() => handleSelectDay(day)}
              onMouseEnter={() => setFocusedDay(day)}
              data-icod-id={`src_components_ui_calendardatepicker_tsx_d073_${day}`}>
              {day}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between border-t border-border px-3 py-2"
        data-icod-id="src_components_ui_calendardatepicker_tsx_f2cf">
        <button
          type="button"
          className="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-muted"
          onClick={handleToday}
          data-icod-id="src_components_ui_calendardatepicker_tsx_9e2c">
          Today
        </button>
        <button
          type="button"
          className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={handleClear}
          data-icod-id="src_components_ui_calendardatepicker_tsx_3045">
          Clear
        </button>
      </div>
    </div>
  );

  return ReactDOM.createPortal(portalContent, document.body);
}
