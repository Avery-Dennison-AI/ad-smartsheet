import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { Pill } from '@/components/ui';
import { cn } from '@/utils/cn';
import FloatingCellList, { type FloatingCellListItem } from './FloatingCellList';
import DropdownCellEditor from './editors/DropdownCellEditor';
import type { DropdownOption } from '@/types';

interface DropdownCellEditOverlayProps {
  cellRef: React.RefObject<HTMLDivElement | null>;
  value: string | number | boolean | null;
  options?: DropdownOption[];
  readOnly: boolean;
  onCommit: (value: unknown) => void;
  onStopEdit: () => void;
  onAddDropdownOption?: (columnId: string, label: string) => void;
  columnId: string;
  committedRef: React.MutableRefObject<boolean>;
}

export default function DropdownCellEditOverlay({
  cellRef,
  value,
  options,
  readOnly,
  onCommit,
  onStopEdit,
  onAddDropdownOption,
  columnId,
  committedRef,
}: DropdownCellEditOverlayProps) {
  const [dropdownSearch, setDropdownSearch] = useState('');

  const filteredOptions = options?.filter(
    (opt) => !dropdownSearch || opt.label.toLowerCase().includes(dropdownSearch.toLowerCase()),
  ) ?? [];
  const searchHasExactMatch = filteredOptions.some(
    (opt) => opt.label.toLowerCase() === dropdownSearch.trim().toLowerCase(),
  );
  const showAddOption = !readOnly && dropdownSearch.trim() !== '' && !searchHasExactMatch && onAddDropdownOption;

  const listItems: FloatingCellListItem<{ label: string; color: string }>[] = filteredOptions.map((opt) => ({
    id: opt.label,
    data: opt,
  }));

  const handleSelectItem = (item: FloatingCellListItem<{ label: string; color: string }>) => {
    if (!committedRef.current) {
      committedRef.current = true;
      onCommit(item.data.label);
      onStopEdit();
    }
  };

  return (
    <div
      className="relative h-full w-full flex items-center px-1"
      data-icod-id="src_features_sheets_grid_dropdowncelleditoverlay_tsx_ccf6">
      <span
        className="truncate text-sm text-muted-foreground/60"
        data-icod-id="src_features_sheets_grid_dropdowncelleditoverlay_tsx_acdf">
        {value != null && value !== '' ? String(value) : 'Select...'}
      </span>
      <FloatingCellList
        anchorRef={cellRef}
        additionalCloseTarget={cellRef}
        open={true}
        onClose={() => {
          if (!committedRef.current) {
            committedRef.current = true;
            onStopEdit();
          }
        }}
        items={listItems}
        renderItem={(item, _idx, isFocused) => (
          <div
            className={cn('flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs', isFocused && 'bg-muted')}
            data-icod-id="src_features_sheets_grid_dropdowncelleditoverlay_tsx_fc09">
            <Pill
              label={item.data.label}
              color={item.data.color}
              data-icod-id="src_features_sheets_grid_dropdowncelleditoverlay_tsx_35b1" />
          </div>
        )}
        onSelect={handleSelectItem}
        header={
          <DropdownCellEditor
            search={dropdownSearch}
            onSearchChange={(v) => setDropdownSearch(v)}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                if (filteredOptions.length > 0 && !committedRef.current) {
                  committedRef.current = true;
                  onCommit(filteredOptions[0].label);
                }
                onStopEdit();
              }
            }}
            data-icod-id="src_features_sheets_grid_dropdowncelleditoverlay_tsx_6694" />
        }
        footer={
          <>
            {value != null && value !== '' && (
              <div
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (!committedRef.current) {
                    committedRef.current = true;
                    onCommit(null);
                    onStopEdit();
                  }
                }}
                data-icod-id="src_features_sheets_grid_dropdowncelleditoverlay_tsx_1d87">
                <X
                  className="h-3 w-3 text-muted-foreground"
                  data-icod-id="src_features_sheets_grid_dropdowncelleditoverlay_tsx_034c" />
                <span
                  className="text-muted-foreground"
                  data-icod-id="src_features_sheets_grid_dropdowncelleditoverlay_tsx_e443">Clear</span>
              </div>
            )}
            {showAddOption && (
              <div
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-primary hover:bg-muted cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (!committedRef.current) {
                    committedRef.current = true;
                    onAddDropdownOption(columnId, dropdownSearch.trim());
                    onCommit(dropdownSearch.trim());
                    onStopEdit();
                  }
                }}
                data-icod-id="src_features_sheets_grid_dropdowncelleditoverlay_tsx_4ebf">
                Add &quot;{dropdownSearch.trim()}&quot; as option
              </div>
            )}
          </>
        }
        maxHeight={192}
        data-icod-id="src_features_sheets_grid_dropdowncelleditoverlay_tsx_8018" />
    </div>
  );
}
