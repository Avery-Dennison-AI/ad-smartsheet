import { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Modal, Button, Input, ColorPicker } from '@/components/ui';
import type { DropdownOption } from '@/types';

interface DropdownOptionsModalProps {
  open: boolean;
  onClose: () => void;
  options: DropdownOption[];
  onSave: (options: DropdownOption[]) => void;
}

export default function DropdownOptionsModal({
  open,
  onClose,
  options,
  onSave,
}: DropdownOptionsModalProps) {
  const [localOptions, setLocalOptions] = useState<DropdownOption[]>([]);

  useEffect(() => {
    if (open) {
      setLocalOptions(options.length > 0 ? [...options] : [{ label: '', color: 'gray' }]);
    }
  }, [open, options]);

  const updateOption = (index: number, field: keyof DropdownOption, value: string) => {
    const updated = [...localOptions];
    updated[index] = { ...updated[index], [field]: value };
    setLocalOptions(updated);
  };

  const removeOption = (index: number) => {
    setLocalOptions(localOptions.filter((_, i) => i !== index));
  };

  const addOption = () => {
    setLocalOptions([...localOptions, { label: '', color: 'gray' }]);
  };

  const handleSave = () => {
    // Filter out empty labels
    const valid = localOptions.filter((o) => o.label.trim() !== '');
    onSave(valid);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit dropdown options"
      footer={
        <div
          className="flex justify-end gap-2"
          data-icod-id="src_features_sheets_grid_dropdownoptionsmodal_tsx_85e7">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            data-icod-id="src_features_sheets_grid_dropdownoptionsmodal_tsx_0089">Cancel</Button>
          <Button
            size="sm"
            onClick={handleSave}
            data-icod-id="src_features_sheets_grid_dropdownoptionsmodal_tsx_ee2c">Save</Button>
        </div>
      }
      data-icod-id="src_features_sheets_grid_dropdownoptionsmodal_tsx_7fce">
      <div
        className="flex flex-col gap-3"
        data-icod-id="src_features_sheets_grid_dropdownoptionsmodal_tsx_af45">
        {localOptions.map((opt, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2"
            data-icod-id={`src_features_sheets_grid_dropdownoptionsmodal_tsx_c4c7_${idx}`}>
            <div
              className="shrink-0"
              data-icod-id={`src_features_sheets_grid_dropdownoptionsmodal_tsx_4b39_${idx}`}>
              <ColorPicker
                value={opt.color}
                onChange={(color) => updateOption(idx, 'color', color)}
                data-icod-id={`src_features_sheets_grid_dropdownoptionsmodal_tsx_c8fe_${idx}`} />
            </div>
            <Input
              className="flex-1"
              placeholder="Option label"
              value={opt.label}
              onChange={(e) => updateOption(idx, 'label', e.target.value)}
              data-icod-id={`src_features_sheets_grid_dropdownoptionsmodal_tsx_a719_${idx}`} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeOption(idx)}
              aria-label="Remove option"
              data-icod-id={`src_features_sheets_grid_dropdownoptionsmodal_tsx_c38b_${idx}`}>
              <Trash2
                className="h-3.5 w-3.5"
                data-icod-id={`src_features_sheets_grid_dropdownoptionsmodal_tsx_548d_${idx}`} />
            </Button>
          </div>
        ))}

        <Button
          variant="secondary"
          size="sm"
          onClick={addOption}
          className="self-start"
          data-icod-id="src_features_sheets_grid_dropdownoptionsmodal_tsx_285b">
          <Plus
            className="mr-1 h-3.5 w-3.5"
            data-icod-id="src_features_sheets_grid_dropdownoptionsmodal_tsx_9c61" />
          Add option
        </Button>
      </div>
    </Modal>
  );
}
