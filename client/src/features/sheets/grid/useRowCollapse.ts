import { useState, useCallback, useEffect } from 'react';

/**
 * Manages row collapse state in localStorage keyed by sheet:{sheetId}:collapsed.
 */
export function useRowCollapse(sheetId: string) {
  const storageKey = `sheet:${sheetId}:collapsed`;

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
    return new Set();
  });

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...collapsedIds]));
    } catch {
      // ignore storage errors
    }
  }, [collapsedIds, storageKey]);

  const toggleCollapse = useCallback((rowId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setCollapsedIds(new Set());
  }, []);

  const collapseAll = useCallback((parentIds: string[]) => {
    setCollapsedIds(new Set(parentIds));
  }, []);

  return {
    collapsedIds,
    toggleCollapse,
    expandAll,
    collapseAll,
  };
}
