import type { ReactNode, KeyboardEvent, MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  onRowClick?: (row: T) => void;
  rowHref?: (row: T) => string;
}

const alignClass: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

/** Generic data table with loading skeleton and empty state support. */
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyState,
  stickyHeader = false,
  className,
  onRowClick,
  rowHref,
}: DataTableProps<T>) {
  const navigate = useNavigate();
  const interactive = !!(onRowClick || rowHref);

  /** Bail out when the click target is inside an interactive control. */
  const isInteractiveTarget = (target: EventTarget | null): boolean =>
    !!(target as Element | null)?.closest?.('a, button, input, select, [role="button"]');

  const handleRowClick = (e: MouseEvent<HTMLTableRowElement>, row: T) => {
    if (isInteractiveTarget(e.target)) return;
    if (onRowClick) {
      onRowClick(row);
    } else if (rowHref) {
      navigate(rowHref(row));
    }
  };

  const handleRowKeyDown = (e: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    // Don't fire for interactive elements that already handle these keys
    if (isInteractiveTarget(e.target)) return;
    e.preventDefault();
    if (onRowClick) {
      onRowClick(row);
    } else if (rowHref) {
      navigate(rowHref(row));
    }
  };

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

  // Determine which column index is the "primary label" column (first non-actions column)
  const primaryColIndex = columns.findIndex((col) => col.key !== 'actions');

  return (
    <div
      className={cn('overflow-x-auto', className)}
      data-icod-id="src_components_ui_datatable_tsx_wrapper">
      <table
        className="w-full text-left text-sm"
        data-icod-id="src_components_ui_datatable_tsx_table">
        <thead
          className={cn(
            'border-b border-border bg-muted',
            stickyHeader && 'sticky top-0 z-10',
          )}
          data-icod-id="src_components_ui_datatable_tsx_thead">
          <tr data-icod-id="src_components_ui_datatable_tsx_header_row">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 font-medium text-muted-foreground',
                  alignClass[col.align || 'left'],
                )}
                style={col.width ? { width: col.width } : undefined}
                data-icod-id={`src_components_ui_datatable_tsx_th_${col.key}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          className="divide-y divide-border"
          data-icod-id="src_components_ui_datatable_tsx_tbody">
          {rows.map((row, __icodIdx0) => {
            const href = rowHref?.(row);
            return (
              <tr
                key={rowKey(row)}
                className={cn(
                  'transition-colors',
                  interactive && 'cursor-pointer hover:bg-muted/60',
                )}
                {...(interactive ? { tabIndex: 0, role: 'button' } : {})}
                onClick={(e) => handleRowClick(e, row)}
                onKeyDown={(e) => handleRowKeyDown(e, row)}
                data-icod-id={`src_components_ui_datatable_tsx_tr_${rowKey(row)}`}>
                {columns.map((col, colIdx) => {
                  const cellContent = col.cell(row);
                  const isPrimary = colIdx === primaryColIndex && !!href;
                  return (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3', alignClass[col.align || 'left'])}
                      data-icod-id={`src_components_ui_datatable_tsx_td_${rowKey(row)}_${col.key}`}>
                      {isPrimary ? (
                        <Link
                          to={href!}
                          className="text-primary hover:underline"
                          data-icod-id={`src_components_ui_datatable_tsx_e9c8_${__icodIdx0}_${col.key}`}>
                          {cellContent}
                        </Link>
                      ) : (
                        cellContent
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
