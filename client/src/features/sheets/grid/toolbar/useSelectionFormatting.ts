import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { applyFormatting } from '@/store/slices/gridSlice';
import type { CellFormatting, Column, GridRow, WorkspaceRole } from '@/types';

interface UseSelectionFormattingOptions {
  sheetId: string;
  userRole: WorkspaceRole;
  activeCell: { rowId: string; columnId: string } | null;
  selectedCells: Array<{ rowId: string; columnId: string }>;
  selectedRows: Set<number>;
  selectedColumns: Set<number>;
  columns: Column[];
  rows: GridRow[];
  onReturnFocus?: () => void;
}

interface AggregatedFormatting extends CellFormatting {
  _mixedFontFamily?: boolean;
  _mixedFontSize?: boolean;
  _mixedTextColor?: boolean;
  _mixedFillColor?: boolean;
  _mixedTextAlign?: boolean;
  _mixedVerticalAlign?: boolean;
}

interface UseSelectionFormattingResult {
  aggregated: AggregatedFormatting;
  isViewer: boolean;
  applyFormatPatch: (patch: CellFormatting) => void;
  toggleProp: (prop: 'bold' | 'italic' | 'underline' | 'strikethrough') => void;
}

function getEffectiveFormatting(cellFmt: CellFormatting, colFmt: CellFormatting): CellFormatting {
  if (!colFmt || Object.keys(colFmt).length === 0) return cellFmt;
  if (!cellFmt || Object.keys(cellFmt).length === 0) return colFmt;
  return { ...colFmt, ...cellFmt };
}

export function useSelectionFormatting({
  sheetId,
  userRole,
  activeCell,
  selectedCells,
  selectedRows,
  selectedColumns,
  columns,
  rows,
  onReturnFocus,
}: UseSelectionFormattingOptions): UseSelectionFormattingResult {
  const dispatch = useAppDispatch();
  const isColumnOnlySelection = selectedColumns.size > 0 && selectedRows.size === 0 && !activeCell && selectedCells.length === 0;

  // Collect effective formatting for each selected cell
  const allEffectiveFmts = useMemo((): CellFormatting[] => {
    if (isColumnOnlySelection) {
      const fmts: CellFormatting[] = [];
      for (const colIdx of selectedColumns) {
        const col = columns[colIdx];
        if (col) fmts.push(col.formatting ?? {});
      }
      return fmts;
    }

    const targets: Array<{ rowId: string; columnId: string }> = [];
    if (selectedRows.size > 0) {
      for (const rowIdx of selectedRows) {
        const row = rows[rowIdx];
        if (!row) continue;
        for (const col of columns) targets.push({ rowId: row.id, columnId: col.id });
      }
    } else if (selectedCells.length > 0) {
      targets.push(...selectedCells);
    } else if (activeCell) {
      targets.push(activeCell);
    }

    const colFmtCache = new Map<string, CellFormatting>();
    const getColFmt = (columnId: string): CellFormatting => {
      if (!colFmtCache.has(columnId)) {
        const col = columns.find((c) => c.id === columnId);
        colFmtCache.set(columnId, col?.formatting ?? {});
      }
      return colFmtCache.get(columnId)!;
    };

    const fmts: CellFormatting[] = [];
    for (const target of targets) {
      const row = rows.find((r) => r.id === target.rowId);
      if (!row) continue;
      const cellFmt = row.formatting?.[target.columnId] ?? {};
      const colFmt = getColFmt(target.columnId);
      fmts.push(getEffectiveFormatting(cellFmt, colFmt));
    }
    return fmts;
  }, [isColumnOnlySelection, selectedColumns, selectedRows, selectedCells, activeCell, rows, columns]);

  const aggregated = useMemo((): AggregatedFormatting => {
    if (allEffectiveFmts.length === 0) return {};

    const result: AggregatedFormatting = {};

    const boolProps: Array<'bold' | 'italic' | 'underline' | 'strikethrough'> = ['bold', 'italic', 'underline', 'strikethrough'];
    for (const prop of boolProps) {
      result[prop] = allEffectiveFmts.every((f) => !!f[prop]);
    }

    const families = new Set(allEffectiveFmts.map((f) => f.fontFamily ?? 'default'));
    if (families.size === 1) result.fontFamily = [...families][0];
    else result._mixedFontFamily = true;

    const sizes = new Set(allEffectiveFmts.map((f) => f.fontSize ?? undefined));
    const uniqueSizes = [...sizes].filter(Boolean);
    if (uniqueSizes.length === 1) result.fontSize = uniqueSizes[0];
    else result._mixedFontSize = true;

    const textColors = new Set(allEffectiveFmts.map((f) => f.textColor ?? null));
    if (textColors.size === 1) result.textColor = [...textColors][0];
    else result._mixedTextColor = true;

    const fillColors = new Set(allEffectiveFmts.map((f) => f.fillColor ?? null));
    if (fillColors.size === 1) result.fillColor = [...fillColors][0];
    else result._mixedFillColor = true;

    const textAligns = new Set(allEffectiveFmts.map((f) => f.textAlign ?? null));
    if (textAligns.size === 1) result.textAlign = [...textAligns][0];
    else result._mixedTextAlign = true;

    const verticalAligns = new Set(allEffectiveFmts.map((f) => f.verticalAlign ?? null));
    if (verticalAligns.size === 1) result.verticalAlign = [...verticalAligns][0];
    else result._mixedVerticalAlign = true;

    return result;
  }, [allEffectiveFmts]);

  const isViewer = userRole === 'viewer';

  const getTargetCells = useCallback((): Array<{ rowId: string; columnId: string }> => {
    if (isColumnOnlySelection) return [];
    let targets: Array<{ rowId: string; columnId: string }>;
    if (selectedRows.size > 0) {
      targets = [];
      for (const rowIdx of selectedRows) {
        const row = rows[rowIdx];
        if (!row) continue;
        for (const col of columns) targets.push({ rowId: row.id, columnId: col.id });
      }
    } else if (selectedCells.length > 0) {
      targets = selectedCells;
    } else if (activeCell) {
      targets = [activeCell];
    } else {
      targets = [];
    }
    return targets.filter((c) => {
      if (c.rowId.startsWith('blank-')) return false;
      return rows.some((r) => r.id === c.rowId);
    });
  }, [selectedCells, activeCell, rows, columns, selectedRows, isColumnOnlySelection]);

  const applyFormatPatch = useCallback(
    (patch: CellFormatting) => {
      if (isColumnOnlySelection) {
        const columnTargets: Array<{ columnId: string; formatting: CellFormatting | null }> = [];
        for (const colIdx of selectedColumns) {
          const col = columns[colIdx];
          if (col) {
            const existing = col.formatting ?? {};
            const merged: Record<string, unknown> = { ...existing };
            for (const [k, v] of Object.entries(patch)) {
              if (v === null) delete merged[k];
              else merged[k] = v;
            }
            const cleaned: CellFormatting = {};
            for (const [k, v] of Object.entries(merged)) {
              if (v != null) (cleaned as Record<string, unknown>)[k] = v;
            }
            columnTargets.push({
              columnId: col.id,
              formatting: Object.keys(cleaned).length > 0 ? cleaned : null,
            });
          }
        }
        dispatch(applyFormatting({ sheetId, columnFormatting: columnTargets, cascadePatch: patch }))
          .unwrap()
          .catch(() => {});
        onReturnFocus?.();
        return;
      }

      const targets = getTargetCells();
      if (targets.length === 0) return;

      const cellPatches = targets.map((c) => ({
        rowId: c.rowId,
        columnId: c.columnId,
        formatting: patch,
      }));

      dispatch(applyFormatting({ sheetId, cells: cellPatches }))
        .unwrap()
        .catch(() => {});
      onReturnFocus?.();
    },
    [dispatch, sheetId, getTargetCells, isColumnOnlySelection, selectedColumns, columns, onReturnFocus],
  );

  const toggleProp = useCallback(
    (prop: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
      const allOn = !!aggregated[prop];
      applyFormatPatch({ [prop]: !allOn });
    },
    [aggregated, applyFormatPatch],
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (isViewer) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          toggleProp('bold');
          break;
        case 'i':
          e.preventDefault();
          toggleProp('italic');
          break;
        case 'u':
          e.preventDefault();
          toggleProp('underline');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewer, toggleProp]);

  return { aggregated, isViewer, applyFormatPatch, toggleProp };
}
