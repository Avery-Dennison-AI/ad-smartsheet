import { ConfirmDialog, useToast } from '@/components/ui';
import { useAppDispatch } from '@/store/hooks';
import { deleteWorkspace as deleteWorkspaceThunk } from '@/store/slices/workspaceSlice';
import { useWorkspaceAccessLost } from '@/hooks/useWorkspaceAccessLost';
import type { Workspace } from '@/types';

interface DeleteWorkspaceDialogProps {
  open: boolean;
  workspace: Workspace;
  onClose: () => void;
}

export default function DeleteWorkspaceDialog({ open, workspace, onClose }: DeleteWorkspaceDialogProps) {
  const dispatch = useAppDispatch();
  const { addToast } = useToast();
  const { handleAccessLost, handleActionError } = useWorkspaceAccessLost();

  async function handleConfirm() {
    try {
      await dispatch(deleteWorkspaceThunk(workspace.id)).unwrap();
      addToast('success', 'Workspace deleted');
      handleAccessLost();
    } catch (err) {
      handleActionError(err);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title="Delete workspace?"
      description="This will permanently delete the workspace and all its contents. This action cannot be undone."
      confirmText={workspace.name}
      confirmInputLabel={`Type "${workspace.name}" to confirm`}
      confirmLabel="Delete workspace"
      onConfirm={handleConfirm}
      data-icod-id="src_features_workspaces_deleteworkspacedialog_tsx_a4c5" />
  );
}
