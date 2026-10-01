import RowExpandButton from '../RowExpandButton';

interface TextCellDisplayProps {
  value: string | number | boolean | null;
  /** Hierarchy props for primary column */
  isPrimary?: boolean;
  depth?: number;
  hasChildren?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function TextCellDisplay({
  value,
  isPrimary,
  depth = 0,
  hasChildren = false,
  isCollapsed = false,
  onToggleCollapse,
}: TextCellDisplayProps) {
  const indentPx = isPrimary && depth > 0 ? depth * 20 : 0;

  return (
    <span
      className="flex w-full items-center gap-1 truncate"
      style={indentPx > 0 ? { paddingLeft: indentPx } : undefined}
      data-icod-id="src_features_sheets_grid_displays_textcelldisplay_tsx_container">
      {isPrimary && hasChildren && onToggleCollapse && (
        <RowExpandButton
          isCollapsed={isCollapsed}
          onToggle={onToggleCollapse}
          data-icod-id="src_features_sheets_grid_displays_textcelldisplay_tsx_aec2" />
      )}
      {value == null || value === '' ? (
        <span
          className="text-muted-foreground/40"
          data-icod-id="src_features_sheets_grid_displays_textcelldisplay_tsx_f78b" />
      ) : (
        <span
          className={`truncate ${isPrimary && hasChildren ? 'font-medium' : ''}`}
          data-icod-id="src_features_sheets_grid_displays_textcelldisplay_tsx_bff2">{String(value)}</span>
      )}
    </span>
  );
}
