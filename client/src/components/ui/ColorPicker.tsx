import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export const WORKSPACE_COLORS = [
  '#0ea5e9',
  '#8b5cf6',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#f97316',
  '#ec4899',
] as const;

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  colors?: readonly string[];
  className?: string;
}

/** Inline row of color swatches for workspace color selection. */
export default function ColorPicker({
  value,
  onChange,
  colors = WORKSPACE_COLORS,
  className,
}: ColorPickerProps) {
  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="radiogroup"
      aria-label="Color picker"
      data-icod-id="src_components_ui_colorpicker_tsx_4c77">
      {colors.map((color) => {
        const selected = value === color;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`Color ${color}`}
            onClick={() => onChange(color)}
            className={cn(
              'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              selected && 'ring-2 ring-ring ring-offset-2',
            )}
            style={{ backgroundColor: color }}
            data-icod-id={`src_components_ui_colorpicker_tsx_494e_${color}`}>
            {selected && <Check
              className="h-4 w-4 text-white drop-shadow-sm"
              data-icod-id={`src_components_ui_colorpicker_tsx_bd1a_${color}`} />}
          </button>
        );
      })}
    </div>
  );
}
