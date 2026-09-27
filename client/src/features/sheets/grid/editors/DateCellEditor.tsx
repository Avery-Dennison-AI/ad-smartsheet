import { type RefObject } from 'react';
import CalendarDatePicker from '@/components/ui/CalendarDatePicker';

interface DateCellEditorProps {
  cellRef: RefObject<HTMLElement | null>;
  editValue: string;
  displayValue: string | number | boolean | null;
  onChange: (dateVal: string | null) => void;
  onClose: () => void;
}

export default function DateCellEditor({
  cellRef,
  editValue,
  displayValue,
  onChange,
  onClose,
}: DateCellEditorProps) {
  return (
    <div
      className="relative h-full w-full"
      data-icod-id="src_features_sheets_grid_gridcell_tsx_0a57">
      {/* Static text showing current value while calendar is open */}
      <span
        className="flex h-full items-center truncate px-1 text-sm text-muted-foreground/60"
        data-icod-id="src_features_sheets_grid_gridcell_tsx_date.static">
        {displayValue != null ? (() => {
          try {
            const d = new Date(String(displayValue));
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          } catch {
            return String(displayValue);
          }
        })() : ''}
      </span>
      <CalendarDatePicker
        value={editValue || null}
        onChange={onChange}
        onClose={onClose}
        anchorRef={cellRef}
        data-icod-id="src_features_sheets_grid_gridcell_tsx_4f2c" />
    </div>
  );
}
