import { useCallback, useEffect } from 'react';
import { Bold, Italic, Underline, Strikethrough, Eraser } from 'lucide-react';
import { Toolbar, ToolbarGroup, ToggleButton, IconButton, inputClass } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { applyFormatting, selectCellFormatting, selectGridRows } from '@/store/slices/gridSlice';
import type { CellFormatting, WorkspaceRole } from '@/types';

interface FormattingToolbarProps {
  sheetId: string;
  userRole: WorkspaceRole;
  activeCell: { rowId: string; columnId: string } | null;
  selectedCells: Array<{ rowId: string; columnId: string }>;
}

const FONT_FAMILIES = [
  { label: 'Default', value: 'default' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Courier New', value: 'Courier New' },
];

const FONT_SIZES = [10, 11, 12, 13, 14, 16, 18, 20];

export default function FormattingToolbar({
  sheetId,
  userRole,
  activeCell,
  selectedCells,
}: FormattingToolbarProps) {
  const dispatch = useAppDispatch();
  const rows = useAppSelector(selectGridRows);

  // Read formatting for the active cell
  const activeFmt = useAppSelector((state) =>
    activeCell ? selectCellFormatting(state, activeCell.rowId, activeCell.columnId) : {},
  );

  const isViewer = userRole === 'viewer';

  // Build the list of target cells (skip blank rows)
  const getTargetCells = useCallback((): Array<{ rowId: string; columnId: string }> => {
    const targets = selectedCells.length > 0 ? selectedCells : activeCell ? [activeCell] : [];
    return targets.filter((c) => {
      // Skip blank rows (not in DB yet)
      if (c.rowId.startsWith('blank-')) return false;
      return rows.some((r) => r.id === c.rowId);
    });
  }, [selectedCells, activeCell, rows]);

  // Apply a formatting change to all target cells
  const applyFormat = useCallback(
    (merged: CellFormatting | null) => {
      const targets = getTargetCells();
      if (targets.length === 0) return;
      dispatch(applyFormatting({ sheetId, cells: targets.map((c) => ({ ...c, formatting: merged })) }))
        .unwrap()
        .catch(() => {
          // Error handled by slice saveError
        });
    },
    [dispatch, sheetId, getTargetCells],
  );

  // Toggle a boolean formatting property
  const toggleProp = useCallback(
    (prop: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
      const current = activeFmt[prop] ?? false;
      applyFormat({ ...activeFmt, [prop]: !current });
    },
    [activeFmt, applyFormat],
  );

  // Handle font family change
  const handleFontFamily = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      applyFormat({ ...activeFmt, fontFamily: val === 'default' ? undefined : val });
    },
    [activeFmt, applyFormat],
  );

  // Handle font size change
  const handleFontSize = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = Number(e.target.value);
      applyFormat({ ...activeFmt, fontSize: isNaN(val) ? undefined : val });
    },
    [activeFmt, applyFormat],
  );

  // Clear all formatting
  const handleClearFormatting = useCallback(() => {
    applyFormat({});
  }, [applyFormat]);

  // Keyboard shortcuts
  useEffect(() => {
    if (isViewer) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only fire when not in an input/textarea
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

  return (
    <Toolbar
      disabled={isViewer}
      data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_890b">
      {/* Group 1: Font family + Font size */}
      <ToolbarGroup data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_2159">
        <select
          className={inputClass('w-28 h-6 text-xs py-0')}
          value={activeFmt.fontFamily || 'default'}
          onChange={handleFontFamily}
          aria-label="Font family"
          data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_cedf">
          {FONT_FAMILIES.map((f) => (
            <option
              key={f.value}
              value={f.value}
              data-icod-id={`src_features_sheets_grid_formattingtoolbar_tsx_b799_${f.value}`}>{f.label}</option>
          ))}
        </select>
        <select
          className={inputClass('w-14 h-6 text-xs py-0')}
          value={activeFmt.fontSize ?? ''}
          onChange={handleFontSize}
          aria-label="Font size"
          data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_096d">
          <option
            value=""
            data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_8b42">Auto</option>
          {FONT_SIZES.map((s) => (
            <option
              key={s}
              value={s}
              data-icod-id={`src_features_sheets_grid_formattingtoolbar_tsx_057d_${s}`}>{s}px</option>
          ))}
        </select>
      </ToolbarGroup>
      {/* Group 2: Bold, Italic, Underline, Strikethrough */}
      <ToolbarGroup data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_9515">
        <ToggleButton
          pressed={!!activeFmt.bold}
          onToggle={() => toggleProp('bold')}
          tooltip="Bold (Ctrl+B)"
          icon={<Bold
            className="h-4 w-4"
            data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_3041" />}
          size="sm"
          data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_bb27" />
        <ToggleButton
          pressed={!!activeFmt.italic}
          onToggle={() => toggleProp('italic')}
          tooltip="Italic (Ctrl+I)"
          icon={<Italic
            className="h-4 w-4"
            data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_ecf7" />}
          size="sm"
          data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_3015" />
        <ToggleButton
          pressed={!!activeFmt.underline}
          onToggle={() => toggleProp('underline')}
          tooltip="Underline (Ctrl+U)"
          icon={<Underline
            className="h-4 w-4"
            data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_5cf9" />}
          size="sm"
          data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_ad42" />
        <ToggleButton
          pressed={!!activeFmt.strikethrough}
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
