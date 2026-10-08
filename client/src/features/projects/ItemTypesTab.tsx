import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, SortableList } from '@/components/ui';
import type { ItemTypeEntry, ProjectUsage } from '@/types';

interface ItemTypesTabProps {
  itemTypes: ItemTypeEntry[];
  usage: ProjectUsage;
  validationErrors: Record<string, string>;
  onUpdateItemType: (index: number, patch: Partial<ItemTypeEntry>) => void;
  onAddItemType: () => void;
  onRequestRemoveItemType: (index: number) => void;
  onReorder: (itemTypes: ItemTypeEntry[]) => void;
}

export default function ItemTypesTab({
  itemTypes,
  usage,
  validationErrors,
  onUpdateItemType,
  onAddItemType,
  onRequestRemoveItemType,
  onReorder,
}: ItemTypesTabProps) {
  return (
    <div className="flex flex-col gap-1" data-icod-id="itemtypes_tab_root">
      <SortableList
        items={itemTypes}
        onReorder={onReorder}
        keyExtractor={(t) => t.id || `new-type-${t.name}`}
        renderItem={(itemType, index, dragHandleProps) => {
          const typeUsage = itemType.id ? (usage.typeUsage[itemType.id] || 0) : 0;
          const canRemove = itemTypes.length > 1;

          return (
            <div
              className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-card p-2"
              data-icod-id={`itemtypes_tab_row_${index}`}>
              <div {...dragHandleProps} aria-label="Drag to reorder" data-icod-id={`itemtypes_tab_drag_${index}`}>
                <span className={dragHandleProps.className} data-icod-id={`itemtypes_tab_grip_${index}`}>
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
                    data-icod-id={`itemtypes_tab_gripicon_${index}`}>
                    <circle
                      cx="9"
                      cy="12"
                      r="1"
                      data-icod-id="src_features_projects_itemtypestab_tsx_ac19" />
                    <circle
                      cx="9"
                      cy="5"
                      r="1"
                      data-icod-id="src_features_projects_itemtypestab_tsx_9648" />
                    <circle
                      cx="9"
                      cy="19"
                      r="1"
                      data-icod-id="src_features_projects_itemtypestab_tsx_6978" />
                    <circle
                      cx="15"
                      cy="12"
                      r="1"
                      data-icod-id="src_features_projects_itemtypestab_tsx_d0aa" />
                    <circle
                      cx="15"
                      cy="5"
                      r="1"
                      data-icod-id="src_features_projects_itemtypestab_tsx_19b2" />
                    <circle
                      cx="15"
                      cy="19"
                      r="1"
                      data-icod-id="src_features_projects_itemtypestab_tsx_3474" />
                  </svg>
                </span>
              </div>
              <Input
                size="sm"
                value={itemType.name}
                onChange={(e) => onUpdateItemType(index, { name: e.target.value })}
                placeholder="Item type name"
                error={validationErrors[`type-name-${index}`]}
                className="flex-1"
                data-icod-id={`itemtypes_tab_name_${index}`} />
              {typeUsage > 0 && (
                <span
                  className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                  data-icod-id={`itemtypes_tab_usage_${index}`}>
                  {typeUsage}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                disabled={!canRemove}
                onClick={() => onRequestRemoveItemType(index)}
                aria-label="Remove item type"
                className="!h-7 !w-7 shrink-0 !p-0"
                data-icod-id={`itemtypes_tab_remove_${index}`}>
                <Trash2
                  className="h-3.5 w-3.5"
                  data-icod-id="src_features_projects_itemtypestab_tsx_2d24" />
              </Button>
            </div>
          );
        }}
        data-icod-id="itemtypes_tab_list" />
      <Button
        variant="secondary"
        size="sm"
        onClick={onAddItemType}
        leftIcon={<Plus
          className="h-3.5 w-3.5"
          data-icod-id="src_features_projects_itemtypestab_tsx_4f2c" />}
        className="mt-2 self-start"
        data-icod-id="itemtypes_tab_add">
        Add item type
      </Button>
    </div>
  );
}
