import { useState } from 'react';
import { Modal, Field, Input, Textarea, Button, ColorPicker, WORKSPACE_COLORS } from '@/components/ui';
import { useAppDispatch } from '@/store/hooks';
import { updateWorkspace as updateWorkspaceThunk } from '@/store/slices/workspaceSlice';
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
  const { addToast } = useToast();
  const { handleActionError } = useWorkspaceAccessLost();

  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description || '');
  const [color, setColor] = useState<WorkspaceColor>(workspace.color);
  const [submitting, setSubmitting] = useState(false);

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

  // Reset form when modal opens with new workspace data
  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      setName(workspace.name);
      setDescription(workspace.description || '');
      setColor(workspace.color);
    } else {
      onClose();
    }
  }

  return (
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
      </form>
    </Modal>
  );
}
