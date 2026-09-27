import { useState, useEffect } from 'react';
import { Modal, Button, Field, Input, Alert } from '@/components/ui';
import { useAppDispatch } from '@/store/hooks';
import { renameSheet } from '@/store/slices/sheetsSlice';

interface RenameSheetModalProps {
  open: boolean;
  onClose: () => void;
  sheetId: string;
  currentName: string;
}

export default function RenameSheetModal({ open, onClose, sheetId, currentName }: RenameSheetModalProps) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset name when modal opens
  useEffect(() => {
    if (open) {
      setName(currentName);
      setError(null);
    }
  }, [open, currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError('Sheet name is required.');
      return;
    }
    if (trimmed.length > 100) {
      setError('Name must be at most 100 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(renameSheet({ sheetId, name: trimmed })).unwrap();
      handleClose();
    } catch (err: unknown) {
      const msg = err as { message?: string } | string;
      setError(typeof msg === 'string' ? msg : msg?.message || 'Failed to rename sheet.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Rename sheet"
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
            disabled={!name.trim() || name.trim() === currentName}
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
      </form>
    </Modal>
  );
}
