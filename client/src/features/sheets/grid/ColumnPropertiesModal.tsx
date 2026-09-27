import { useState, useEffect } from 'react';
import { Type, Hash, Calendar, List, CheckSquare, Users, Trash2, Plus } from 'lucide-react';
import { Modal, Button, Alert, Input, ColorPicker } from '@/components/ui';
import { cn } from '@/utils/cn';
import type { ColumnType, DropdownOption } from '@/types';

const COLUMN_TYPES: { type: ColumnType; label: string; description: string; icon: typeof Type }[] = [
  { type: 'text', label: 'Text', description: 'Free-form text values', icon: Type },
  { type: 'number', label: 'Number', description: 'Numeric values', icon: Hash },
  { type: 'date', label: 'Date', description: 'Calendar dates', icon: Calendar },
  { type: 'dropdown', label: 'Dropdown', description: 'Select from predefined options', icon: List },
  { type: 'checkbox', label: 'Checkbox', description: 'True/false toggle', icon: CheckSquare },
  { type: 'contact', label: 'Contact', description: 'Workspace member reference', icon: Users },
];

export interface ColumnPropertiesModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; type: ColumnType; options?: DropdownOption[] }) => void;
  initialName?: string;
  initialType?: ColumnType;
  initialOptions?: DropdownOption[];
  isPrimary?: boolean;
  existingCellCount?: number;
}

export default function ColumnPropertiesModal({
  open,
  onClose,
  onSave,
  initialName = '',
  initialType = 'text',
  initialOptions = [],
  isPrimary = false,
  existingCellCount = 0,
}: ColumnPropertiesModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ColumnType>('text');
  const [options, setOptions] = useState<DropdownOption[]>([]);

  // Reset local state when modal opens
  useEffect(() => {
    if (open) {
      setName(initialName);
      setType(isPrimary ? 'text' : initialType);
      setOptions(initialOptions.length > 0 ? [...initialOptions] : [{ label: '', color: 'gray' }]);
    }
  }, [open, initialName, initialType, initialOptions, isPrimary]);

  // Show warning when changing type with existing data
  const showTypeChangeWarning = existingCellCount > 0 && type !== initialType;

  // Option editing helpers
  const updateOption = (index: number, field: keyof DropdownOption, value: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
    setOptions(updated);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const addOption = () => {
    setOptions([...options, { label: '', color: 'gray' }]);
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return; // Name is required

    const validOptions = type === 'dropdown'
      ? options.filter((o) => o.label.trim() !== '')
      : undefined;

    onSave({
      name: trimmedName,
      type,
      options: validOptions,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Column properties"
      size="lg"
      footer={
        <div
          className="flex justify-end gap-2"
          data-icod-id="src_features_sheets_grid_columnpropertiesmodal_tsx_8c44">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            data-icod-id="src_features_sheets_grid_columnpropertiesmodal_tsx_3eed">Cancel</Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!name.trim()}
            data-icod-id="src_features_sheets_grid_columnpropertiesmodal_tsx_3936">Save</Button>
        </div>
      }
      data-icod-id="src_features_sheets_grid_columnpropertiesmodal_tsx_f816">
      <div
        className="flex flex-col gap-4"
        data-icod-id="src_features_sheets_grid_columnpropertiesmodal_tsx_ac44">
        {/* Name field */}
        <Input
          label="Column name"
          placeholder="Enter column name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          data-icod-id="src_features_sheets_grid_columnpropertiesmodal_tsx_e6c3" />

        {/* Type selector */}
        <div
          className="space-y-2"
          data-icod-id="src_features_sheets_grid_columnpropertiesmodal_tsx_f708">
          <label
            className="text-xs font-medium text-muted-foreground"
            data-icod-id="src_features_sheets_grid_columnpropertiesmodal_tsx_739c">Type</label>
          {isPrimary && (
            <p
              className="text-xs text-muted-foreground italic"
              data-icod-id="src_features_sheets_grid_columnpropertiesmodal_tsx_06d4">The primary column must be Text.</p>
          )}
          <div
            className="grid grid-cols-2 gap-2"
            data-icod-id="src_features_sheets_grid_columnpropertiesmodal_tsx_7a7e">
            {COLUMN_TYPES.map(({ type: t, label, description, icon: Icon }) => {
              const selected = type === t;
              const disabled = isPrimary && t !== 'text';
              return (
                <button
                  key={t}
                  type="button"
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                    'hover:bg-muted',
                    selected ? 'border-primary bg-accent' : 'border-border',
                    disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent',
                  )}
                  onClick={() => {
                    if (!disabled) setType(t);
                  }}
                  disabled={disabled}
                  data-icod-id={`src_features_sheets_grid_columnpropertiesmodal_tsx_c622_${t}`}>
                  <Icon
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                    data-icod-id={`src_features_sheets_grid_columnpropertiesmodal_tsx_f932_${t}`} />
                  <div
                    data-icod-id={`src_features_sheets_grid_columnpropertiesmodal_tsx_bdf6_${t}`}>
                    <div
                      className="text-sm font-medium text-foreground"
                      data-icod-id={`src_features_sheets_grid_columnpropertiesmodal_tsx_7a67_${t}`}>{label}</div>
                    <div
                      className="text-xs text-muted-foreground"
                      data-icod-id={`src_features_sheets_grid_columnpropertiesmodal_tsx_cd79_${t}`}>{description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Type-change warning */}
        {showTypeChangeWarning && (
          <Alert
            variant="warning"
            data-icod-id="src_features_sheets_grid_columnpropertiesmodal_tsx_0377">
            Changing to {COLUMN_TYPES.find((ct) => ct.type === type)?.label ?? type} will clear {existingCellCount} existing {existingCellCount !== 1 ? 'values' : 'value'}.
          </Alert>
        )}

        {/* Dropdown options section */}
        {type === 'dropdown' && (
          <div
            className="space-y-3"
            data-icod-id="src_features_sheets_grid_columnpropertiesmodal_tsx_db1c">
            <label
              className="text-xs font-medium text-muted-foreground"
              data-icod-id="src_features_sheets_grid_columnpropertiesmodal_tsx_9131">Dropdown options</label>
            <div
              className="flex flex-col gap-2"
              data-icod-id="src_features_sheets_grid_columnpropertiesmodal_tsx_1b6f">
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2"
                  data-icod-id={`src_features_sheets_grid_columnpropertiesmodal_tsx_de1c_${idx}`}>
                  <div
                    className="shrink-0"
                    data-icod-id={`src_features_sheets_grid_columnpropertiesmodal_tsx_474c_${idx}`}>
                    <ColorPicker
                      value={opt.color}
                      onChange={(color) => updateOption(idx, 'color', color)}
                      data-icod-id={`src_features_sheets_grid_columnpropertiesmodal_tsx_2760_${idx}`} />
                  </div>
                  <Input
                    className="flex-1"
                    placeholder="Option label"
                    value={opt.label}
                    onChange={(e) => updateOption(idx, 'label', e.target.value)}
                    data-icod-id={`src_features_sheets_grid_columnpropertiesmodal_tsx_0986_${idx}`} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(idx)}
                    aria-label="Remove option"
                    data-icod-id={`src_features_sheets_grid_columnpropertiesmodal_tsx_e6fe_${idx}`}>
                    <Trash2
                      className="h-3.5 w-3.5"
                      data-icod-id={`src_features_sheets_grid_columnpropertiesmodal_tsx_0c0f_${idx}`} />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={addOption}
              className="self-start"
              data-icod-id="src_features_sheets_grid_columnpropertiesmodal_tsx_1031">
              <Plus
                className="mr-1 h-3.5 w-3.5"
                data-icod-id="src_features_sheets_grid_columnpropertiesmodal_tsx_cef4" />
              Add option
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
