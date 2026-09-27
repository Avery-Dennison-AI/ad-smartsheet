import { Type, Hash, Calendar, List, CheckSquare, Users } from 'lucide-react';
import { Modal, Button, Alert } from '@/components/ui';
import { cn } from '@/utils/cn';
import type { ColumnType } from '@/types';

const COLUMN_TYPES: { type: ColumnType; label: string; description: string; icon: typeof Type }[] = [
  { type: 'text', label: 'Text', description: 'Free-form text values', icon: Type },
  { type: 'number', label: 'Number', description: 'Numeric values', icon: Hash },
  { type: 'date', label: 'Date', description: 'Calendar dates', icon: Calendar },
  { type: 'dropdown', label: 'Dropdown', description: 'Select from predefined options', icon: List },
  { type: 'checkbox', label: 'Checkbox', description: 'True/false toggle', icon: CheckSquare },
  { type: 'contact', label: 'Contact', description: 'Workspace member reference', icon: Users },
];

interface ColumnTypeModalProps {
  open: boolean;
  onClose: () => void;
  currentType: ColumnType;
  cellCount?: number;
  onSelect: (type: ColumnType) => void;
}

export default function ColumnTypeModal({
  open,
  onClose,
  currentType,
  cellCount = 0,
  onSelect,
}: ColumnTypeModalProps) {
  const incompatibleChange = currentType !== 'text' && cellCount > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change column type"
      data-icod-id="src_features_sheets_grid_columntypemodal_tsx_3a5c">
      <div
        className="flex flex-col gap-2"
        data-icod-id="src_features_sheets_grid_columntypemodal_tsx_6cec">
        {incompatibleChange && (
          <Alert
            variant="warning"
            data-icod-id="src_features_sheets_grid_columntypemodal_tsx_2a84">
            {cellCount} cell{cellCount !== 1 ? 's have' : ' has'} values that cannot be converted and will be cleared.
          </Alert>
        )}

        <div
          className="grid grid-cols-2 gap-2"
          data-icod-id="src_features_sheets_grid_columntypemodal_tsx_fc39">
          {COLUMN_TYPES.map(({ type, label, description, icon: Icon }) => (
            <button
              key={type}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                'hover:bg-muted',
                currentType === type
                  ? 'border-primary bg-accent'
                  : 'border-border',
              )}
              onClick={() => {
                if (type !== currentType) {
                  onSelect(type);
                }
                onClose();
              }}
              data-icod-id={`src_features_sheets_grid_columntypemodal_tsx_87f5_${type}`}>
              <Icon
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                data-icod-id={`src_features_sheets_grid_columntypemodal_tsx_c79f_${type}`} />
              <div
                data-icod-id={`src_features_sheets_grid_columntypemodal_tsx_402c_${type}`}>
                <div
                  className="text-sm font-medium text-foreground"
                  data-icod-id={`src_features_sheets_grid_columntypemodal_tsx_e875_${type}`}>{label}</div>
                <div
                  className="text-xs text-muted-foreground"
                  data-icod-id={`src_features_sheets_grid_columntypemodal_tsx_1c4b_${type}`}>{description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
