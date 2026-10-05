import { Check, Minus } from 'lucide-react';
import { Tooltip } from '@/components/ui';
import { cn } from '@/utils/cn';

export interface PermissionRow {
  action: string;
  [key: string]: boolean | string | undefined;
}

export interface PermissionMatrixProps {
  rows: PermissionRow[];
  columns: string[];
  title?: string;
  className?: string;
}

/** Renders a permission matrix table with check/dash indicators per role column. */
export default function PermissionMatrix({ rows, columns, title, className }: PermissionMatrixProps) {
  return (
    <div
      className={cn('overflow-x-auto', className)}
      data-icod-id="src_components_ui_permissionmatrix_tsx_9903">
      {title && (
        <h4
          className="mb-3 text-sm font-medium text-foreground"
          data-icod-id="src_components_ui_permissionmatrix_tsx_818e">{title}</h4>
      )}
      <table
        className="w-full text-left text-sm"
        data-icod-id="src_components_ui_permissionmatrix_tsx_7d14">
        <thead data-icod-id="src_components_ui_permissionmatrix_tsx_13f4">
          <tr
            className="border-b border-border"
            data-icod-id="src_components_ui_permissionmatrix_tsx_76ab">
            <th
              className="py-2 pr-4 text-xs font-medium text-muted-foreground"
              data-icod-id="src_components_ui_permissionmatrix_tsx_11b4">Action</th>
            {columns.map((col) => (
              <th
                key={col}
                className="px-3 py-2 text-center text-xs font-medium text-muted-foreground"
                data-icod-id={`src_components_ui_permissionmatrix_tsx_4b01_${col}`}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          className="divide-y divide-border"
          data-icod-id="src_components_ui_permissionmatrix_tsx_146b">
          {rows.map((row) => (
            <tr
              key={row.action}
              data-icod-id={`src_components_ui_permissionmatrix_tsx_08ad_${row.action}`}>
              <td
                className="py-2 pr-4 text-foreground"
                data-icod-id={`src_components_ui_permissionmatrix_tsx_ab91_${row.action}`}>
                {typeof row.tooltip === 'string' ? (
                  <Tooltip
                    content={row.tooltip}
                    data-icod-id={`src_components_ui_permissionmatrix_tsx_3169_${row.action}`}>
                    <span
                      className="cursor-help border-b border-dashed border-muted-foreground"
                      data-icod-id={`src_components_ui_permissionmatrix_tsx_0ba1_${row.action}`}>
                      {row.action}
                    </span>
                  </Tooltip>
                ) : (
                  row.action
                )}
              </td>
              {columns.map((col) => {
                const value = row[col.toLowerCase()];
                const isGranted = value === true;
                return (
                  <td
                    key={col}
                    className="px-3 py-2 text-center"
                    data-icod-id={`src_components_ui_permissionmatrix_tsx_3e31_${row.action}_${col}`}>
                    {isGranted ? (
                      <Check
                        className="mx-auto h-4 w-4 text-success"
                        data-icod-id={`src_components_ui_permissionmatrix_tsx_d594_${row.action}_${col}`} />
                    ) : (
                      <Minus
                        className="mx-auto h-4 w-4 text-muted-foreground/40"
                        data-icod-id={`src_components_ui_permissionmatrix_tsx_d0ad_${row.action}_${col}`} />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
