import { ChevronRight, ChevronDown } from 'lucide-react';

interface RowExpandButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function RowExpandButton({ isCollapsed, onToggle }: RowExpandButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex h-3 w-3 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      data-icod-id="src_features_sheets_grid_rowexpandbutton_tsx_root">
      {isCollapsed ? (
        <ChevronRight
          className="h-3 w-3"
          data-icod-id="src_features_sheets_grid_rowexpandbutton_tsx_right" />
      ) : (
        <ChevronDown
          className="h-3 w-3"
          data-icod-id="src_features_sheets_grid_rowexpandbutton_tsx_down" />
      )}
    </button>
  );
}
