import { ConfirmDialog } from '@/components/ui';
import ColumnPropertiesModal, { type ColumnPropertiesModalProps } from './ColumnPropertiesModal';
import type { ColumnType, DropdownOption } from '@/types';

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

interface GridDialogsProps {
  colPropsModal: ColumnPropertiesState;
  onCloseColProps: () => void;
  onSaveColProps: (data: { name: string; type: ColumnType; options?: DropdownOption[] }) => void;
  deleteConfirmOpen: boolean;
  onCloseDeleteConfirm: () => void;
  onConfirmDeleteColumn: () => void;
  pendingDeleteRowIds: string[] | null;
  onCloseDeleteRows: () => void;
  onConfirmDeleteRows: () => void;
}

export default function GridDialogs({
  colPropsModal,
  onCloseColProps,
  onSaveColProps,
  deleteConfirmOpen,
  onCloseDeleteConfirm,
  onConfirmDeleteColumn,
  pendingDeleteRowIds,
  onCloseDeleteRows,
  onConfirmDeleteRows,
}: GridDialogsProps) {
  return (
    <>
      <ColumnPropertiesModal
        open={colPropsModal.open}
        onClose={onCloseColProps}
        onSave={onSaveColProps}
        initialName={colPropsModal.initialName}
        initialType={colPropsModal.initialType}
        initialOptions={colPropsModal.initialOptions}
        isPrimary={colPropsModal.isPrimary}
        existingCellCount={colPropsModal.existingCellCount}
        data-icod-id="src_features_sheets_grid_griddialogs_tsx_5d4b" />
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={onCloseDeleteConfirm}
        title="Delete column"
        description="This will permanently delete this column and all its data. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={onConfirmDeleteColumn}
        data-icod-id="src_features_sheets_grid_griddialogs_tsx_a743" />
      <ConfirmDialog
        open={pendingDeleteRowIds !== null}
        onClose={onCloseDeleteRows}
        title={`Delete ${pendingDeleteRowIds?.length ?? 0} row${(pendingDeleteRowIds?.length ?? 0) !== 1 ? 's' : ''}?`}
        description="This can't be undone."
        confirmLabel="Delete"
        onConfirm={onConfirmDeleteRows}
        data-icod-id="src_features_sheets_grid_griddialogs_tsx_54db" />
    </>
  );
}
