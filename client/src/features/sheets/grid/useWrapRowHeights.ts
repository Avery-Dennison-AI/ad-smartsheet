import { useRef, useLayoutEffect, useState } from 'react';
import type { Column, GridRow, CellFormatting } from '@/types';
import { DEFAULT_ROW_HEIGHT, getColWidth } from './gridHelpers';

const CELL_PADDING_X = 16; // 8px left + 8px right
const CELL_PADDING_Y = 8;   // 4px top + 4px bottom
const MAX_ROW_HEIGHT = 400;
const LINE_HEIGHT_FACTOR = 1.5;
const DEFAULT_FONT_SIZE = 13;

// ─── Cache entry fingerprint ──────────────────────────────────────────────

interface CacheEntry {
  value: string;
  bold: boolean;
  italic: boolean;
  fontSize: number;
  fontFamily: string;
  wrapText: boolean;
  colWidth: number;
  lines: number;
}

// ─── Canvas singleton ────────────────────────────────────────────────────

let sharedCanvas: CanvasRenderingContext2D | null = null;

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (sharedCanvas) return sharedCanvas;
  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      const offscreen = new OffscreenCanvas(0, 0);
      sharedCanvas = offscreen.getContext('2d') as CanvasRenderingContext2D | null;
    }
  } catch {
    // OffscreenCanvas unavailable — fall through to document.createElement
  }
  if (!sharedCanvas && typeof document !== 'undefined') {
    const el = document.createElement('canvas');
    sharedCanvas = el.getContext('2d');
  }
  return sharedCanvas;
}

// ─── Word-wrap line counting ─────────────────────────────────────────────

function measureWrappedLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  availableWidth: number,
): number {
  // Split on explicit newlines first — each segment starts a new line
  const segments = text.split('\n');
  let totalLines = 0;

  for (const segment of segments) {
    if (segment === '') {
      totalLines += 1;
      continue;
    }

    const words = segment.split(' ');
    let lines = 1;
    let currentLineWidth = 0;
    const spaceWidth = ctx.measureText(' ').width;

    for (const word of words) {
      const wordWidth = ctx.measureText(word).width;

      if (wordWidth >= availableWidth) {
        // Word is wider than the column — break it character by character
        if (currentLineWidth > 0) {
          lines++;
          currentLineWidth = 0;
        }
        for (let i = 0; i < word.length; i++) {
          const charWidth = ctx.measureText(word[i]).width;
          if (currentLineWidth + charWidth > availableWidth) {
            lines++;
            currentLineWidth = 0;
          }
          currentLineWidth += charWidth;
        }
      } else if (currentLineWidth === 0) {
        currentLineWidth = wordWidth;
      } else if (currentLineWidth + spaceWidth + wordWidth <= availableWidth) {
        currentLineWidth += spaceWidth + wordWidth;
      } else {
        lines++;
        currentLineWidth = wordWidth;
      }
    }

    totalLines += lines;
  }

  return totalLines;
}

// ─── Hook interface ──────────────────────────────────────────────────────

interface UseWrapRowHeightsOptions {
  rows: GridRow[];
  columns: Column[];
  liveColWidths: Record<string, number>;
}

/**
 * Computes effective row heights for wrapped-text cells using accurate
 * word-wrap simulation and a per-cell measurement cache that avoids
 * redundant canvas calls when only one cell changes.
 */
export function useWrapRowHeights({
  rows,
  columns,
  liveColWidths,
}: UseWrapRowHeightsOptions): Record<string, number> {
  // Persistent cache across renders: "rowId:colId" → CacheEntry
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  // State to trigger re-render after layout effect updates the cache
  const [heightMap, setHeightMap] = useState<Record<string, number>>({});

  useLayoutEffect(() => {
    const ctx = getMeasureContext();
    const result: Record<string, number> = {};

    if (!ctx) {
      setHeightMap(result);
      return;
    }

    // Pre-filter to only wrapped text/number columns
    const wrappedCols: Array<{
      col: Column;
      colWidth: number;
      availableWidth: number;
      fontSize: number;
      bold: boolean;
      italic: boolean;
      fontFamily: string;
      fontString: string;
    }> = [];

    for (const col of columns) {
      if (col.type !== 'text' && col.type !== 'number') continue;
      const colFmt = col.formatting ?? {};
      // Check column-level wrapText as baseline; individual cells may override
      // We need to check per-cell, but we can pre-compute column-level defaults
      const colFontSize = colFmt.fontSize ?? DEFAULT_FONT_SIZE;
      const colBold = !!colFmt.bold;
      const colItalic = !!colFmt.italic;
      const colFontFamily = colFmt.fontFamily || 'Inter, sans-serif';
      const colWrapText = !!colFmt.wrapText;

      // Only include this column if at least the column-level formatting enables wrap
      // (cells without their own wrapText setting inherit the column's)
      // We still need to check per-cell below, but skip entirely non-wrapped columns
      if (!colWrapText) {
        // Check if any cell in this column has wrapText enabled via cell-level override
        let anyCellWrapped = false;
        for (const row of rows) {
          const cellFmt = row.formatting?.[col.id];
          if (cellFmt?.wrapText) {
            anyCellWrapped = true;
            break;
          }
        }
        if (!anyCellWrapped) continue;
      }

      const colWidth = getColWidth(col, liveColWidths);
      const availableWidth = Math.max(20, colWidth - CELL_PADDING_X);
      const fontSize = colFontSize;
      const bold = colBold;
      const italic = colItalic;
      const fontFamily = colFontFamily;
      const fontString = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;

      wrappedCols.push({ col, colWidth, availableWidth, fontSize, bold, italic, fontFamily, fontString });
    }

    if (wrappedCols.length === 0) {
      setHeightMap(result);
      return;
    }

    const cache = cacheRef.current;
    let changed = false;

    for (const row of rows) {
      let maxLines = 0;
      let lineHeightForMax = DEFAULT_FONT_SIZE * LINE_HEIGHT_FACTOR;
      let hasWrappedContent = false;

      for (const wc of wrappedCols) {
        const colFmt = wc.col.formatting ?? {};
        const cellFmt = row.formatting?.[wc.col.id] ?? {};
        const effective: CellFormatting = { ...colFmt, ...cellFmt };

        if (!effective.wrapText) continue;

        const rawValue = row.cells[wc.col.id];
        if (rawValue == null || String(rawValue).trim() === '') continue;

        const value = String(rawValue);
        const fontSize = effective.fontSize ?? wc.fontSize;
        const bold = effective.bold ?? wc.bold;
        const italic = effective.italic ?? wc.italic;
        const fontFamily = effective.fontFamily || wc.fontFamily;
        const colWidth = wc.colWidth;

        // Build fingerprint
        const cacheKey = `${row.id}:${wc.col.id}`;
        const cached = cache.get(cacheKey);

        let lines: number;

        if (
          cached &&
          cached.value === value &&
          cached.bold === bold &&
          cached.italic === italic &&
          cached.fontSize === fontSize &&
          cached.fontFamily === fontFamily &&
          cached.wrapText === true &&
          cached.colWidth === colWidth
        ) {
          // Cache hit — reuse measured line count
          lines = cached.lines;
        } else {
          // Cache miss — measure and store
          const fontString = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;
          ctx.font = fontString;
          const availableWidth = Math.max(20, colWidth - CELL_PADDING_X);
          lines = measureWrappedLines(ctx, value, availableWidth);

          cache.set(cacheKey, {
            value,
            bold,
            italic,
            fontSize,
            fontFamily,
            wrapText: true,
            colWidth,
            lines,
          });
          changed = true;
        }

        if (lines > maxLines) {
          maxLines = lines;
          lineHeightForMax = fontSize * LINE_HEIGHT_FACTOR;
        }
        hasWrappedContent = true;
      }

      if (hasWrappedContent && maxLines > 0) {
        const estimatedHeight = maxLines * lineHeightForMax + CELL_PADDING_Y;
        const clampedHeight = Math.min(Math.max(estimatedHeight, DEFAULT_ROW_HEIGHT), MAX_ROW_HEIGHT);
        // Respect any manually-set row height
        const storedHeight = row.height ?? DEFAULT_ROW_HEIGHT;
        result[row.id] = Math.max(storedHeight, clampedHeight);
      }
    }

    // Clean up cache entries for rows/cells that no longer exist
    const validKeys = new Set<string>();
    for (const row of rows) {
      for (const wc of wrappedCols) {
        validKeys.add(`${row.id}:${wc.col.id}`);
      }
    }
    for (const key of cache.keys()) {
      if (!validKeys.has(key)) {
        cache.delete(key);
        changed = true;
      }
    }

    // Always update state so the return value reflects latest inputs
    // (even if cache didn't change, the row/column set might have)
    setHeightMap(result);
  }, [rows, columns, liveColWidths]);

  return heightMap;
}
