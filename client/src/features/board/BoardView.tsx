import { useMemo, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectGridRows, selectGridColumns, updateCell, optimisticUpdateCell, rollbackCell, addRow } from '@/store/slices/gridSlice';
import { selectCurrentSheet } from '@/store/slices/sheetsSlice';
import { selectBoardGroupBy, setGroupBy, selectBoardFilters } from '@/store/slices/boardSlice';
import { openItem } from '@/store/slices/itemDetailSlice';
import type { ItemDetailTab } from '@/store/slices/itemDetailSlice';
import type { WorkspaceRole, Column, GridRow as GridRowType } from '@/types';
import type { BoardCardData, BoardColumnData } from './boardTypes';
import BoardToolbar from './BoardToolbar';
import BoardColumn from './BoardColumn';
import { useToast } from '@/components/ui';

interface BoardViewProps {
  sheetId: string;
  userRole: WorkspaceRole;
}

/** Extract a display title from a row using the primary column. */
function getRowTitle(row: GridRowType, primaryCol: Column | undefined): string {
  if (!primaryCol) return 'Untitled';
  const val = row.cells[primaryCol.id];
  return typeof val === 'string' ? val : String(val ?? 'Untitled');
}

/** Build BoardCardData from a grid row. */
function buildCardData(
  row: GridRowType,
  columns: Column[],
  primaryCol: Column | undefined,
  isProject: boolean,
  allRows: GridRowType[],
): BoardCardData {
  const title = getRowTitle(row, primaryCol);

  // Find system columns
  const statusCol = columns.find((c) => c.systemField === 'status');
  const keyCol = columns.find((c) => c.systemField === 'key');
  const typeCol = columns.find((c) => c.systemField === 'type');
  const priorityCol = columns.find((c) => c.systemField === 'priority');
  const assigneeCol = columns.find((c) => c.systemField === 'assignee');
  const dueCol = columns.find((c) => c.systemField === 'due');

  // For plain sheets, gather extra fields (non-primary, non-system dropdown/text/number/date)
  const extraFields: BoardCardData['extraFields'] = [];
  if (!isProject) {
    for (const col of columns) {
      if (col.isPrimary || col.systemField) continue;
      const val = row.cells[col.id];
      if (val != null && val !== '') {
        extraFields.push({ label: col.name, value: String(val), type: col.type });
      }
    }
  }

  // Count sub-items
  const subItemCount = allRows.filter((r) => r.parentId === row.id).length;

  // Find parent title
  let parentTitle: string | undefined;
  if (row.parentId) {
    const parent = allRows.find((r) => r.id === row.parentId);
    if (parent) parentTitle = getRowTitle(parent, primaryCol);
  }

  return {
    rowId: row.id,
    title,
    key: keyCol ? String(row.cells[keyCol.id] ?? '') : undefined,
    typeId: typeCol ? String(row.cells[typeCol.id] ?? '') : undefined,
    typeName: typeCol ? String(row.cells[typeCol.id] ?? '') : undefined,
    priorityId: priorityCol ? String(row.cells[priorityCol.id] ?? '') : undefined,
    priorityLabel: priorityCol ? String(row.cells[priorityCol.id] ?? '') : undefined,
    assigneeId: assigneeCol ? String(row.cells[assigneeCol.id] ?? '') : undefined,
    assigneeName: assigneeCol ? String(row.cells[assigneeCol.id] ?? '') : undefined,
    dueDate: dueCol ? String(row.cells[dueCol.id] ?? '') : undefined,
    commentCount: row.commentCount ?? 0,
    attachmentCount: row.attachmentCount ?? 0,
    parentTitle,
    subItemCount,
    extraFields: extraFields.length > 0 ? extraFields : undefined,
  };
}

export default function BoardView({ sheetId, userRole }: BoardViewProps) {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const rows = useAppSelector(selectGridRows);
  const columns = useAppSelector(selectGridColumns);
  const sheet = useAppSelector(selectCurrentSheet);
  const groupByColumnId = useAppSelector((s) => selectBoardGroupBy(s, sheetId));
  const filters = useAppSelector((s) => selectBoardFilters(s, sheetId));

  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);

  const isProject = sheet?.kind === 'project';
  const primaryCol = columns.find((c) => c.isPrimary);

  // Initialize groupBy from URL param or first dropdown column
  useEffect(() => {
    if (groupByColumnId) return;
    const urlGroup = searchParams.get('groupBy');
    if (urlGroup) {
      dispatch(setGroupBy({ sheetId, columnId: urlGroup }));
    } else if (!isProject) {
      const firstDropdown = columns.find((c) => c.type === 'dropdown');
      if (firstDropdown) {
        dispatch(setGroupBy({ sheetId, columnId: firstDropdown.id }));
      }
    }
  }, [sheetId, isProject, columns, groupByColumnId, searchParams, dispatch]);

  // Listen for card open events from BoardColumn children
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { rowId: string; tab?: ItemDetailTab };
      dispatch(openItem({ rowId: detail.rowId, tab: detail.tab }));
    };
    window.addEventListener('board:open-card', handler);
    return () => window.removeEventListener('board:open-card', handler);
  }, [dispatch]);

  // Filter rows by search
  const filteredRows = useMemo(() => {
    let result = rows;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((r) => {
        const title = getRowTitle(r, primaryCol).toLowerCase();
        return title.includes(q);
      });
    }
    return result;
  }, [rows, filters, primaryCol]);

  // Build columns
  const boardColumns: BoardColumnData[] = useMemo(() => {
    if (isProject) {
      // For projects: group by status column values
      const statusCol = columns.find((c) => c.systemField === 'status');
      if (!statusCol?.options) return [];

      const groups: BoardColumnData[] = statusCol.options.map((opt) => ({
        id: opt.label,
        label: opt.label,
        color: opt.color,
        cards: [],
      }));

      // Add "No status" group
      groups.push({ id: '__none__', label: 'No status', cards: [] });

      for (const row of filteredRows) {
        const statusVal = statusCol ? String(row.cells[statusCol.id] ?? '') : '';
        const card = buildCardData(row, columns, primaryCol, true, rows);
        const group = groups.find((g) => g.id === statusVal) ?? groups[groups.length - 1];
        group.cards.push(card);
      }

      return groups;
    }

    // Plain sheet: group by selected dropdown column
    if (!groupByColumnId) return [];
    const groupCol = columns.find((c) => c.id === groupByColumnId);
    if (!groupCol?.options) return [];

    const groups: BoardColumnData[] = groupCol.options.map((opt) => ({
      id: opt.label,
      label: opt.label,
      color: opt.color,
      cards: [],
    }));
    groups.push({ id: '__none__', label: 'No value', cards: [] });

    for (const row of filteredRows) {
      const val = String(row.cells[groupByColumnId] ?? '');
      const card = buildCardData(row, columns, primaryCol, false, rows);
      const group = groups.find((g) => g.id === val) ?? groups[groups.length - 1];
      group.cards.push(card);
    }

    return groups;
  }, [isProject, columns, groupByColumnId, filteredRows, primaryCol, rows]);

  // Column options for "Move to" menu
  const columnOptions = useMemo(
    () => boardColumns.map((c) => ({ id: c.id, label: c.label })),
    [boardColumns],
  );

  // Handle card move (drag-drop or menu)
  const handleMoveCard = useCallback(
    (rowId: string, targetColumnLabel: string) => {
      if (userRole === 'viewer') return;

      const groupColId = isProject
        ? columns.find((c) => c.systemField === 'status')?.id
        : groupByColumnId;

      if (!groupColId) return;

      // Find current value for rollback
      const row = rows.find((r) => r.id === rowId);
      const previousValue = row?.cells[groupColId] ?? null;

      // Optimistic update
      dispatch(optimisticUpdateCell({ rowId, columnId: groupColId, value: targetColumnLabel }));

      // Actual update
      dispatch(updateCell({ sheetId, rowId, columnId: groupColId, value: targetColumnLabel }))
        .unwrap()
        .catch(() => {
          dispatch(rollbackCell({ rowId, columnId: groupColId, previousValue }));
          addToast('error', 'Failed to move item');
        });
    },
    [dispatch, sheetId, userRole, isProject, columns, groupByColumnId, rows, addToast],
  );

  // Drag handlers
  const handleDragOver = useCallback((_e: React.DragEvent, columnId: string) => {
    setDragOverColumnId(columnId);
  }, []);

  const handleDrop = useCallback(
    (_e: React.DragEvent, columnId: string) => {
      setDragOverColumnId(null);
      if (draggedRowId) {
        handleMoveCard(draggedRowId, columnId);
        setDraggedRowId(null);
      }
    },
    [draggedRowId, handleMoveCard],
  );

  // Add item handler
  const handleAddItem = useCallback(() => {
    dispatch(addRow({ sheetId }));
  }, [dispatch, sheetId]);

  return (
    <div className="flex h-full flex-col" data-icod-id="board_view">
      <BoardToolbar
        sheetId={sheetId}
        isProject={isProject}
        columns={columns}
        data-icod-id="src_features_board_boardview_tsx_2236" />
      <div
        className="flex flex-1 gap-3 overflow-x-auto p-3"
        data-icod-id="board_view_columns">
        {boardColumns.length === 0 && !isProject && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground" data-icod-id="board_view_nogroup">
            Select a dropdown column to group by
          </div>
        )}
        {boardColumns.map((col) => (
          <BoardColumn
            key={col.id}
            columnId={col.id}
            label={col.label}
            color={col.color}
            count={col.cards.length}
            cards={col.cards}
            isProject={isProject}
            userRole={userRole}
            sheetId={sheetId}
            onAddItem={handleAddItem}
            columnOptions={columnOptions}
            onMoveCard={handleMoveCard}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            isDragOver={dragOverColumnId === col.id}
            data-icod-id={`src_features_board_boardview_tsx_81f1_${col.id}`} />
        ))}
      </div>
    </div>
  );
}
