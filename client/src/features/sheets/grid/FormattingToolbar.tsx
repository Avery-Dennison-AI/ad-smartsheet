import { useCallback } from 'react';
import { Toolbar, ToolbarGroup } from '@/components/ui';
import { useSelectionFormatting } from './toolbar/useSelectionFormatting';
import FontGroup from './toolbar/FontGroup';
import TextStyleGroup from './toolbar/TextStyleGroup';
import ColorGroup from './toolbar/ColorGroup';
import AlignmentGroup from './toolbar/AlignmentGroup';
import ClearFormattingButton from './toolbar/ClearFormattingButton';
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
  const { aggregated, isViewer, applyFormatPatch, toggleProp } = useSelectionFormatting({
    sheetId,
    userRole,
    activeCell,
    selectedCells,
    selectedRows,
    selectedColumns,
    columns,
    rows,
    onReturnFocus,
  });

  const handleClearFormatting = useCallback(() => {
    const clearPatch: CellFormatting = {
      fontFamily: null,
      fontSize: null,
      bold: null,
      italic: null,
      underline: null,
      strikethrough: null,
      textAlign: null,
      verticalAlign: null,
      textColor: null,
      fillColor: null,
    };
    applyFormatPatch(clearPatch);
  }, [applyFormatPatch]);

  return (
    <Toolbar
      disabled={isViewer}
      className="select-none items-center"
      data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_f2b2">
      <ToolbarGroup data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_4295">
        <FontGroup
          aggregated={aggregated}
          onApply={applyFormatPatch}
          data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_8233" />
      </ToolbarGroup>
      <ToolbarGroup data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_dcd7">
        <TextStyleGroup
          aggregated={aggregated}
          onToggle={toggleProp}
          data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_0b6f" />
      </ToolbarGroup>
      <ToolbarGroup data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_3c25">
        <ColorGroup
          aggregated={aggregated}
          onApply={applyFormatPatch}
          data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_f5c1" />
      </ToolbarGroup>
      <ToolbarGroup data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_6bbb">
        <AlignmentGroup
          aggregated={aggregated}
          onApply={applyFormatPatch}
          data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_ec34" />
      </ToolbarGroup>
      <ToolbarGroup data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_8c9e">
        <ClearFormattingButton
          onClear={handleClearFormatting}
          data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_cc96" />
      </ToolbarGroup>
      <div
        className="flex-1"
        data-icod-id="src_features_sheets_grid_formattingtoolbar_tsx_a904" />
    </Toolbar>
  );
}
