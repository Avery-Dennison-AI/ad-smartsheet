interface NumberCellDisplayProps {
  value: string | number | boolean | null;
}

export default function NumberCellDisplay({ value }: NumberCellDisplayProps) {
  if (value == null || value === '') {
    return (
      <span
        className="text-muted-foreground/40"
        data-icod-id="src_features_sheets_grid_displays_numbercelldisplay_tsx_fec4" />
    );
  }
  return (
    <span
      className="truncate text-right w-full block"
      data-icod-id="src_features_sheets_grid_displays_numbercelldisplay_tsx_33e2">{String(value)}</span>
  );
}
