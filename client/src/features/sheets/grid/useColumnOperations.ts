import { useState, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
  setPrimaryColumn,
  resizeColumn,
  selectGridColumns,
  selectGridRows,
} from '@/store/slices/gridSlice';
import type { ColumnType, DropdownOption } from '@/types';

const DEFAULT_COL_WIDTH = 160;
const PRIMARY_COL_WIDTH = 240;
const MIN_COL_WIDTH = 60;
const MAX_COL_WIDTH = 800;

interface ColumnPropertiesState {
  open: boolean;
  columnId: string | null;
  initialName: string;
  initialType: ColumnType;
  initialOptions: DropdownOption[];
  isPrimary: boolean;
  existingCellCount: number;
  insertPosition: number | null;
}

export const defaultColumnPropertiesState: ColumnPropertiesState = {
  open: false,
  columnId: null,
  initialName: '',
  initialType: 'text',
  initialOptions: [],
  isPrimary: false,
  existingCellCount: 0,
  insertPosition: null,
};

type ColResizeDrag = {
  columnId: string;
  startX: number;
  startWidth: number;
  currentWidth: number;
} | null;

interface UseColumnOperationsResult {
  colPropsModal: ColumnPropertiesState;
  setColPropsModal: React.Dispatch<React.SetStateAction<ColumnPropertiesState>>;
  deleteConfirmOpen: boolean;
  setDeleteConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
  pendingDeleteColId: string | null;
  dragColId: string | null;
  colResizeDrag: ColResizeDrag;
  handleRenameColumn: (columnId: string, name: string) => void;
  handleEditColumnProperties: (columnId: string) => void;
  handleColumnPropertiesSave: (data: { name: string; type: ColumnType; options?: DropdownOption[] }) => void;
  handleDeleteColumn: (columnId: string) => void;
  confirmDeleteColumn: () => void;
  handleInsertColumn: (afterColumnId: string, direction: 'left' | 'right') => void;
  handleSetPrimaryColumn: (columnId: string) => void;
  handleColDragStart: (colId: string) => void;
  handleColDrop: (targetColId: string) => void;
  handleColumnResizeStart: (e: React.MouseEvent, columnId: string) => void;
  handleColumnResizeDoubleClick: (columnId: string) => void;
  handleAddDropdownOption: (columnId: string, label: string) => void;
}

function getColWidth(col: { isPrimary?: boolean; width?: number }): number {
  return col.width ?? (col.isPrimary ? PRIMARY_COL_WIDTH : DEFAULT_COL_WIDTH);
}

export function useColumnOperations(
  sheetId: string,
): UseColumnOperationsResult {
  const dispatch = useAppDispatch();
  const columns = useAppSelector(selectGridColumns);
  const rows = useAppSelector(selectGridRows);

  const [colPropsModal, setColPropsModal] = useState<ColumnPropertiesState>(defaultColumnPropertiesState);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteColId, setPendingDeleteColId] = useState<string | null>(null);
  const [dragColId, setDragColId] = useState<string | null>(null);
  const [colResizeDrag, setColResizeDrag] = useState<ColResizeDrag>(null);

  const handleRenameColumn = useCallback(
    (columnId: string, name: string) => {
      dispatch(updateColumn({ sheetId, columnId, patch: { name } }));
    },
    [sheetId, dispatch],
  );

  const handleEditColumnProperties = useCallback(
    (columnId: string) => {
      const col = columns.find((c) => c.id === columnId);
      if (!col) return;
      let cellCount = 0;
      for (const row of rows) {
        if (row.cells[columnId] != null && row.cells[columnId] !== '') cellCount++;
      }
      setColPropsModal({
        open: true,
        columnId,
        initialName: col.name,
        initialType: col.type,
        initialOptions: col.options ?? [],
        isPrimary: !!col.isPrimary,
        existingCellCount: cellCount,
        insertPosition: null,
      });
    },
    [columns, rows],
  );

  const handleColumnPropertiesSave = useCallback(
    (data: { name: string; type: ColumnType; options?: DropdownOption[] }) => {
      if (colPropsModal.columnId) {
        dispatch(updateColumn({
          sheetId,
          columnId: colPropsModal.columnId,
          patch: {
            name: data.name,
            type: data.type,
            ...(data.type === 'dropdown' ? { options: data.options } : {}),
          },
        }));
      } else {
        dispatch(addColumn({
          sheetId,
          data: {
            name: data.name,
            type: data.type,
            ...(colPropsModal.insertPosition !== null ? { position: colPropsModal.insertPosition } : {}),
            ...(data.type === 'dropdown' ? { options: data.options } : {}),
          },
        }));
      }
      setColPropsModal(defaultColumnPropertiesState);
    },
    [sheetId, colPropsModal.columnId, colPropsModal.insertPosition, dispatch],
  );

  const handleDeleteColumn = useCallback((columnId: string) => {
    setPendingDeleteColId(columnId);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDeleteColumn = useCallback(() => {
    if (pendingDeleteColId) {
      dispatch(deleteColumn({ sheetId, columnId: pendingDeleteColId }));
    }
    setDeleteConfirmOpen(false);
    setPendingDeleteColId(null);
  }, [sheetId, pendingDeleteColId, dispatch]);

  const handleInsertColumn = useCallback(
    (afterColumnId: string, direction: 'left' | 'right') => {
      const colIndex = columns.findIndex((c) => c.id === afterColumnId);
      const position = direction === 'left' ? colIndex : colIndex + 1;
      setColPropsModal({
        open: true,
        columnId: null,
        initialName: 'New Column',
        initialType: 'text',
        initialOptions: [],
        isPrimary: false,
        existingCellCount: 0,
        insertPosition: position,
      });
    },
    [columns],
  );

  const handleSetPrimaryColumn = useCallback(
    (columnId: string) => {
      dispatch(setPrimaryColumn({ sheetId, columnId }));
    },
    [sheetId, dispatch],
  );

  const handleColDragStart = useCallback((colId: string) => {
    const col = columns.find((c) => c.id === colId);
    if (col?.isPrimary) return;
    setDragColId(colId);
  }, [columns]);

  const handleColDrop = useCallback(
    (targetColId: string) => {
      if (dragColId && dragColId !== targetColId) {
        const ids = columns.map((c) => c.id);
        const fromIdx = ids.indexOf(dragColId);
        let toIdx = ids.indexOf(targetColId);
        if (fromIdx !== -1 && toIdx !== -1) {
          if (toIdx < 1) toIdx = 1;
          ids.splice(fromIdx, 1);
          ids.splice(toIdx, 0, dragColId);
          dispatch(reorderColumns({ sheetId, orderedIds: ids }));
        }
      }
      setDragColId(null);
    },
    [dragColId, columns, sheetId, dispatch],
  );

  const handleColumnResizeStart = useCallback(
    (e: React.MouseEvent, columnId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const col = columns.find((c) => c.id === columnId);
      if (!col) return;
      const startWidth = getColWidth(col);
      setColResizeDrag({ columnId, startX: e.clientX, startWidth, currentWidth: startWidth });
    },
    [columns],
  );

  const handleColumnResizeDoubleClick = useCallback(
    (columnId: string) => {
      const col = columns.find((c) => c.id === columnId);
      if (!col) return;
      const defaultW = col.isPrimary ? PRIMARY_COL_WIDTH : DEFAULT_COL_WIDTH;
      dispatch(resizeColumn({ sheetId, columnId, width: defaultW }));
    },
    [sheetId, columns, dispatch],
  );

  // Global mousemove/mouseup for column resize
  useEffect(() => {
    if (!colResizeDrag) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - colResizeDrag.startX;
      const newWidth = Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, colResizeDrag.startWidth + delta));
      setColResizeDrag((prev) => prev ? { ...prev, currentWidth: newWidth } : null);
    };

    const handleMouseUp = () => {
      if (colResizeDrag) {
        const finalWidth = Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, colResizeDrag.currentWidth));
        dispatch(resizeColumn({ sheetId, columnId: colResizeDrag.columnId, width: finalWidth }));
      }
      setColResizeDrag(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [colResizeDrag, sheetId, dispatch]);

  const handleAddDropdownOption = useCallback(
    (columnId: string, label: string) => {
      const col = columns.find((c) => c.id === columnId);
      if (!col || col.type !== 'dropdown') return;
      const existingOptions = col.options ?? [];
      const defaultColor = existingOptions[0]?.color ?? 'gray';
      const newOptions = [...existingOptions, { label, color: defaultColor }];
      dispatch(updateColumn({ sheetId, columnId, patch: { options: newOptions } }));
    },
    [sheetId, columns, dispatch],
  );

  return {
    colPropsModal,
    setColPropsModal,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    pendingDeleteColId,
    dragColId,
    colResizeDrag,
    handleRenameColumn,
    handleEditColumnProperties,
    handleColumnPropertiesSave,
    handleDeleteColumn,
    confirmDeleteColumn,
    handleInsertColumn,
    handleSetPrimaryColumn,
    handleColDragStart,
    handleColDrop,
    handleColumnResizeStart,
    handleColumnResizeDoubleClick,
    handleAddDropdownOption,
  };
}
