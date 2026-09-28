import { ChevronDown } from 'lucide-react';
import { Pill } from '@/components/ui';
import type { DropdownOption } from '@/types';

interface DropdownCellDisplayProps {
  value: string | number | boolean | null;
  options?: DropdownOption[];
  readOnly?: boolean;
}

export default function DropdownCellDisplay({ value, options, readOnly }: DropdownCellDisplayProps) {
  if (value == null || value === '') {
    return (
      <span
        className="text-muted-foreground/40"
        data-icod-id="src_features_sheets_grid_displays_dropdowncelldisplay_tsx_7078" />
    );
  }

  const opt = options?.find((o) => o.label === String(value));
  if (opt) {
    return (
      <>
        <Pill
          label={opt.label}
          color={opt.color}
          data-icod-id="src_features_sheets_grid_displays_dropdowncelldisplay_tsx_0624" />
        {!readOnly && (
          <ChevronDown
            className="ml-auto h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            data-icod-id="src_features_sheets_grid_displays_dropdowncelldisplay_tsx_508d" />
        )}
      </>
    );
  }

  return (
    <span
      className="truncate"
      data-icod-id="src_features_sheets_grid_displays_dropdowncelldisplay_tsx_78c2">{String(value)}</span>
  );
}
