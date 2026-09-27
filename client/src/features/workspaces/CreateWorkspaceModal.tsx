import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Field, Input, Textarea, Button, ColorPicker, WORKSPACE_COLORS } from '@/components/ui';
import { useAppDispatch } from '@/store/hooks';
import { createWorkspace as createWorkspaceThunk } from '@/store/slices/workspaceSlice';

interface CreateWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateWorkspaceModal({ open, onClose }: CreateWorkspaceModalProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string>(WORKSPACE_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const result = await dispatch(
        createWorkspaceThunk({ name: name.trim(), description: description.trim() || undefined, color }),
      ).unwrap();
      onClose();
      resetForm();
      navigate(`/workspaces/${result._id}`);
    } catch {
      // Error handled by slice
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setName('');
    setDescription('');
    setColor(WORKSPACE_COLORS[0]);
  }

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); resetForm(); }}
      title="Create workspace"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { onClose(); resetForm(); }}
            data-icod-id="src_features_workspaces_createworkspacemodal_tsx_cf43">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!name.trim()}
            data-icod-id="src_features_workspaces_createworkspacemodal_tsx_afc6">
            Create
          </Button>
        </>
      }
      data-icod-id="src_features_workspaces_createworkspacemodal_tsx_2b43">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
        data-icod-id="src_features_workspaces_createworkspacemodal_tsx_b1a7">
        <Field
          label="Name"
          required
          htmlFor="ws-name"
          data-icod-id="src_features_workspaces_createworkspacemodal_tsx_b9fd">
          <Input
            id="ws-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="My Workspace"
            autoFocus
            data-icod-id="src_features_workspaces_createworkspacemodal_tsx_60aa" />
          <span
            className="text-2xs text-muted-foreground"
            data-icod-id="src_features_workspaces_createworkspacemodal_tsx_380e">{name.length}/60</span>
        </Field>

        <Field
          label="Description"
          htmlFor="ws-desc"
          data-icod-id="src_features_workspaces_createworkspacemodal_tsx_b415">
          <Textarea
            id="ws-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            placeholder="What's this workspace for?"
            rows={3}
            data-icod-id="src_features_workspaces_createworkspacemodal_tsx_f341" />
          <span
            className="text-2xs text-muted-foreground"
            data-icod-id="src_features_workspaces_createworkspacemodal_tsx_0d3e">{description.length}/300</span>
        </Field>

        <Field
          label="Color"
          data-icod-id="src_features_workspaces_createworkspacemodal_tsx_8b75">
          <ColorPicker
            value={color}
            onChange={setColor}
            data-icod-id="src_features_workspaces_createworkspacemodal_tsx_f4f9" />
        </Field>
      </form>
    </Modal>
  );
}
