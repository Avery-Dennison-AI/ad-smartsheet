import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { workspaceColorValue } from '@/utils/workspaceColors';
import type { WorkspaceColor } from '@/types';

export const WORKSPACE_COLORS: readonly WorkspaceColor[] = [
  'teal',
  'blue',
  'green',
  'yellow',
  'red',
  'purple',
  'gray',
] as const;

export interface ColorPickerProps {
  value: WorkspaceColor | string;
  onChange: (color: WorkspaceColor) => void;
  colors?: readonly WorkspaceColor[];
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
        const resolvedColor = workspaceColorValue(color);
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
            style={{ backgroundColor: resolvedColor }}
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
