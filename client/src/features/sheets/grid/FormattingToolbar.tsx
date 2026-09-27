import { useCallback, useEffect, useMemo } from 'react';
import { Bold, Italic, Underline, Strikethrough, Eraser } from 'lucide-react';
import { Toolbar, ToolbarGroup, ToggleButton, IconButton, inputClass } from '@/components/ui';
import { useAppDispatch } from '@/store/hooks';
import { applyFormatting } from '@/store/slices/gridSlice';
import type { CellFormatting, Column, GridRow, WorkspaceRole } from '@/types';

interface FormattingToolbarProps {
  sheetId: string;
  userRole: WorkspaceRole;
  activeCell: { rowId: string; columnId: string } | null;
  selectedCells: Array<{ rowId: string; columnId: string }>;
  selectedRows: Set<number>;
  selectedColumns: Set<number>;
  columns: Column[];
  rows: GridRow[];
  /** Called after a formatting action to return focus to the grid container. */
  onReturnFocus?: () => void;
}

const FONT_FAMILIES = [
  { label: 'Default', value: 'default' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Courier New', value: 'Courier New' },
];

const FONT_SIZES = [10, 11, 12, 13, 14, 16, 18, 20];

/**
 * Merges column-level formatting with cell-level formatting.
 * Column formatting is the base; cell formatting overrides.
 */
function getEffectiveFormatting(
  cellFmt: CellFormatting,
  colFmt: CellFormatting,
): CellFormatting {
  if (!colFmt || Object.keys(colFmt).length === 0) return cellFmt;
  if (!cellFmt || Object.keys(cellFmt).length === 0) return colFmt;
  return { ...colFmt, ...cellFmt };
}

export default function FormattingToolbar({
  sheetId,
  userRole,
  activeCell,
  selectedCells,
  selectedRows,
  selectedColumns,
  columns,
  rows,
  onReturnFocus,
}: FormattingToolbarProps) {
  const dispatch = useAppDispatch();

  // Determine selection mode
  const isColumnOnlySelection = selectedColumns.size > 0 && selectedRows.size === 0 && !activeCell && selectedCells.length === 0;

  // ─── Compute effective formatting for all selected cells ──────────────

  // Collect effective formatting for each selected cell
  const allEffectiveFmts = useMemo((): CellFormatting[] => {
    if (isColumnOnlySelection) {
      // For column-only selection, we just look at column formatting
      const fmts: CellFormatting[] = [];
      for (const colIdx of selectedColumns) {
        const col = columns[colIdx];
        if (col) {
          fmts.push(col.formatting ?? {});
        }
      }
      return fmts;
    }

    // Build set of target cells
    const targets: Array<{ rowId: string; columnId: string }> = [];
    if (selectedRows.size > 0) {
      for (const rowIdx of selectedRows) {
        const row = rows[rowIdx];
        if (!row) continue;
        for (const col of columns) {
          targets.push({ rowId: row.id, columnId: col.id });
        }
      }
    } else if (selectedCells.length > 0) {
      targets.push(...selectedCells);
    } else if (activeCell) {
      targets.push(activeCell);
    }

    // Map of columnId -> column formatting (cache)
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

  // Compute aggregate toggle states:
  // - Boolean prop is "on" only if ALL selected cells have it true
  // - Font family/size shows value if ALL share same value, otherwise "Mixed"
  const aggregateFmt = useMemo(() => {
    if (allEffectiveFmts.length === 0) return {};

    const result: CellFormatting & { _mixedFontFamily?: boolean; _mixedFontSize?: boolean } = {};

    // Boolean toggles
    const boolProps: Array<'bold' | 'italic' | 'underline' | 'strikethrough'> = ['bold', 'italic', 'underline', 'strikethrough'];
    for (const prop of boolProps) {
      result[prop] = allEffectiveFmts.every((f) => !!f[prop]);
    }

    // Font family
    const families = new Set(allEffectiveFmts.map((f) => f.fontFamily ?? 'default'));
    if (families.size === 1) {
      result.fontFamily = [...families][0];
    } else {
      result._mixedFontFamily = true;
    }

    // Font size
    const sizes = new Set(allEffectiveFmts.map((f) => f.fontSize ?? undefined));
    const uniqueSizes = [...sizes].filter(Boolean);
    if (uniqueSizes.length === 1) {
      result.fontSize = uniqueSizes[0];
    } else {
      result._mixedFontSize = true;
    }

    return result;
  }, [allEffectiveFmts]);

  const isViewer = userRole === 'viewer';

  // Build the list of target cells (skip blank rows)
  const getTargetCells = useCallback((): Array<{ rowId: string; columnId: string }> => {
    if (isColumnOnlySelection) return [];

    let targets: Array<{ rowId: string; columnId: string }>;

    if (selectedRows.size > 0) {
      targets = [];
      for (const rowIdx of selectedRows) {
        const row = rows[rowIdx];
        if (!row) continue;
        for (const col of columns) {
          targets.push({ rowId: row.id, columnId: col.id });
        }
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

  // Apply a PARTIAL formatting patch (merge, not overwrite)
  const applyFormatPatch = useCallback(
    (patch: CellFormatting) => {
      if (isColumnOnlySelection) {
        // Apply formatting at column level + cascade to clear cell overrides
        const columnTargets: Array<{ columnId: string; formatting: CellFormatting | null }> = [];
        for (const colIdx of selectedColumns) {
          const col = columns[colIdx];
          if (col) {
            // Merge patch into existing column formatting
            const existing = col.formatting ?? {};
            const merged = { ...existing, ...patch };
            // Remove undefined values
            const cleaned: CellFormatting = {};
            for (const [k, v] of Object.entries(merged)) {
              if (v !== undefined) (cleaned as Record<string, unknown>)[k] = v;
            }
            columnTargets.push({
              columnId: col.id,
              formatting: Object.keys(cleaned).length > 0 ? cleaned : null,
            });
          }
        }

        dispatch(applyFormatting({
          sheetId,
          columnFormatting: columnTargets,
          cascadePatch: patch,
        }))
          .unwrap()
          .catch(() => {});
        onReturnFocus?.();
        return;
      }

      const targets = getTargetCells();
      if (targets.length === 0) return;

      // For each target cell, merge the patch into its existing cell formatting
      const cellPatches = targets.map((c) => {
        const row = rows.find((r) => r.id === c.rowId);
        const existingCellFmt = row?.formatting?.[c.columnId] ?? {};
        const merged = { ...existingCellFmt, ...patch };
        // Remove undefined values
        const cleaned: CellFormatting = {};
        for (const [k, v] of Object.entries(merged)) {
          if (v !== undefined) (cleaned as Record<string, unknown>)[k] = v;
        }
        return {
          rowId: c.rowId,
          columnId: c.columnId,
          formatting: Object.keys(cleaned).length > 0 ? cleaned : null,
        };
      });

      dispatch(applyFormatting({ sheetId, cells: cellPatches }))
        .unwrap()
        .catch(() => {});
      onReturnFocus?.();
    },
    [dispatch, sheetId, getTargetCells, isColumnOnlySelection, selectedColumns, columns, rows, onReturnFocus],
  );

  // Toggle a boolean formatting property
  // When all are ON → turn OFF; when any is OFF → turn ON
  const toggleProp = useCallback(
    (prop: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
      const allOn = !!aggregateFmt[prop];
      applyFormatPatch({ [prop]: !allOn });
    },
    [aggregateFmt, applyFormatPatch],
  );

  // Handle font family change
  const handleFontFamily = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      applyFormatPatch({ fontFamily: val === 'default' ? undefined : val });
    },
    [applyFormatPatch],
  );

  // Handle font size change
  const handleFontSize = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = Number(e.target.value);
      applyFormatPatch({ fontSize: isNaN(val) ? undefined : val });
    },
    [applyFormatPatch],
  );

  // Clear all formatting
  const handleClearFormatting = useCallback(() => {
    // To clear, set all known properties to undefined
    const clearPatch: CellFormatting = {
      fontFamily: undefined,
      fontSize: undefined,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
    };
    applyFormatPatch(clearPatch);
  }, [applyFormatPatch]);

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

  // Determine display values for selects
  const fontFamilyValue = aggregateFmt._mixedFontFamily ? '' : (aggregateFmt.fontFamily || 'default');
  const fontSizeValue = aggregateFmt._mixedFontSize ? '' : (aggregateFmt.fontSize ?? '');

  return (
    <Toolbar
      disabled={isViewer}
      className="select-none items-center"
      data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_890b">
      {/* Group 1: Font family + Font size */}
      <ToolbarGroup data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_2159">
        <select
          className={inputClass('h-7 text-xs py-0')}
          style={{ minWidth: '140px', width: '140px' }}
          value={fontFamilyValue}
          onChange={handleFontFamily}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Font family"
          data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_cedf">
          {FONT_FAMILIES.map((f) => (
            <option
              key={f.value}
              value={f.value}
              data-icod-id={`src_features_sheets_grid_formattingtoolbar_tsx_b799_${f.value}`}>{f.label}</option>
          ))}
          {aggregateFmt._mixedFontFamily && (
            <option value="" disabled data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_mixed_ff">Mixed</option>
          )}
        </select>
        <select
          className={inputClass('h-7 text-xs py-0')}
          style={{ minWidth: '72px', width: '72px' }}
          value={fontSizeValue}
          onChange={handleFontSize}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Font size"
          data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_096d">
          <option
            value=""
            data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_8b42">{aggregateFmt._mixedFontSize ? 'Mixed' : 'Auto'}</option>
          {FONT_SIZES.map((s) => (
            <option
              key={s}
              value={s}
              data-icod-id={`src_features_sheets_grid_formattingtoolbar_tsx_057d_${s}`}>{s}</option>
          ))}
        </select>
      </ToolbarGroup>
      {/* Group 2: Bold, Italic, Underline, Strikethrough */}
      <ToolbarGroup data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_9515">
        <ToggleButton
          pressed={!!aggregateFmt.bold}
          onToggle={() => toggleProp('bold')}
          tooltip="Bold (Ctrl+B)"
          icon={<Bold
            className="h-4 w-4"
            data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_3041" />}
          size="sm"
          data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_bb27" />
        <ToggleButton
          pressed={!!aggregateFmt.italic}
          onToggle={() => toggleProp('italic')}
          tooltip="Italic (Ctrl+I)"
          icon={<Italic
            className="h-4 w-4"
            data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_ecf7" />}
          size="sm"
          data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_3015" />
        <ToggleButton
          pressed={!!aggregateFmt.underline}
          onToggle={() => toggleProp('underline')}
          tooltip="Underline (Ctrl+U)"
          icon={<Underline
            className="h-4 w-4"
            data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_5cf9" />}
          size="sm"
          data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_ad42" />
        <ToggleButton
          pressed={!!aggregateFmt.strikethrough}
          onToggle={() => toggleProp('strikethrough')}
          tooltip="Strikethrough"
          icon={<Strikethrough
            className="h-4 w-4"
            data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_1b6e" />}
          size="sm"
          data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_6c8d" />
      </ToolbarGroup>
      {/* Group 3: Clear formatting */}
      <ToolbarGroup data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_0003">
        <IconButton
          size="sm"
          tooltip="Clear formatting"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClearFormatting}
          data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_a91b">
          <Eraser
            className="h-3.5 w-3.5"
            data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_36b5" />
        </IconButton>
      </ToolbarGroup>
      {/* Spacer for future tools */}
      <div
        className="flex-1"
        data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_3e2c" />
    </Toolbar>
  );
}
