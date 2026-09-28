import { type CSSProperties, type RefObject, useRef, useCallback, useEffect } from 'react';

interface NumberCellEditorProps {
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onBlur: () => void;
  formattingStyle: CSSProperties;
  textColor?: string;
  fillColor?: string;
  wrapText?: boolean;
}

export default function NumberCellEditor({
  inputRef,
  value,
  onChange,
  onKeyDown,
  onBlur,
  formattingStyle,
  textColor,
  fillColor,
  wrapText = false,
}: NumberCellEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea when value changes
  useEffect(() => {
    if (wrapText && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, wrapText]);

  // Focus the textarea on mount when wrapping
  useEffect(() => {
    if (wrapText && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [wrapText]);

  const handleTextareaKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.altKey) {
      e.preventDefault();
      onBlur();
    } else if (e.key === 'Enter' && e.altKey) {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newValue = value.substring(0, start) + '\n' + value.substring(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        if (ta) {
          ta.selectionStart = ta.selectionEnd = start + 1;
        }
      });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onBlur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onKeyDown(e);
    }
  }, [value, onChange, onBlur, onKeyDown]);

  if (wrapText) {
    return (
      <textarea
        ref={textareaRef}
        className="w-full resize-none bg-transparent px-1 text-right text-sm outline-none"
        style={{ ...formattingStyle, color: textColor ?? undefined, backgroundColor: fillColor ? 'transparent' : undefined, minHeight: '100%' }}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleTextareaKeyDown}
        onBlur={onBlur}
        data-icod-id="src_features_sheets_grid_editors_numbercelleditor_tsx_96b4" />
    );
  }

  return (
    <input
      ref={inputRef as React.Ref<HTMLInputElement>}
      type="number"
      className="h-full w-full bg-transparent px-1 text-right text-sm outline-none"
      style={{ ...formattingStyle, color: textColor ?? undefined, backgroundColor: fillColor ? 'transparent' : undefined }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      data-icod-id="src_features_sheets_grid_gridcell_tsx_a5a7" />
  );
}
