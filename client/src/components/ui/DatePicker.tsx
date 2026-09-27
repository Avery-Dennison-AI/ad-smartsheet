import { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { inputClass } from './Input';

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

/** A styled native date input using design tokens. */
const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value, onChange, className, disabled, placeholder }, ref) => {
    return (
      <input
        ref={ref}
        type="date"
        className={cn(inputClass(undefined, 'sm'), className)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        data-icod-id="src_components_ui_datepicker_tsx_3a0c" />
    );
  },
);

DatePicker.displayName = 'DatePicker';

export default DatePicker;
