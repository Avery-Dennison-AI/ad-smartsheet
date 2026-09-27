import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Field, Input, Alert } from '@/components/ui';
import { useAppDispatch } from '@/store/hooks';
import { createSheet } from '@/store/slices/sheetsSlice';

interface CreateSheetModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
}

export default function CreateSheetModal({ open, onClose, workspaceId }: CreateSheetModalProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      const result = await dispatch(createSheet({ workspaceId, name: trimmed })).unwrap();
      onClose();
      setName('');
      navigate(`/sheets/${result.id}`);
    } catch (err: unknown) {
      const msg = err as { message?: string } | string;
      setError(typeof msg === 'string' ? msg : msg?.message || 'Failed to create sheet.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create new sheet"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClose}
            data-icod-id="src_features_sheets_components_createsheetmodal_tsx_5367">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
            loading={submitting}
            disabled={!name.trim()}
            data-icod-id="src_features_sheets_components_createsheetmodal_tsx_10ea">
            Create
          </Button>
        </>
      }
      className="max-w-sm"
      data-icod-id="src_features_sheets_components_createsheetmodal_tsx_689b">
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        data-icod-id="src_features_sheets_components_createsheetmodal_tsx_83b0">
        {error && <Alert
          variant="error"
          data-icod-id="src_features_sheets_components_createsheetmodal_tsx_915c">{error}</Alert>}
        <Field
          label="Sheet name"
          htmlFor="sheet-name"
          required
          error={undefined}
          data-icod-id="src_features_sheets_components_createsheetmodal_tsx_c4fc">
          <Input
            id="sheet-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Untitled sheet"
            maxLength={100}
            autoFocus
            data-icod-id="src_features_sheets_components_createsheetmodal_tsx_31a7" />
        </Field>
      </form>
    </Modal>
  );
}
