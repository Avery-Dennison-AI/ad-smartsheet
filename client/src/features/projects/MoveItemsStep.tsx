import { useState } from 'react';
import { Modal, Button, Select } from '@/components/ui';
import type { StatusEntry, ItemTypeEntry } from '@/types';

interface MoveItemsStepProps {
  open: boolean;
  type: 'status' | 'type';
  itemName: string;
  remainingStatuses?: StatusEntry[];
  remainingTypes?: ItemTypeEntry[];
  onConfirm: (replacementId: string) => void;
  onCancel: () => void;
}

/**
 * Confirmation step shown when removing a status or item type that is in use.
 * Shows count context and a Select for choosing the replacement target.
 */
export default function MoveItemsStep({
  open,
  type,
  itemName,
  remainingStatuses = [],
  remainingTypes = [],
  onConfirm,
  onCancel,
}: MoveItemsStepProps) {
  const [replacementId, setReplacementId] = useState('');

  // Reset when dialog opens with new item
  const handleOpenChange = () => {
    setReplacementId('');
  };

  // We reset replacementId via key-based remount from parent, but also on first render
  // The parent controls `open`, so we just manage local select state.

  return (
    <Modal
      open={open}
      onClose={() => {
        setReplacementId('');
        onCancel();
      }}
      title={`Remove "${itemName}"`}
      size="sm"
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setReplacementId('');
              onCancel();
            }}
            data-icod-id="move_items_cancel">
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={!replacementId}
            onClick={() => onConfirm(replacementId)}
            data-icod-id="move_items_confirm">
            Remove
          </Button>
        </>
      }
      data-icod-id="move_items_modal">
      <p className="text-muted-foreground" data-icod-id="move_items_desc">
        Items currently use this {type}. Choose where to move them:
      </p>
      <div className="mt-3" data-icod-id="move_items_select_wrap">
        <Select
          label={`Move to another ${type}`}
          value={replacementId}
          onChange={(e) => setReplacementId(e.target.value)}
          data-icod-id="move_items_select">
          <option value="" data-icod-id="move_items_placeholder">Select...</option>
          {type === 'status'
            ? remainingStatuses.map((s) => (
                <option key={s.id || s.name} value={s.id} data-icod-id={`move_items_opt_status_${s.id}`}>
                  {s.name}
                </option>
              ))
            : remainingTypes.map((t) => (
                <option key={t.id || t.name} value={t.id} data-icod-id={`move_items_opt_type_${t.id}`}>
                  {t.name}
                </option>
              ))}
        </Select>
      </div>
    </Modal>
  );
}
