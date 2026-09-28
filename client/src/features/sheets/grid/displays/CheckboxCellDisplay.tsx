import { Check } from 'lucide-react';

interface CheckboxCellDisplayProps {
  value: string | number | boolean | null;
}

export default function CheckboxCellDisplay({ value }: CheckboxCellDisplayProps) {
  return value ? (
    <Check
      className="h-4 w-4 text-primary"
      data-icod-id="src_features_sheets_grid_displays_checkboxcelldisplay_tsx_c33a" />
  ) : (
    <div
      className="h-3.5 w-3.5 rounded border border-border"
      data-icod-id="src_features_sheets_grid_displays_checkboxcelldisplay_tsx_cbb3" />
  );
}
