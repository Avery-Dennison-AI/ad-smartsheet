import { useAppDispatch } from '@/store/hooks';
import { openItem } from '@/store/slices/itemDetailSlice';
import { Pill } from '@/components/ui';
import type { Column, GridRow as GridRowType } from '@/types';

interface PanelSubItemsProps {
  parentId: string;
  rows: GridRowType[];
  columns: Column[];
  sheetId: string;
}

export default function PanelSubItems({
  parentId,
  rows,
  columns,
  sheetId,
}: PanelSubItemsProps) {
  const dispatch = useAppDispatch();

  // Find children of this row
  const children = rows.filter((r) => r.parentId === parentId);

  if (children.length === 0) return null;

  const primaryCol = columns.find((c) => c.isPrimary);
  const keyCol = columns.find((c) => c.systemField === 'key');
  const statusCol = columns.find((c) => c.systemField === 'status');

  return (
    <div className="border-t border-border p-4" data-icod-id="src_features_itemdetail_panelsubitems_tsx_container">
      <h4 className="mb-3 text-xs font-medium text-muted-foreground" data-icod-id="src_features_itemdetail_panelsubitems_tsx_title">
        Sub-items ({children.length})
      </h4>
      <div className="flex flex-col gap-2" data-icod-id="src_features_itemdetail_panelsubitems_tsx_list">
        {children.map((child) => {
          const keyValue = keyCol ? child.cells[keyCol.id] : null;
          const titleValue = primaryCol ? child.cells[primaryCol.id] : null;
          const statusValue = statusCol ? child.cells[statusCol.id] : null;
          const statusOption = statusCol?.options?.find((o) => o.label === String(statusValue));

          return (
            <div
              key={child.id}
              role="button"
              tabIndex={0}
              onClick={() => dispatch(openItem({ rowId: child.id }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  dispatch(openItem({ rowId: child.id }));
                }
              }}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-icod-id={`src_features_itemdetail_panelsubitems_tsx_item_${child.id}`}>
              {keyValue && (
                <span className="font-mono text-xs text-muted-foreground" data-icod-id={`src_features_itemdetail_panelsubitems_tsx_key_${child.id}`}>
                  {String(keyValue)}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-sm text-foreground" data-icod-id={`src_features_itemdetail_panelsubitems_tsx_title_${child.id}`}>
                {titleValue != null ? String(titleValue) : 'Untitled'}
              </span>
              {statusOption && (
                <Pill
                  label={statusOption.label}
                  color={statusOption.color}
                  data-icod-id={`src_features_itemdetail_panelsubitems_tsx_status_${child.id}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
