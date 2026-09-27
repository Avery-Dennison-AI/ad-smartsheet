import { useState, useEffect } from 'react';
import { Modal, Button, Field, Input, Alert, Textarea } from '@/components/ui';
import { useAppDispatch } from '@/store/hooks';
import { renameSheet } from '@/store/slices/sheetsSlice';

interface RenameSheetModalProps {
  open: boolean;
  onClose: () => void;
  sheetId: string;
  currentName: string;
  currentDescription?: string;
}

export default function RenameSheetModal({ open, onClose, sheetId, currentName, currentDescription }: RenameSheetModalProps) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset values when modal opens
  useEffect(() => {
    if (open) {
      setName(currentName);
      setDescription(currentDescription || '');
      setError(null);
    }
  }, [open, currentName, currentDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Sheet name is required.');
      return;
    }
    if (trimmedName.length > 100) {
      setError('Name must be at most 100 characters.');
      return;
    }

    const trimmedDesc = description.trim();
    if (trimmedDesc.length > 300) {
      setError('Description must be at most 300 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(renameSheet({
        sheetId,
        name: trimmedName,
        description: trimmedDesc || undefined,
      })).unwrap();
      handleClose();
    } catch (err: unknown) {
      const msg = err as { message?: string } | string;
      setError(typeof msg === 'string' ? msg : msg?.message || 'Failed to update sheet details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const hasChanges =
    name.trim() !== currentName ||
    description.trim() !== (currentDescription || '');

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Edit details"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClose}
            data-icod-id="src_features_sheets_components_renamesheetmodal_tsx_da93">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
            loading={submitting}
            disabled={!hasChanges}
            data-icod-id="src_features_sheets_components_renamesheetmodal_tsx_c78b">
            Save
          </Button>
        </>
      }
      className="max-w-sm"
      data-icod-id="src_features_sheets_components_renamesheetmodal_tsx_1924">
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        data-icod-id="src_features_sheets_components_renamesheetmodal_tsx_1097">
        {error && <Alert
          variant="error"
          data-icod-id="src_features_sheets_components_renamesheetmodal_tsx_ffe3">{error}</Alert>}
        <Field
          label="Sheet name"
          htmlFor="rename-sheet-name"
          required
          error={undefined}
          data-icod-id="src_features_sheets_components_renamesheetmodal_tsx_fe3d">
          <Input
            id="rename-sheet-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            autoFocus
            data-icod-id="src_features_sheets_components_renamesheetmodal_tsx_91fc" />
        </Field>
        <Field
          label="Description"
          htmlFor="edit-sheet-description"
          hint={`${description.length}/300`}
          error={undefined}
          data-icod-id="src_features_sheets_components_renamesheetmodal_tsx_desc_field">
          <Textarea
            id="edit-sheet-description"
            className="resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="Add a description..."
            data-icod-id="src_features_sheets_components_renamesheetmodal_tsx_desc_input" />
        </Field>
      </form>
    </Modal>
  );
}
