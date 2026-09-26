import Modal from './Modal';
import Button from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

/** Confirmation dialog built on Modal. */
export default function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

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
    </Modal>
  );
}
