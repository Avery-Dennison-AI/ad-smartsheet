import { useCallback, useRef, useState } from 'react';
import { Input, Checkbox, Select } from '@/components/ui';
import CalendarDatePicker from '@/components/ui/CalendarDatePicker';
import ContactCellDisplay from '@/features/sheets/grid/displays/ContactCellDisplay';
import FloatingCellList, { type FloatingCellListItem } from '@/features/sheets/grid/FloatingCellList';
import ContactCellEditor from '@/features/sheets/grid/editors/ContactCellEditor';
import { Avatar } from '@/components/ui';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Column, GridRow as GridRowType } from '@/types';

interface GridMember {
  id: string;
  fullName: string;
  email: string;
}

interface PanelFieldsProps {
  row: GridRowType;
  columns: Column[];
  primaryCol?: Column;
  isViewer: boolean;
  onCellChange: (columnId: string, value: unknown) => void;
  sheetKind?: 'sheet' | 'project';
  workspaceMembers?: GridMember[];
}

/** Inline contact picker for the detail panel — adapted from ContactCellEditOverlay. */
function PanelContactPicker({
  value,
  workspaceMembers,
  onSelect,
}: {
  value: string | number | boolean | null;
  workspaceMembers?: GridMember[];
  onSelect: (memberId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const anchorRef = useRef<HTMLButtonElement>(null);
  const committedRef = useRef(false);

  const filteredMembers = workspaceMembers?.filter(
    (m) =>
      !query ||
      m.fullName.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase()),
  ) ?? [];

  const listItems: FloatingCellListItem<GridMember>[] = filteredMembers.map((m) => ({
    id: m.id,
    data: m,
  }));

  const handleSelect = (item: FloatingCellListItem<GridMember>) => {
    if (!committedRef.current) {
      committedRef.current = true;
      onSelect(item.data.id);
      setOpen(false);
      setQuery('');
    }
  };

  const selectedMember = workspaceMembers?.find((m) => m.id === String(value));

  return (
    <div className="relative" data-icod-id="src_features_itemdetail_panelfields_tsx_contact_picker">
      <button
        ref={anchorRef}
        type="button"
        className={cn(
          'flex w-full items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground',
          'hover:bg-muted transition-colors',
        )}
        onClick={() => {
          committedRef.current = false;
          setOpen((prev) => !prev);
        }}
        data-icod-id="src_features_itemdetail_panelfields_tsx_contact_trigger"
      >
        {selectedMember ? (
          <>
            <Avatar
              name={selectedMember.fullName}
              size="sm"
              className="!h-5 !w-5"
              data-icod-id="src_features_itemdetail_panelfields_tsx_4c48" />
            <span
              className="truncate"
              data-icod-id="src_features_itemdetail_panelfields_tsx_2db6">{selectedMember.fullName}</span>
          </>
        ) : (
          <span
            className="text-muted-foreground"
            data-icod-id="src_features_itemdetail_panelfields_tsx_cf62">Unassigned</span>
        )}
      </button>
      {open && (
        <FloatingCellList
          anchorRef={anchorRef}
          open={open}
          onClose={() => {
            setOpen(false);
            setQuery('');
          }}
          items={listItems}
          minWidth={220}
          renderItem={(item, _idx, isFocused) => (
            <div
              className={cn('flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs', isFocused && 'bg-muted')}
              data-icod-id="src_features_itemdetail_panelfields_tsx_contact_item"
            >
              <Avatar
                name={item.data.fullName}
                size="sm"
                className="!h-5 !w-5"
                data-icod-id="src_features_itemdetail_panelfields_tsx_605f" />
              <div
                className="min-w-0 flex-1"
                data-icod-id="src_features_itemdetail_panelfields_tsx_12df">
                <div
                  className="truncate font-medium"
                  data-icod-id="src_features_itemdetail_panelfields_tsx_fe1d">{item.data.fullName}</div>
                <div
                  className="truncate text-muted-foreground"
                  data-icod-id="src_features_itemdetail_panelfields_tsx_c4a8">{item.data.email}</div>
              </div>
            </div>
          )}
          onSelect={handleSelect}
          header={
            <ContactCellEditor
              query={query}
              onQueryChange={(v) => setQuery(v)}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  if (filteredMembers.length > 0) {
                    onSelect(filteredMembers[0].id);
                  }
                  setOpen(false);
                  setQuery('');
                }
              }}
              data-icod-id="src_features_itemdetail_panelfields_tsx_43db" />
          }
          footer={
            value != null && value !== '' ? (
              <div
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(null);
                  setOpen(false);
                  setQuery('');
                }}
                data-icod-id="src_features_itemdetail_panelfields_tsx_contact_clear"
              >
                <X
                  className="h-3 w-3 text-muted-foreground"
                  data-icod-id="src_features_itemdetail_panelfields_tsx_8f21" />
                <span
                  className="text-muted-foreground"
                  data-icod-id="src_features_itemdetail_panelfields_tsx_0aa1">Clear</span>
              </div>
            ) : undefined
          }
          maxHeight={220}
          data-icod-id="src_features_itemdetail_panelfields_tsx_2d6d" />
      )}
    </div>
  );
}

/** Inline date picker button for the detail panel — adapted from DateCellEditor. */
function PanelDatePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (dateVal: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const formattedDate = value
    ? (() => {
        try {
          const d = new Date(value);
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
          return value;
        }
      })()
    : null;

  return (
    <div className="relative" data-icod-id="src_features_itemdetail_panelfields_tsx_date_picker">
      <button
        ref={anchorRef}
        type="button"
        className={cn(
          'flex w-full items-center rounded-md border border-border bg-background px-3 py-1.5 text-sm',
          formattedDate ? 'text-foreground' : 'text-muted-foreground',
          'hover:bg-muted transition-colors',
        )}
        onClick={() => setOpen((prev) => !prev)}
        data-icod-id="src_features_itemdetail_panelfields_tsx_date_trigger"
      >
        {formattedDate || 'Pick a date'}
      </button>
      {open && (
        <CalendarDatePicker
          value={value}
          onChange={(dateVal) => {
            onChange(dateVal);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
          anchorRef={anchorRef}
          data-icod-id="src_features_itemdetail_panelfields_tsx_9188" />
      )}
    </div>
  );
}

export default function PanelFields({
  row,
  columns,
  primaryCol,
  isViewer,
  onCellChange,
  sheetKind,
  workspaceMembers,
}: PanelFieldsProps) {
  // Filter out primary column and sort: system fields first for projects
  const fields = columns
    .filter((c) => !c.isPrimary)
    .sort((a, b) => {
      if (sheetKind === 'project') {
        const aSys = a.systemField ? 0 : 1;
        const bSys = b.systemField ? 0 : 1;
        if (aSys !== bSys) return aSys - bSys;
      }
      return a.order - b.order;
    });

  const renderFieldEditor = (col: Column) => {
    const value = row.cells[col.id];

    // Key field is read-only
    if (col.systemField === 'key') {
      return (
        <span className="text-sm text-muted-foreground" data-icod-id={`src_features_itemdetail_panelfields_tsx_key_${col.id}`}>
          {value != null ? String(value) : ''}
        </span>
      );
    }

    // Contact fields: display mode for viewers, picker for editors
    if (col.type === 'contact') {
      if (isViewer) {
        return (
          <ContactCellDisplay
            value={value}
            workspaceMembers={workspaceMembers}
            data-icod-id="src_features_itemdetail_panelfields_tsx_4ce3" />
        );
      }
      return (
        <PanelContactPicker
          value={value}
          workspaceMembers={workspaceMembers}
          onSelect={(memberId) => onCellChange(col.id, memberId ?? null)}
          data-icod-id="src_features_itemdetail_panelfields_tsx_9d2d" />
      );
    }

    // Date fields: read-only text for viewers, calendar picker for editors
    if (col.type === 'date') {
      if (isViewer) {
        const displayVal = value != null ? (() => {
          try {
            const d = new Date(String(value));
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          } catch {
            return String(value);
          }
        })() : '—';
        return (
          <span className="text-sm text-foreground" data-icod-id={`src_features_itemdetail_panelfields_tsx_date_readonly_${col.id}`}>
            {displayVal}
          </span>
        );
      }
      return (
        <PanelDatePicker
          value={value != null ? String(value) : null}
          onChange={(dateVal) => onCellChange(col.id, dateVal || null)}
          data-icod-id="src_features_itemdetail_panelfields_tsx_cc55" />
      );
    }

    // All other types: read-only display for viewers
    if (isViewer) {
      return (
        <span className="text-sm text-foreground" data-icod-id={`src_features_itemdetail_panelfields_tsx_readonly_${col.id}`}>
          {value != null ? String(value) : '—'}
        </span>
      );
    }

    switch (col.type) {
      case 'text':
      case 'number':
        return (
          <Input
            type={col.type === 'number' ? 'number' : 'text'}
            value={value != null ? String(value) : ''}
            onChange={(e) => onCellChange(col.id, col.type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
            placeholder="—"
            data-icod-id={`src_features_itemdetail_panelfields_tsx_input_${col.id}`} />
        );
      case 'dropdown': {
        return (
          <Select
            value={value != null ? String(value) : ''}
            onChange={(e) => onCellChange(col.id, e.target.value || null)}
            data-icod-id={`src_features_itemdetail_panelfields_tsx_select_${col.id}`}>
            <option value="" data-icod-id="src_features_itemdetail_panelfields_tsx_0cde">—</option>
            {col.options?.map((o) => (
              <option
                key={o.label}
                value={o.label}
                data-icod-id="src_features_itemdetail_panelfields_tsx_2df0">{o.label}</option>
            ))}
          </Select>
        );
      }
      case 'checkbox':
        return (
          <Checkbox
            checked={!!value}
            onChange={(checked) => onCellChange(col.id, checked)}
            data-icod-id={`src_features_itemdetail_panelfields_tsx_checkbox_${col.id}`} />
        );
      default:
        return (
          <Input
            type="text"
            value={value != null ? String(value) : ''}
            onChange={(e) => onCellChange(col.id, e.target.value || null)}
            placeholder="—"
            data-icod-id={`src_features_itemdetail_panelfields_tsx_default_${col.id}`} />
        );
    }
  };

  return (
    <div className="p-4" data-icod-id="src_features_itemdetail_panelfields_tsx_container">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-icod-id="src_features_itemdetail_panelfields_tsx_grid">
        {fields.map((col) => (
          <div key={col.id} className="flex flex-col gap-1.5" data-icod-id={`src_features_itemdetail_panelfields_tsx_field_${col.id}`}>
            <label className="text-xs font-medium text-muted-foreground" data-icod-id={`src_features_itemdetail_panelfields_tsx_label_${col.id}`}>
              {col.name}
            </label>
            {renderFieldEditor(col)}
          </div>
        ))}
      </div>
    </div>
  );
}
