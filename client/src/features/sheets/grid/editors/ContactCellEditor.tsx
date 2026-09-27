interface ContactCellEditorProps {
  query: string;
  onQueryChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Renders the search input used inside the FloatingCellList header
 * for the contact cell editor.
 */
export default function ContactCellEditor({
  query,
  onQueryChange,
  onKeyDown,
}: ContactCellEditorProps) {
  return (
    <input
      className="h-full w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
      placeholder="Search members..."
      value={query}
      onChange={(e) => onQueryChange(e.target.value)}
      onKeyDown={onKeyDown}
      autoFocus
      data-icod-id="src_features_sheets_grid_gridcell_tsx_2b68" />
  );
}
