import { Input, Checkbox, Select, ContactField, DateField } from '@/components/ui';
import ContactCellDisplay from '@/features/sheets/grid/displays/ContactCellDisplay';
import type { Column, GridRow as GridRowType } from '@/types';
import type { WorkspaceMember } from '@/components/ui/ContactField';

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
        <ContactField
          value={value != null ? String(value) : null}
          workspaceMembers={(workspaceMembers ?? []) as WorkspaceMember[]}
          onSelect={(memberId: string | null) => onCellChange(col.id, memberId ?? null)}
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
        <DateField
          value={value != null ? String(value) : null}
          onChange={(dateVal: string | null) => onCellChange(col.id, dateVal || null)}
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
