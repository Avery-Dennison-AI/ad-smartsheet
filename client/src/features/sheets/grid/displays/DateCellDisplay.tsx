interface DateCellDisplayProps {
  value: string | number | boolean | null;
}

export default function DateCellDisplay({ value }: DateCellDisplayProps) {
  if (value == null || value === '') {
    return (
      <span
        className="text-muted-foreground/40"
        data-icod-id="src_features_sheets_grid_displays_datecelldisplay_tsx_a9c7" />
    );
  }
  try {
    const d = new Date(String(value));
    return (
      <span
        className="truncate"
        data-icod-id="src_features_sheets_grid_displays_datecelldisplay_tsx_783e">
        {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
    );
  } catch {
    return (
      <span
        className="truncate"
        data-icod-id="src_features_sheets_grid_displays_datecelldisplay_tsx_c976">{String(value)}</span>
    );
  }
}
