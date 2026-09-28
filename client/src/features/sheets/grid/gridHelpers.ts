// Shared grid constants and helpers — single source of truth for the grid layout.

export const HEADER_HEIGHT = 36;
export const DEFAULT_ROW_HEIGHT = 34;
export const ROW_NUM_WIDTH = 52; // matches --grid-row-num-width in theme.css
export const PRIMARY_COL_WIDTH = 240;
export const DEFAULT_COL_WIDTH = 160;

/**
 * Returns the effective pixel width of a column.
 * If `liveWidths` is provided and contains an entry for this column, that
 * value wins (used during resize-in-progress rendering).
 */
export function getColWidth(
  col: { id?: string; isPrimary?: boolean; width?: number },
  liveWidths?: Record<string, number>,
): number {
  if (liveWidths && col.id && liveWidths[col.id] !== undefined) {
    return liveWidths[col.id];
  }
  return col.width ?? (col.isPrimary ? PRIMARY_COL_WIDTH : DEFAULT_COL_WIDTH);
}

/**
 * Returns the row's height or the default row height.
 */
export function getRowHeight(row: { height?: number } | undefined): number {
  return row?.height ?? DEFAULT_ROW_HEIGHT;
}
