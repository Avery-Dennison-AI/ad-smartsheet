interface DropdownCellEditorProps {
  search: string;
  onSearchChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Renders the filter/search input used inside the FloatingCellList header
 * for the dropdown cell editor.
 */
export default function DropdownCellEditor({
  search,
  onSearchChange,
  onKeyDown,
}: DropdownCellEditorProps) {
  return (
    <input
      className="h-full w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
      placeholder="Filter options..."
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
      onKeyDown={onKeyDown}
      autoFocus
      data-icod-id="src_features_sheets_grid_gridcell_tsx_5f71" />
  );
}
