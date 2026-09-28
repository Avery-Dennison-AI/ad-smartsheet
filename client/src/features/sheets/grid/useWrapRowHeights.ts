import { useMemo } from 'react';
import type { Column, GridRow, CellFormatting } from '@/types';
import { DEFAULT_ROW_HEIGHT } from './gridHelpers';

const CELL_PADDING_X = 16; // 8px left + 8px right
const CELL_PADDING_Y = 8;   // 4px top + 4px bottom
const MAX_ROW_HEIGHT = 400;
const DEFAULT_LINE_HEIGHT_FACTOR = 1.5;
const DEFAULT_FONT_SIZE = 14; // --text-base in theme.css

interface UseWrapRowHeightsOptions {
  rows: GridRow[];
  columns: Column[];
  liveColWidths: Record<string, number>;
}

/**
 * Estimates the effective row height needed when wrapText is enabled.
 * Uses canvas-based text measurement for efficiency.
 */
export function useWrapRowHeights({
  rows,
  columns,
  liveColWidths,
}: UseWrapRowHeightsOptions): Record<string, number> {
  return useMemo(() => {
    const result: Record<string, number> = {};

    // Create a canvas context for text measurement (reused across all cells)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return result;

    for (const row of rows) {
      let maxH = DEFAULT_ROW_HEIGHT;

      for (const col of columns) {
        const colType = col.type;
        if (colType !== 'text' && colType !== 'number') continue;

        // Get effective formatting (column base + cell override)
        const colFmt = col.formatting ?? {};
        const cellFmt = row.formatting?.[col.id] ?? {};
        const effective: CellFormatting = { ...colFmt, ...cellFmt };

        if (!effective.wrapText) continue;

        const value = row.cells[col.id];
        if (value == null || String(value).trim() === '') continue;

        const text = String(value);
        const colWidth = liveColWidths[col.id] ?? (col.width ?? 160);
        const availableWidth = Math.max(20, colWidth - CELL_PADDING_X);

        // Determine font properties
        const fontSize = effective.fontSize ?? DEFAULT_FONT_SIZE;
        const fontWeight = effective.bold ? 'bold' : 'normal';
        const fontStyle = effective.italic ? 'italic' : 'normal';
        const fontFamily = effective.fontFamily && effective.fontFamily !== 'default'
          ? effective.fontFamily
          : "'Inter', system-ui, sans-serif";

        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        const lineHeight = fontSize * DEFAULT_LINE_HEIGHT_FACTOR;

        // Count lines from explicit newlines and wrapping
        const explicitLines = text.split('\n');
        let totalLines = 0;

        for (const line of explicitLines) {
          if (line === '') {
            totalLines += 1;
            continue;
          }
          const lineWidth = ctx.measureText(line).width;
          if (lineWidth <= availableWidth) {
            totalLines += 1;
          } else {
            // Estimate word-wrap line count
            totalLines += Math.ceil(lineWidth / availableWidth);
          }
        }

        const estimatedHeight = totalLines * lineHeight + CELL_PADDING_Y;
        if (estimatedHeight > maxH) {
          maxH = Math.min(estimatedHeight, MAX_ROW_HEIGHT);
        }
      }

      // Only store if taller than default
      if (maxH > DEFAULT_ROW_HEIGHT) {
        // Also respect any manually-set row height
        const storedHeight = row.height ?? DEFAULT_ROW_HEIGHT;
        result[row.id] = Math.max(storedHeight, maxH);
      }
    }

    return result;
  }, [rows, columns, liveColWidths]);
}
