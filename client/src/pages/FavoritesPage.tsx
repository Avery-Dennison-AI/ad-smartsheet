import { useEffect } from 'react';
import { Star, Table2 } from 'lucide-react';
import { EmptyState, PageHeader, PageContainer, Card, DataTable, Spinner, FavoritesStar, RelativeTime } from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchFavorites, selectFavorites, selectUserMetaLoading, setFavoriteMeta } from '@/store/slices/userMetaSlice';
import type { SheetMetaItem } from '@/types';


export default function FavoritesPage() {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(selectFavorites);
  const loading = useAppSelector(selectUserMetaLoading);

  useEffect(() => {
    dispatch(fetchFavorites());
  }, [dispatch]);

  const columns: DataTableColumn<SheetMetaItem>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (row) => (
        <div
          className="flex items-center gap-2"
          data-icod-id="src_pages_favoritespage_tsx_e2f2">
          <Table2
            className="h-4 w-4 shrink-0 text-primary"
            data-icod-id="src_pages_favoritespage_tsx_15da" />
          <span
            className="truncate font-medium text-foreground"
            data-icod-id="src_pages_favoritespage_tsx_8883">{row.sheet.name}</span>
        </div>
      ),
    },
    {
      key: 'workspace',
      header: 'Workspace',
      cell: (row) => (
        <span
          className="text-muted-foreground"
          data-icod-id="src_pages_favoritespage_tsx_90f9">{row.workspace.name}</span>
      ),
      width: '180px',
    },
    {
      key: 'updatedAt',
      header: 'Last modified',
      cell: (row) => <RelativeTime
        date={row.sheet.updatedAt}
        data-icod-id="src_pages_favoritespage_tsx_2df4" />,
      width: '150px',
    },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <div
          className="flex items-center justify-end"
          data-icod-id="src_pages_favoritespage_tsx_140c">
          <FavoritesStar
            isFavorite={row.isFavorite}
            onToggle={() => dispatch(setFavoriteMeta({ sheetId: row.sheet.id, starred: !row.isFavorite }))}
            size="sm"
            data-icod-id="src_pages_favoritespage_tsx_358b" />
        </div>
      ),
      width: '60px',
      align: 'right',
    },
  ];

  return (
    <PageContainer data-icod-id="src_pages_favoritespage_tsx_2808">
      <PageHeader title="Favorites" data-icod-id="src_pages_favoritespage_tsx_72ab" />
      <Card data-icod-id="src_pages_favoritespage_tsx_cc41">
        {loading ? (
          <div
            className="flex h-32 items-center justify-center"
            data-icod-id="src_pages_favoritespage_tsx_8223">
            <Spinner size="md" data-icod-id="src_pages_favoritespage_tsx_3667" />
          </div>
        ) : favorites.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No favorites"
            description="Star sheets to pin them here for quick access."
            data-icod-id="src_pages_favoritespage_tsx_9eb2" />
        ) : (
          <DataTable
            columns={columns}
            rows={favorites}
            rowKey={(row) => row.sheet.id}
            data-icod-id="src_pages_favoritespage_tsx_391f" />
        )}
      </Card>
    </PageContainer>
  );
}
