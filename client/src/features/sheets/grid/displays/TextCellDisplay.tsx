interface TextCellDisplayProps {
  value: string | number | boolean | null;
}

export default function TextCellDisplay({ value }: TextCellDisplayProps) {
  if (value == null || value === '') {
    return (
      <span
        className="text-muted-foreground/40"
        data-icod-id="src_features_sheets_grid_displays_textcelldisplay_tsx_f78b" />
    );
  }
  return (
    <span
      className="truncate"
      data-icod-id="src_features_sheets_grid_displays_textcelldisplay_tsx_bff2">{String(value)}</span>
  );
}
