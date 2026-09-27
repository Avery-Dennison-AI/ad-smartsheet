import { useEffect } from 'react';
import { Clock, Table2 } from 'lucide-react';
import { EmptyState, PageHeader, PageContainer, Card, DataTable, Spinner, FavoritesStar, RelativeTime } from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchRecents, selectRecents, selectUserMetaLoading, setFavoriteMeta } from '@/store/slices/userMetaSlice';
import type { SheetMetaItem } from '@/types';


export default function RecentsPage() {
  const dispatch = useAppDispatch();
  const recents = useAppSelector(selectRecents);
  const loading = useAppSelector(selectUserMetaLoading);

  useEffect(() => {
    dispatch(fetchRecents());
  }, [dispatch]);

  const columns: DataTableColumn<SheetMetaItem>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (row) => (
        <div
          className="flex items-center gap-2"
          data-icod-id="src_pages_recentspage_tsx_d4eb">
          <Table2
            className="h-4 w-4 shrink-0 text-primary"
            data-icod-id="src_pages_recentspage_tsx_38fc" />
          <span
            className="truncate font-medium text-foreground"
            data-icod-id="src_pages_recentspage_tsx_7950">{row.sheet.name}</span>
        </div>
      ),
    },
    {
      key: 'workspace',
      header: 'Workspace',
      cell: (row) => (
        <span
          className="text-muted-foreground"
          data-icod-id="src_pages_recentspage_tsx_2e0d">{row.workspace.name}</span>
      ),
      width: '180px',
    },
    {
      key: 'lastOpened',
      header: 'Last opened',
      cell: (row) => row.lastOpenedAt ? <RelativeTime date={row.lastOpenedAt} data-icod-id="src_pages_recentspage_tsx_0ef7" /> : <span
        className="text-muted-foreground"
        data-icod-id="src_pages_recentspage_tsx_de3e">-</span>,
      width: '150px',
    },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <div
          className="flex items-center justify-end"
          data-icod-id="src_pages_recentspage_tsx_5ce4">
          <FavoritesStar
            isFavorite={row.isFavorite}
            onToggle={() => dispatch(setFavoriteMeta({ sheetId: row.sheet.id, starred: !row.isFavorite }))}
            size="sm"
            data-icod-id="src_pages_recentspage_tsx_f7bd" />
        </div>
      ),
      width: '60px',
      align: 'right',
    },
  ];

  return (
    <PageContainer data-icod-id="src_pages_recentspage_tsx_4773">
      <PageHeader title="Recents" data-icod-id="src_pages_recentspage_tsx_37ea" />
      <Card data-icod-id="src_pages_recentspage_tsx_29a1">
        {loading ? (
          <div
            className="flex h-32 items-center justify-center"
            data-icod-id="src_pages_recentspage_tsx_cb3e">
            <Spinner size="md" data-icod-id="src_pages_recentspage_tsx_c922" />
          </div>
        ) : recents.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No recent activity"
            description="Sheets you open will appear here."
            data-icod-id="src_pages_recentspage_tsx_b274" />
        ) : (
          <DataTable
            columns={columns}
            rows={recents}
            rowKey={(row) => row.sheet.id}
            data-icod-id="src_pages_recentspage_tsx_d72b" />
        )}
      </Card>
    </PageContainer>
  );
}
