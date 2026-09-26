import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyState?: ReactNode;
  stickyHeader?: boolean;
  className?: string;
}

/** Generic data table with loading skeleton and empty state support. */
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyState,
  stickyHeader = false,
  className,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div
        className={cn('flex flex-col gap-0', className)}
        data-icod-id="src_components_ui_datatable_tsx_loading">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="tableRow"
            data-icod-id={`src_components_ui_datatable_tsx_skel_${i}`} />
        ))}
      </div>
    );
  }

  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No data"
        description="There are no items to display."
        data-icod-id="src_components_ui_datatable_tsx_empty" />
    );
  }

  return (
    <div
      className={cn('overflow-x-auto', className)}
      data-icod-id="src_components_ui_datatable_tsx_wrapper">
      <table
        className="w-full text-left text-sm"
        data-icod-id="src_components_ui_datatable_tsx_table">
        <thead
          className={cn(
            'border-b bg-[var(--color-gray-50)]',
            stickyHeader && 'sticky top-0 z-10',
          )}
          style={{ borderColor: 'var(--color-gray-200)' }}
          data-icod-id="src_components_ui_datatable_tsx_thead">
          <tr data-icod-id="src_components_ui_datatable_tsx_header_row">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 font-medium text-muted-foreground"
                style={{
                  width: col.width,
                  textAlign: col.align || 'left',
                }}
                data-icod-id={`src_components_ui_datatable_tsx_th_${col.key}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          className="divide-y"
          style={{ borderColor: 'var(--color-gray-200)' }}
          data-icod-id="src_components_ui_datatable_tsx_tbody">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="transition-colors hover:bg-[var(--color-gray-50)]"
              data-icod-id={`src_components_ui_datatable_tsx_tr_${rowKey(row)}`}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-4 py-3"
                  style={{ textAlign: col.align || 'left' }}
                  data-icod-id={`src_components_ui_datatable_tsx_td_${rowKey(row)}_${col.key}`}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
