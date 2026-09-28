import { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectCellFormatting, selectColumnFormatting } from '@/store/slices/gridSlice';
import type { CellFormatting } from '@/types';

interface UseCellFormattingResult {
  /** Merged formatting (column base + cell override). */
  fmt: CellFormatting;
  /** Inline CSS properties derived from the merged formatting. */
  formattingStyle: React.CSSProperties;
}

/**
 * Reads cell-level and column-level formatting from the Redux store,
 * merges them (column = base, cell = override), and returns the merged
 * object plus a ready-to-apply inline style.
 */
export function useCellFormatting(
  rowId: string | undefined,
  columnId: string,
  columnType: string,
): UseCellFormattingResult {
  const cellFmt = useAppSelector((state) =>
    rowId ? selectCellFormatting(state, rowId, columnId) : {},
  );
  const colFmt = useAppSelector((state) =>
    selectColumnFormatting(state, columnId),
  );

  const fmt = useMemo(() => {
    if (!colFmt || Object.keys(colFmt).length === 0) return cellFmt;
    if (!cellFmt || Object.keys(cellFmt).length === 0) return colFmt;
    return { ...colFmt, ...cellFmt };
  }, [colFmt, cellFmt]);

  const formattingStyle = useMemo((): React.CSSProperties => {
    const effectiveTextAlign = fmt.textAlign ?? (columnType === 'number' ? 'right' : undefined);
    const isWrappable = columnType === 'text' || columnType === 'number';
    const shouldWrap = isWrappable && !!fmt.wrapText;

    return {
      fontFamily: fmt.fontFamily && fmt.fontFamily !== 'default' ? fmt.fontFamily : undefined,
      fontSize: fmt.fontSize ? `${fmt.fontSize}px` : undefined,
      fontWeight: fmt.bold ? 'bold' : undefined,
      fontStyle: fmt.italic ? 'italic' : undefined,
      textDecoration:
        [fmt.underline && 'underline', fmt.strikethrough && 'line-through']
          .filter(Boolean)
          .join(' ') || undefined,
      color: fmt.textColor ?? undefined,
      justifyContent:
        effectiveTextAlign === 'right'
          ? 'flex-end'
          : effectiveTextAlign === 'center'
            ? 'center'
            : 'flex-start',
      alignItems:
        fmt.verticalAlign === 'top'
          ? 'flex-start'
          : fmt.verticalAlign === 'bottom'
            ? 'flex-end'
            : 'center',
      textAlign: effectiveTextAlign ?? undefined,
      whiteSpace: shouldWrap ? 'pre-wrap' : 'nowrap',
      wordBreak: shouldWrap ? 'break-word' : undefined,
      overflow: shouldWrap ? undefined : 'hidden',
      textOverflow: shouldWrap ? undefined : 'ellipsis',
    };
  }, [fmt, columnType]);

  return { fmt, formattingStyle };
}
