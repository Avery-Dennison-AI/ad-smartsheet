import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

const OVERSCAN = 5;

interface UseGridVirtualizationOptions {
  rows: Array<{ height?: number }>;
  blankRowCount: number;
  defaultRowHeight: number;
}

interface UseGridVirtualizationResult {
  rowPositions: { tops: number[]; total: number };
  totalRows: number;
  visibleStartRow: number;
  visibleEndRow: number;
  visibleRows: number[];
  scrollTop: number;
  isScrolled: boolean;
  scrollContainerRef: (node: HTMLDivElement | null) => void;
  scrollNodeRef: React.MutableRefObject<HTMLDivElement | null>;
  onScroll: () => void;
}

function buildRowPositions(
  rows: Array<{ height?: number }>,
  blankRowCount: number,
  defaultHeight: number,
): { tops: number[]; total: number } {
  const dataCount = rows.length;
  const totalCount = dataCount + blankRowCount;
  const tops: number[] = new Array(totalCount);
  let top = 0;

  for (let i = 0; i < dataCount; i++) {
    tops[i] = top;
    top += rows[i]?.height ?? defaultHeight;
  }
  for (let i = dataCount; i < totalCount; i++) {
    tops[i] = top;
    top += defaultHeight;
  }

  return { tops, total: top };
}

function findFirstVisible(tops: number[], scrollTop: number): number {
  let lo = 0;
  let hi = tops.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (tops[mid] <= scrollTop) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return Math.max(0, hi);
}

export function useGridVirtualization({
  rows,
  blankRowCount,
  defaultRowHeight,
}: UseGridVirtualizationOptions): UseGridVirtualizationResult {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(600);
  const observerRef = useRef<ResizeObserver | null>(null);
  const scrollNodeRef = useRef<HTMLDivElement | null>(null);

  // Callback ref: attaches ResizeObserver + window resize listener
  const scrollContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    scrollNodeRef.current = node;

    if (!node) return;

    setViewportHeight(node.clientHeight);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportHeight(entry.contentRect.height);
      }
    });
    ro.observe(node);
    observerRef.current = ro;

    const handleWindowResize = () => {
      setViewportHeight(node.clientHeight);
    };
    window.addEventListener('resize', handleWindowResize);

    (node as any).__cleanupResize = () => {
      ro.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      const node = scrollNodeRef.current;
      if (node && (node as any).__cleanupResize) {
        (node as any).__cleanupResize();
      }
    };
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollNodeRef.current) {
      setScrollTop(scrollNodeRef.current.scrollTop);
      setIsScrolled(scrollNodeRef.current.scrollLeft > 0);
    }
  }, []);

  const rowPositions = useMemo(
    () => buildRowPositions(rows, blankRowCount, defaultRowHeight),
    [rows, blankRowCount, defaultRowHeight],
  );

  const totalRows = rows.length + blankRowCount;

  const { visibleStartRow, visibleEndRow } = useMemo(() => {
    const { tops } = rowPositions;
    const start = findFirstVisible(tops, scrollTop);
    const overscanStart = Math.max(0, start - OVERSCAN);

    let end = start;
    const bottomEdge = scrollTop + viewportHeight;
    while (end < totalRows - 1 && tops[end] < bottomEdge) {
      end++;
    }
    const overscanEnd = Math.min(totalRows - 1, end + OVERSCAN);

    return { visibleStartRow: overscanStart, visibleEndRow: overscanEnd };
  }, [rowPositions, scrollTop, viewportHeight, totalRows]);

  const visibleRows = useMemo(() => {
    const result: number[] = [];
    for (let i = visibleStartRow; i <= visibleEndRow; i++) {
      result.push(i);
    }
    return result;
  }, [visibleStartRow, visibleEndRow]);

  return {
    rowPositions,
    totalRows,
    visibleStartRow,
    visibleEndRow,
    visibleRows,
    scrollTop,
    isScrolled,
    scrollContainerRef,
    scrollNodeRef,
    onScroll: handleScroll,
  };
}
