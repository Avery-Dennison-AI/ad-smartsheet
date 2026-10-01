import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, ExternalLink, Pencil, Copy, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { DropdownMenu, ConfirmDialog, IconButton } from '@/components/ui';
import type { WorkspaceRole } from '@/types';
import { useAppDispatch } from '@/store/hooks';
import { duplicateSheet, deleteSheet } from '@/store/slices/sheetsSlice';
import RenameSheetModal from './RenameSheetModal';

interface SheetActionsMenuProps {
  sheetId: string;
  sheetName: string;
  sheetDescription?: string;
  userRole: WorkspaceRole;
  hideOpen?: boolean;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
}

export default function SheetActionsMenu({ sheetId, sheetName, sheetDescription, userRole, hideOpen = false, onExpandAll, onCollapseAll }: SheetActionsMenuProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canEdit = userRole === 'editor' || userRole === 'admin' || userRole === 'owner';
  const canDelete = userRole === 'admin' || userRole === 'owner';

  const handleDuplicate = async () => {
    try {
      const result = await dispatch(duplicateSheet(sheetId)).unwrap();
      navigate(`/sheets/${result.id}`);
    } catch {
      // Error handled by slice
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteSheet(sheetId)).unwrap();
    } catch {
      // Error handled by slice
    }
  };

  const items = [];

  // viewer+ can open (unless already on the sheet page)
  if (!hideOpen) {
    items.push({
      label: 'Open',
      icon: <ExternalLink
        className="h-4 w-4"
        data-icod-id="src_features_sheets_components_sheetactionsmenu_tsx_244a" />,
      onClick: () => navigate(`/sheets/${sheetId}`),
    });
  }

  if (canEdit) {
    items.push({
      label: 'Edit details',
      icon: <Pencil
        className="h-4 w-4"
        data-icod-id="src_features_sheets_components_sheetactionsmenu_tsx_090a" />,
      onClick: () => setRenameOpen(true),
    });
    items.push({
      label: 'Duplicate',
      icon: <Copy
        className="h-4 w-4"
        data-icod-id="src_features_sheets_components_sheetactionsmenu_tsx_4648" />,
      onClick: handleDuplicate,
    });
    if (onExpandAll && onCollapseAll) {
      items.push(
        { type: 'divider' as const },
        {
          label: 'Expand all rows',
          icon: <ChevronDown
            className="h-4 w-4"
            data-icod-id="src_features_sheets_components_sheetactionsmenu_tsx_expand" />,
          onClick: onExpandAll,
        },
        {
          label: 'Collapse all rows',
          icon: <ChevronRight
            className="h-4 w-4"
            data-icod-id="src_features_sheets_components_sheetactionsmenu_tsx_collapse" />,
          onClick: onCollapseAll,
        },
      );
    }
  }

  if (canDelete) {
    items.push({ type: 'divider' as const });
    items.push({
      label: 'Delete',
      icon: <Trash2
        className="h-4 w-4"
        data-icod-id="src_features_sheets_components_sheetactionsmenu_tsx_1375" />,
      danger: true,
      onClick: () => setDeleteOpen(true),
    });
  }

  return (
    <>
      <DropdownMenu
        trigger={
          <IconButton
            size="sm"
            tooltip="Sheet actions"
            data-icod-id="src_features_sheets_components_sheetactionsmenu_tsx_e021">
            <MoreHorizontal
              className="h-4 w-4"
              data-icod-id="src_features_sheets_components_sheetactionsmenu_tsx_4328" />
          </IconButton>
        }
        items={items}
        data-icod-id="src_features_sheets_components_sheetactionsmenu_tsx_c44e" />
      <RenameSheetModal
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        sheetId={sheetId}
        currentName={sheetName}
        currentDescription={sheetDescription}
        data-icod-id="src_features_sheets_components_sheetactionsmenu_tsx_41e1" />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete sheet"
        description={`Are you sure you want to delete '${sheetName}'? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        data-icod-id="src_features_sheets_components_sheetactionsmenu_tsx_af21" />
    </>
  );
}
