import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { PageContainer, PageHeader, DataTable, EmptyState, Badge, RelativeTime } from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSharedWithMe, selectSharedWithMe, selectSharedWithMeStatus } from '@/store/slices/sheetsSlice';
import type { SharedWithMeItem } from '@/types';
import ProjectIcon from '@/features/projects/ProjectIcon';

export default function SharedWithMePage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectSharedWithMe);
  const status = useAppSelector(selectSharedWithMeStatus);

  useEffect(() => {
    dispatch(fetchSharedWithMe());
  }, [dispatch]);

  const columns: DataTableColumn<SharedWithMeItem>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (item) => (
        <div
          className="flex items-center gap-2"
          data-icod-id="src_pages_sharedwithmepage_tsx_7e56">
          {item.sheet.kind === 'project' ? (
            <ProjectIcon
              className="h-4 w-4 shrink-0 text-primary"
              data-icod-id="src_pages_sharedwithmepage_tsx_783e" />
          ) : null}
          <Link
            to={`/sheets/${item.sheet.id}`}
            className="font-medium text-foreground hover:underline"
            data-icod-id="src_pages_sharedwithmepage_tsx_f02c">
            {item.sheet.name}
          </Link>
          {item.sheet.kind === 'project' && item.sheet.keyPrefix && (
            <span
              className="text-xs text-muted-foreground"
              data-icod-id="src_pages_sharedwithmepage_tsx_ae6f">
              Project · {item.sheet.keyPrefix}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'workspace',
      header: 'Workspace',
      cell: (item) => (
        <span
          className="text-muted-foreground"
          data-icod-id="src_pages_sharedwithmepage_tsx_1ca8">{item.workspace.name}</span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Last modified',
      noWrap: true,
      cell: (item) => (
        <RelativeTime
          date={item.sheet.updatedAt}
          data-icod-id="src_pages_sharedwithmepage_tsx_4921" />
      ),
    },
    {
      key: 'role',
      header: 'Role',
      noWrap: true,
      cell: (item) => (
        <Badge
          variant="neutral"
          size="sm"
          className="capitalize"
          data-icod-id="src_pages_sharedwithmepage_tsx_89fb">{item.role}</Badge>
      ),
    },
  ];

  return (
    <PageContainer data-icod-id="src_pages_sharedwithmepage_tsx_8a7f">
      <PageHeader
        title="Shared with me"
        description="Sheets shared with you directly"
        data-icod-id="src_pages_sharedwithmepage_tsx_502e" />
      <DataTable
        columns={columns}
        rows={items}
        rowKey={(item) => item.sheet.id}
        loading={status === 'loading'}
        emptyState={
          <EmptyState
            icon={Users}
            title="No sheets shared with you"
            description="Sheets that are shared directly with you will appear here."
            data-icod-id="src_pages_sharedwithmepage_tsx_1d2a" />
        }
        className="rounded-[var(--radius-lg)] border border-border bg-card"
        data-icod-id="src_pages_sharedwithmepage_tsx_f01e" />
    </PageContainer>
  );
}
