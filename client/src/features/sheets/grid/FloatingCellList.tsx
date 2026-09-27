import { useState, useRef, useEffect, useLayoutEffect, useCallback, type ReactNode } from 'react';
import ReactDOM from 'react-dom';

export interface FloatingCellListItem<T> {
  id: string;
  data: T;
}

interface FloatingCellListProps<T> {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  items: FloatingCellListItem<T>[];
  renderItem: (item: FloatingCellListItem<T>, index: number, isFocused: boolean) => ReactNode;
  /** Optional header rendered above the item list (e.g. a search input). */
  header?: ReactNode;
  /** Optional footer rendered below the item list (e.g. "Add option" or "Clear"). */
  footer?: ReactNode;
  /** Called when Enter is pressed on the focused item. */
  onSelect?: (item: FloatingCellListItem<T>) => void;
  /** Min width of the floating panel in px. Defaults to anchor width. */
  minWidth?: number;
  /** Max height of the scrollable item area in px. */
  maxHeight?: number;
  /** Additional DOM element to treat as "inside" for outside-click detection. */
  additionalCloseTarget?: React.RefObject<HTMLElement | null>;
}

/**
 * A portal-rendered floating list anchored to a cell element.
 * Used by both dropdown and contact pickers in the grid.
 * Positions below the anchor by default, flips above if not enough room.
 * Supports keyboard navigation (Up/Down/Enter/Escape).
 */
export default function FloatingCellList<T>({
  anchorRef,
  open,
  onClose,
  items,
  renderItem,
  header,
  footer,
  onSelect,
  minWidth,
  maxHeight = 220,
  additionalCloseTarget,
}: FloatingCellListProps<T>) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number; placement: 'below' | 'above' } | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset focus when items change or list opens
  useEffect(() => {
    if (open) {
      setFocusIndex(0);
    }
  }, [open, items.length]);

  // Compute position whenever open changes
  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    const rect = anchorRef.current.getBoundingClientRect();
    const gap = 4;
    const w = Math.max(rect.width, minWidth ?? 0);

    // Estimate list height: header (~40) + items + footer (~36)
    const estimatedHeight = 40 + items.length * 36 + (footer ? 36 : 0);

    let placement: 'below' | 'above' = 'below';
    let top = rect.bottom + gap;

    // Flip above if not enough room below
    if (top + estimatedHeight > window.innerHeight && rect.top - gap - estimatedHeight >= 0) {
      placement = 'above';
      top = rect.top - gap;
    }

    setPos({ top, left: rect.left, width: w, placement });
  }, [open, anchorRef, items.length, footer, minWidth]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (listRef.current && !listRef.current.contains(target)) {
        // Also check if click was on the anchor itself
        if (anchorRef.current && anchorRef.current.contains(target)) return;
        // Also check additional close target (e.g. the cell element)
        if (additionalCloseTarget?.current && additionalCloseTarget.current.contains(target)) return;
        onClose();
      }
    };

    // Use mousedown so it fires before blur events
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose, anchorRef, additionalCloseTarget]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusIndex((prev) => Math.min(prev + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[focusIndex] && onSelect) {
          onSelect(items[focusIndex]);
        }
      }
    },
    [items, focusIndex, onSelect],
  );

  // Scroll focused item into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const focused = listRef.current.querySelector(`[data-floating-index="${focusIndex}"]`);
    focused?.scrollIntoView({ block: 'nearest' });
  }, [focusIndex, open]);

  if (!open || !pos) return null;

  const portalContent = (
    <div
      ref={listRef}
      className="fixed overflow-hidden rounded-md border border-border bg-card shadow-md"
      style={{
        zIndex: 'var(--z-dropdown)',
        top: pos.placement === 'below' ? pos.top : undefined,
        bottom: pos.placement === 'above' ? window.innerHeight - pos.top : undefined,
        left: pos.left,
        width: pos.width,
      }}
      onKeyDown={handleKeyDown}
      onMouseDown={(e) => e.preventDefault()}
      tabIndex={-1}
      data-icod-id="floating_cell_list_root"
    >
      {header && (
        <div
          className="border-b border-border px-2 py-1.5"
          data-icod-id="floating_cell_list_header"
        >
          {header}
        </div>
      )}
      <div
        className="overflow-y-auto"
        style={{ maxHeight }}
        data-icod-id="floating_cell_list_items"
      >
        {items.map((item, idx) => (
          <div
            key={item.id}
            data-floating-index={idx}
            onMouseEnter={() => setFocusIndex(idx)}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect?.(item);
            }}
            data-icod-id={`src_features_sheets_grid_floatingcelllist_tsx_83fd_${item.id}`}>
            {renderItem(item, idx, idx === focusIndex)}
          </div>
        ))}
        {items.length === 0 && !footer && (
          <div
            className="px-3 py-2 text-xs text-muted-foreground"
            data-icod-id="floating_cell_list_empty"
          >
            No results
          </div>
        )}
      </div>
      {footer && (
        <div
          className="border-t border-border"
          data-icod-id="floating_cell_list_footer"
        >
          {footer}
        </div>
      )}
    </div>
  );

  return ReactDOM.createPortal(portalContent, document.body);
}
