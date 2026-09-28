import { Eraser } from 'lucide-react';
import { IconButton } from '@/components/ui';
import type { CellFormatting } from '@/types';

interface ClearFormattingButtonProps {
  onClear: () => void;
}

export default function ClearFormattingButton({ onClear }: ClearFormattingButtonProps) {
  return (
    <IconButton
      size="sm"
      tooltip="Clear formatting"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClear}
      data-icod-id="src_features_sheets_grid_toolbar_clearformattingbutton_tsx_d461">
      <Eraser
        className="h-3.5 w-3.5"
        data-icod-id="src_features_sheets_grid_toolbar_clearformattingbutton_tsx_f429" />
    </IconButton>
  );
}
