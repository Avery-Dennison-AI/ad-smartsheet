import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Field, Input, Textarea, Button, ColorPicker, ConfirmDialog, Alert, WORKSPACE_COLORS } from '@/components/ui';
import { useAppDispatch } from '@/store/hooks';
import { updateWorkspace as updateWorkspaceThunk, deleteWorkspace as deleteWorkspaceThunk } from '@/store/slices/workspaceSlice';
import { useToast } from '@/components/ui';
import { useWorkspaceAccessLost } from '@/hooks/useWorkspaceAccessLost';
import type { Workspace, WorkspaceColor } from '@/types';

interface WorkspaceSettingsModalProps {
  open: boolean;
  onClose: () => void;
  workspace: Workspace;
}

export default function WorkspaceSettingsModal({ open, onClose, workspace }: WorkspaceSettingsModalProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { handleActionError } = useWorkspaceAccessLost();

  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description || '');
  const [color, setColor] = useState<WorkspaceColor>(workspace.color);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteNameInput, setDeleteNameInput] = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await dispatch(
        updateWorkspaceThunk({
          id: workspace.id,
          data: { name: name.trim(), description: description.trim() || undefined, color },
        }),
      ).unwrap();
      addToast('success', 'Workspace settings updated');
      onClose();
    } catch (err) {
      handleActionError(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    try {
      await dispatch(deleteWorkspaceThunk(workspace.id)).unwrap();
      addToast('success', 'Workspace deleted');
      setDeleteConfirmOpen(false);
      onClose();
      navigate('/home');
    } catch (err) {
      handleActionError(err);
    }
  }

  // Reset form when modal opens with new workspace data
  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      setName(workspace.name);
      setDescription(workspace.description || '');
      setColor(workspace.color);
      setDeleteNameInput('');
    } else {
      onClose();
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={() => handleOpenChange(false)}
        title="Workspace settings"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenChange(false)}
              data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_b4f2">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              loading={submitting}
              disabled={!name.trim()}
              data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_1706">
              Save changes
            </Button>
          </>
        }
        data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_a8b9">
        <form
          onSubmit={handleSave}
          className="flex flex-col gap-4"
          data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_15d0">
          <Field
            label="Name"
            required
            htmlFor="ws-settings-name"
            data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_9423">
            <Input
              id="ws-settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              autoFocus
              data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_6fd9" />
            <span
              className="text-2xs text-muted-foreground"
              data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_f938">{name.length}/60</span>
          </Field>

          <Field
            label="Description"
            htmlFor="ws-settings-desc"
            data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_476d">
            <Textarea
              id="ws-settings-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              rows={3}
              data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_4674" />
            <span
              className="text-2xs text-muted-foreground"
              data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_40f8">{description.length}/300</span>
          </Field>

          <Field
            label="Color"
            data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_a106">
            <ColorPicker
              value={color}
              onChange={setColor}
              colors={WORKSPACE_COLORS}
              data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_f6a2" />
          </Field>

          {/* Danger zone — owner only */}
          <div
            className="mt-4 border-t border-border pt-4"
            data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_ce0b">
            <h3
              className="mb-2 text-sm font-medium text-destructive"
              data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_3d83">Danger zone</h3>
            <p
              className="mb-3 text-xs text-muted-foreground"
              data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_534c">
              Deleting a workspace is permanent and cannot be undone.
            </p>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
              data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_dc7c">
              Delete workspace
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setDeleteNameInput(''); }}
        title="Delete workspace"
        className="max-w-sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setDeleteConfirmOpen(false); setDeleteNameInput(''); }}
              data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_be45">
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={deleteNameInput !== workspace.name}
              data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_0aa6">
              Delete permanently
            </Button>
          </>
        }
        data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_0a28">
        <Alert
          variant="error"
          data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_cfaf">
          This action cannot be undone. All sheets and data in this workspace will be permanently deleted.
        </Alert>
        <div
          className="mt-4"
          data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_23bc">
          <label
            className="mb-1 block text-sm text-muted-foreground"
            data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_67ef">
            Type <strong data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_686e">{workspace.name}</strong> to confirm:
          </label>
          <Input
            value={deleteNameInput}
            onChange={(e) => setDeleteNameInput(e.target.value)}
            placeholder={workspace.name}
            data-icod-id="src_features_workspaces_workspacesettingsmodal_tsx_d23e" />
        </div>
      </Modal>
    </>
  );
}
