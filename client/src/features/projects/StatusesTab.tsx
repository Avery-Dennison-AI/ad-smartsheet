import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Select, SortableList, ColorSwatchPicker } from '@/components/ui';
import type { StatusEntry, ProjectUsage } from '@/types';

const CATEGORY_OPTIONS = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
] as const;

interface StatusesTabProps {
  statuses: StatusEntry[];
  usage: ProjectUsage;
  validationErrors: Record<string, string>;
  onUpdateStatus: (index: number, patch: Partial<StatusEntry>) => void;
  onAddStatus: () => void;
  onRequestRemoveStatus: (index: number) => void;
  onReorder: (statuses: StatusEntry[]) => void;
}

export default function StatusesTab({
  statuses,
  usage,
  validationErrors,
  onUpdateStatus,
  onAddStatus,
  onRequestRemoveStatus,
  onReorder,
}: StatusesTabProps) {
  const [colorPickerAnchor, setColorPickerAnchor] = useState<{
    ref: React.RefObject<HTMLElement | null>;
    index: number;
  } | null>(null);

  return (
    <>
      <div className="flex flex-col gap-1" data-icod-id="statuses_tab_root">
        <SortableList
          items={statuses}
          onReorder={onReorder}
          keyExtractor={(s) => s.id || `new-status-${s.name}`}
          renderItem={(status, index, dragHandleProps) => {
            const todoCount = statuses.filter((s) => s.category === 'todo').length;
            const doneCount = statuses.filter((s) => s.category === 'done').length;
            const canRemove =
              !(status.category === 'todo' && todoCount <= 1) &&
              !(status.category === 'done' && doneCount <= 1) &&
              statuses.length > 1;
            const statusUsage = status.id ? (usage.statusUsage[status.id] || 0) : 0;

            return (
              <div
                className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-card p-2"
                data-icod-id={`statuses_tab_row_${index}`}>
                <div {...dragHandleProps} aria-label="Drag to reorder" data-icod-id={`statuses_tab_drag_${index}`}>
                  <span className={dragHandleProps.className} data-icod-id={`statuses_tab_grip_${index}`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      data-icod-id={`statuses_tab_gripicon_${index}`}>
                      <circle
                        cx="9"
                        cy="12"
                        r="1"
                        data-icod-id="src_features_projects_statusestab_tsx_4d6f" />
                      <circle
                        cx="9"
                        cy="5"
                        r="1"
                        data-icod-id="src_features_projects_statusestab_tsx_7f2b" />
                      <circle
                        cx="9"
                        cy="19"
                        r="1"
                        data-icod-id="src_features_projects_statusestab_tsx_2407" />
                      <circle
                        cx="15"
                        cy="12"
                        r="1"
                        data-icod-id="src_features_projects_statusestab_tsx_653c" />
                      <circle
                        cx="15"
                        cy="5"
                        r="1"
                        data-icod-id="src_features_projects_statusestab_tsx_843e" />
                      <circle
                        cx="15"
                        cy="19"
                        r="1"
                        data-icod-id="src_features_projects_statusestab_tsx_e62a" />
                    </svg>
                  </span>
                </div>
                <Input
                  size="sm"
                  value={status.name}
                  onChange={(e) => onUpdateStatus(index, { name: e.target.value })}
                  placeholder="Status name"
                  error={validationErrors[`status-name-${index}`]}
                  className="flex-1"
                  data-icod-id={`statuses_tab_name_${index}`} />
                <button
                  type="button"
                  className="h-6 w-6 shrink-0 rounded-full border border-border transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ backgroundColor: status.color }}
                  aria-label={`Color: ${status.color}`}
                  onClick={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    const refObj = { current: target };
                    setColorPickerAnchor({ ref: refObj, index });
                  }}
                  data-icod-id={`statuses_tab_color_${index}`} />
                <Select
                  size="sm"
                  value={status.category}
                  onChange={(e) => onUpdateStatus(index, { category: e.target.value as StatusEntry['category'] })}
                  className="w-28"
                  data-icod-id={`statuses_tab_category_${index}`}>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} data-icod-id={`statuses_tab_catopt_${opt.value}`}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                {statusUsage > 0 && (
                  <span
                    className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                    data-icod-id={`statuses_tab_usage_${index}`}>
                    {statusUsage}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!canRemove}
                  onClick={() => onRequestRemoveStatus(index)}
                  aria-label="Remove status"
                  className="!h-7 !w-7 shrink-0 !p-0"
                  data-icod-id={`statuses_tab_remove_${index}`}>
                  <Trash2
                    className="h-3.5 w-3.5"
                    data-icod-id="src_features_projects_statusestab_tsx_098e" />
                </Button>
              </div>
            );
          }}
          data-icod-id="statuses_tab_list" />

        <Button
          variant="secondary"
          size="sm"
          onClick={onAddStatus}
          leftIcon={<Plus
            className="h-3.5 w-3.5"
            data-icod-id="src_features_projects_statusestab_tsx_102c" />}
          className="mt-2 self-start"
          data-icod-id="statuses_tab_add">
          Add status
        </Button>
      </div>
      {/* Color swatch picker popover */}
      {colorPickerAnchor && (
        <ColorSwatchPicker
          anchorRef={colorPickerAnchor.ref}
          value={statuses[colorPickerAnchor.index]?.color ?? null}
          onChange={(hex) => {
            if (hex && colorPickerAnchor) {
              onUpdateStatus(colorPickerAnchor.index, { color: hex });
            }
          }}
          onClose={() => setColorPickerAnchor(null)}
          data-icod-id="statuses_tab_colorpicker" />
      )}
    </>
  );
}
