import { Link, useNavigate } from 'react-router-dom';
import { DataTable, SheetIcon, RelativeTime, FavoritesStar, Badge } from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import type { Sheet, WorkspaceRole } from '@/types';
import { useAppDispatch } from '@/store/hooks';
import { setFavoriteMeta } from '@/store/slices/userMetaSlice';
import ProjectIcon from '../../projects/ProjectIcon';
import SheetActionsMenu from './SheetActionsMenu';
import SheetEmptyState from './SheetEmptyState';

interface SheetListTableProps {
  sheets: Sheet[];
  loading: boolean;
  userRole: WorkspaceRole | null;
  workspaceId: string;
  onCreateClick: () => void;
  favoritesMap: Record<string, boolean>;
}

export default function SheetListTable({
  sheets,
  loading,
  userRole,
  workspaceId,
  onCreateClick,
  favoritesMap,
}: SheetListTableProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const canCreate = userRole === 'editor' || userRole === 'admin' || userRole === 'owner';

  if (!loading && sheets.length === 0) {
    return (
      <SheetEmptyState
        canCreate={canCreate}
        onCreateClick={onCreateClick}
        data-icod-id="src_features_sheets_components_sheetlisttable_tsx_895b" />
    );
  }

  const columns: DataTableColumn<Sheet>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (row) => (
        <div
          className="flex items-center gap-2"
          data-icod-id="src_features_sheets_components_sheetlisttable_tsx_2504">
          {row.kind === 'project' ? (
            <ProjectIcon
              className="h-4 w-4 shrink-0"
              data-icod-id="src_features_sheets_components_sheetlisttable_tsx_f95c" />
          ) : (
            <SheetIcon
              className="shrink-0"
              data-icod-id="src_features_sheets_components_sheetlisttable_tsx_4310" />
          )}
          <Link
            to={`/sheets/${row.id}`}
            className="truncate font-medium text-primary hover:underline"
            data-icod-id="src_features_sheets_components_sheetlisttable_tsx_2344">{row.name}</Link>
          {row.kind === 'project' && row.keyPrefix && (
            <span
              className="text-xs text-muted-foreground"
              data-icod-id="src_features_sheets_components_sheetlisttable_tsx_dc04">
              Project · {row.keyPrefix}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createdBy',
      header: 'Created by',
      cell: (row) => {
        const creator = row.createdBy;
        if (typeof creator === 'string') return (
          <span
            className="text-muted-foreground"
            data-icod-id="src_features_sheets_components_sheetlisttable_tsx_5daa">{creator}</span>
        );
        return (
          <span
            className="text-muted-foreground"
            data-icod-id="src_features_sheets_components_sheetlisttable_tsx_bb0d">{creator.fullName}</span>
        );
      },
      width: '180px',
    },
    {
      key: 'updatedAt',
      header: 'Last modified',
      cell: (row) => <RelativeTime
        date={row.updatedAt}
        data-icod-id="src_features_sheets_components_sheetlisttable_tsx_d47c" />,
      width: '150px',
    },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <div
          className="flex items-center justify-end gap-1"
          data-icod-id="src_features_sheets_components_sheetlisttable_tsx_d81a">
          <FavoritesStar
            isFavorite={favoritesMap[row.id] ?? false}
            onToggle={() => dispatch(setFavoriteMeta({ sheetId: row.id, starred: !(favoritesMap[row.id] ?? false) }))}
            size="sm"
            data-icod-id="src_features_sheets_components_sheetlisttable_tsx_3168" />
          {userRole && (
            <SheetActionsMenu
              sheetId={row.id}
              sheetName={row.name}
              userRole={userRole}
              data-icod-id="src_features_sheets_components_sheetlisttable_tsx_9b8c" />
          )}
        </div>
      ),
      width: '100px',
      align: 'right',
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={sheets}
      rowKey={(row) => row.id}
      loading={loading}
      onRowClick={(row) => navigate(`/sheets/${row.id}`)}
      rowHref={(row) => `/sheets/${row.id}`}
      data-icod-id="src_features_sheets_components_sheetlisttable_tsx_e2b2" />
  );
}
