import { type CSSProperties, type RefObject } from 'react';

interface TextCellEditorProps {
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onBlur: () => void;
  formattingStyle: CSSProperties;
  textColor?: string;
  fillColor?: string;
}

export default function TextCellEditor({
  inputRef,
  value,
  onChange,
  onKeyDown,
  onBlur,
  formattingStyle,
  textColor,
  fillColor,
}: TextCellEditorProps) {
  return (
    <input
      ref={inputRef as React.Ref<HTMLInputElement>}
      className="h-full w-full bg-transparent px-1 text-sm outline-none"
      style={{ ...formattingStyle, color: textColor ?? undefined, backgroundColor: fillColor ? 'transparent' : undefined }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      data-icod-id="src_features_sheets_grid_gridcell_tsx_c428" />
  );
}
