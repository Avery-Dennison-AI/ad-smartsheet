import { ConfirmDialog, Modal, Button } from '@/components/ui';
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
  onConfirmDeleteRows: (includeDescendants?: boolean) => void;
  /** Number of descendants across all pending-delete rows */
  descendantCount?: number;
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
  descendantCount = 0,
}: GridDialogsProps) {
  const hasDescendants = descendantCount > 0;

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
      {hasDescendants ? (
        <Modal
          open={pendingDeleteRowIds !== null}
          onClose={onCloseDeleteRows}
          title="Delete rows?"
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={onCloseDeleteRows}
                data-icod-id="src_features_sheets_grid_griddialogs_tsx_cancel">
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { onConfirmDeleteRows(false); onCloseDeleteRows(); }}
                data-icod-id="src_features_sheets_grid_griddialogs_tsx_keep_children">
                Keep child rows
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => { onConfirmDeleteRows(true); onCloseDeleteRows(); }}
                data-icod-id="src_features_sheets_grid_griddialogs_tsx_delete_all">
                Delete row{pendingDeleteRowIds?.length !== 1 ? 's' : ''} and {descendantCount} child row{descendantCount !== 1 ? 's' : ''}
              </Button>
            </>
          }
          className="max-w-sm"
          data-icod-id="src_features_sheets_grid_griddialogs_tsx_hierarchical">
          <p
            className="text-muted-foreground"
            data-icod-id="src_features_sheets_grid_griddialogs_tsx_hier_desc">
            This row has {descendantCount} child row{descendantCount !== 1 ? 's' : ''}. What would you like to do?
          </p>
        </Modal>
      ) : (
        <ConfirmDialog
          open={pendingDeleteRowIds !== null}
          onClose={onCloseDeleteRows}
          title={`Delete ${pendingDeleteRowIds?.length ?? 0} row${(pendingDeleteRowIds?.length ?? 0) !== 1 ? 's' : ''}?`}
          description="This can't be undone."
          confirmLabel="Delete"
          onConfirm={() => onConfirmDeleteRows(false)}
          data-icod-id="src_features_sheets_grid_griddialogs_tsx_54db" />
      )}
    </>
  );
}
