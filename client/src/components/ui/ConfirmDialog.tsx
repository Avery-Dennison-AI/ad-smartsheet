import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import Field from './Field';
import Input from './Input';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmText?: string;
  confirmInputLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

/** Confirmation dialog built on Modal. Supports optional type-to-confirm. */
export default function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmText,
  confirmInputLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState('');

  // Reset input every time the dialog opens
  useEffect(() => {
    if (open) {
      setTypedValue('');
    }
  }, [open]);

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const canConfirm = !confirmText || typedValue.trim() === confirmText;

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title={title}
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCancel}
            data-icod-id="src_components_ui_confirmdialog_tsx_bc56">
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={!canConfirm}
            data-icod-id="src_components_ui_confirmdialog_tsx_b401">
            {confirmLabel}
          </Button>
        </>
      }
      className="max-w-sm"
      data-icod-id="src_components_ui_confirmdialog_tsx_a2a6">
      <p
        className="text-muted-foreground"
        data-icod-id="src_components_ui_confirmdialog_tsx_764d">{description}</p>
      {confirmText && (
        <div className="mt-4" data-icod-id="src_components_ui_confirmdialog_tsx_typeconfirm">
          <Field
            label={confirmInputLabel || `Type "${confirmText}" to confirm`}
            htmlFor="confirm-dialog-input"
            data-icod-id="src_components_ui_confirmdialog_tsx_field">
            <Input
              id="confirm-dialog-input"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={confirmText}
              autoFocus
              data-icod-id="src_components_ui_confirmdialog_tsx_input" />
          </Field>
        </div>
      )}
    </Modal>
  );
}
