import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, LayoutGrid } from 'lucide-react';
import { PageContainer, PageHeader, Button, EmptyState, Spinner, Breadcrumbs } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSheet, selectCurrentSheet, selectSheetsLoading, selectSheetsError, clearCurrentSheet } from '@/store/slices/sheetsSlice';
import SheetIcon from '@/components/shared/SheetIcon';

export default function SheetPage() {
  const { sheetId } = useParams<{ sheetId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const sheet = useAppSelector(selectCurrentSheet);
  const loading = useAppSelector(selectSheetsLoading);
  const error = useAppSelector(selectSheetsError);

  useEffect(() => {
    if (sheetId) {
      dispatch(fetchSheet(sheetId));
    }
    return () => { dispatch(clearCurrentSheet()); };
  }, [sheetId, dispatch]);

  // Access lost handling
  useEffect(() => {
    if (error && (error.includes('not found') || error.includes('Access denied'))) {
      // Show error state - user can navigate back
    }
  }, [error]);

  if (loading) {
    return (
      <PageContainer fullWidth data-icod-id="src_pages_sheetpage_tsx_6a92">
        <div
          className="flex h-64 items-center justify-center"
          data-icod-id="src_pages_sheetpage_tsx_892c">
          <Spinner size="lg" data-icod-id="src_pages_sheetpage_tsx_f2dd" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer fullWidth data-icod-id="src_pages_sheetpage_tsx_fa08">
        <EmptyState
          icon={AlertTriangle}
          title="Sheet not accessible"
          description={error}
          action={
            <Button
              size="sm"
              onClick={() => navigate('/home')}
              data-icod-id="src_pages_sheetpage_tsx_6cf9">
              Go Home
            </Button>
          }
          data-icod-id="src_pages_sheetpage_tsx_61f3" />
      </PageContainer>
    );
  }

  if (!sheet) {
    return (
      <PageContainer fullWidth data-icod-id="src_pages_sheetpage_tsx_bae1">
        <EmptyState
          icon={LayoutGrid}
          title="Sheet not found"
          description="This sheet may have been deleted or you don't have access to it."
          action={
            <Button
              size="sm"
              onClick={() => navigate('/home')}
              data-icod-id="src_pages_sheetpage_tsx_c0f2">
              Go Home
            </Button>
          }
          data-icod-id="src_pages_sheetpage_tsx_c129" />
      </PageContainer>
    );
  }

  const breadcrumbItems = [
    { label: 'Home', to: '/home' },
    {
      label: 'Workspace',
      to: `/workspaces/${sheet.workspaceId}`,
    },
    { label: sheet.name },
  ];

  return (
    <PageContainer fullWidth data-icod-id="src_pages_sheetpage_tsx_ffe8">
      <Breadcrumbs items={breadcrumbItems} data-icod-id="src_pages_sheetpage_tsx_86ae" />
      <PageHeader
        icon={<SheetIcon className="h-6 w-6" data-icod-id="src_pages_sheetpage_tsx_c2ef" />}
        title={sheet.name}
        description={`Created by ${typeof sheet.createdBy === 'string' ? sheet.createdBy : sheet.createdBy.fullName}`}
        data-icod-id="src_pages_sheetpage_tsx_272d" />
      {/* Sheet content placeholder — grid feature comes in next step */}
      <EmptyState
        icon={LayoutGrid}
        title="Sheet is ready"
        description="The spreadsheet grid will be rendered here in the next iteration."
        data-icod-id="src_pages_sheetpage_tsx_c025" />
    </PageContainer>
  );
}
