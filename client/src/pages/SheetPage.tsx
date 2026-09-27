import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { PageContainer, PageHeader, Button, EmptyState, Spinner, SheetIcon, FavoritesStar } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSheet, selectCurrentSheet, selectSheetsLoading, selectSheetsError, selectSheetsErrorStatus, clearCurrentSheet } from '@/store/slices/sheetsSlice';
import { setFavoriteMeta, selectRecents, selectFavorites } from '@/store/slices/userMetaSlice';
import { useWorkspaceAccessLost } from '@/hooks/useWorkspaceAccessLost';
import SheetActionsMenu from '@/features/sheets/components/SheetActionsMenu';

export default function SheetPage() {
  const { sheetId } = useParams<{ sheetId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const sheet = useAppSelector(selectCurrentSheet);
  const loading = useAppSelector(selectSheetsLoading);
  const error = useAppSelector(selectSheetsError);
  const errorStatus = useAppSelector(selectSheetsErrorStatus);
  const recents = useAppSelector(selectRecents);
  const favorites = useAppSelector(selectFavorites);
  const { handleSheetAccessLost, isAccessError } = useWorkspaceAccessLost();

  // Derive favorite state from userMeta
  const isFavorite = sheetId
    ? [...recents, ...favorites].some((item) => item.sheet.id === sheetId && item.isFavorite)
    : false;

  useEffect(() => {
    if (sheetId) {
      dispatch(fetchSheet(sheetId));
    }
    return () => { dispatch(clearCurrentSheet()); };
  }, [sheetId, dispatch]);

  // Access lost handling — redirect on 403/404 using status code
  useEffect(() => {
    if (error && isAccessError({ status: errorStatus })) {
      handleSheetAccessLost(sheet?.workspaceId);
    }
  }, [error, errorStatus, isAccessError, handleSheetAccessLost, sheet?.workspaceId]);

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
    // Access errors (403/404) are handled by the useEffect above — this is for other errors
    if (!isAccessError({ status: errorStatus })) {
      return (
        <PageContainer fullWidth data-icod-id="src_pages_sheetpage_tsx_fa08">
          <EmptyState
            icon={AlertTriangle}
            title="Something went wrong"
            description={error}
            action={
              <Button
                size="sm"
                onClick={() => sheetId && dispatch(fetchSheet(sheetId))}
                data-icod-id="src_pages_sheetpage_tsx_6cf9">
                Try again
              </Button>
            }
            data-icod-id="src_pages_sheetpage_tsx_61f3" />
        </PageContainer>
      );
    }
    // For access errors, show loading-like state while redirect happens
    return null;
  }

  if (!sheet) {
    return (
      <PageContainer fullWidth data-icod-id="src_pages_sheetpage_tsx_bae1">
        <EmptyState
          icon={AlertTriangle}
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

  const headerActions = (
    <div
      className="flex items-center gap-1"
      data-icod-id="src_pages_sheetpage_tsx_40ba">
      <FavoritesStar
        isFavorite={isFavorite}
        onToggle={() => dispatch(setFavoriteMeta({ sheetId: sheet.id, starred: !isFavorite }))}
        data-icod-id="src_pages_sheetpage_tsx_e1c1" />
      {sheet.userRole && (
        <SheetActionsMenu
          sheetId={sheet.id}
          sheetName={sheet.name}
          userRole={sheet.userRole}
          hideOpen
          data-icod-id="src_pages_sheetpage_tsx_29a1" />
      )}
    </div>
  );

  return (
    <PageContainer fullWidth data-icod-id="src_pages_sheetpage_tsx_ffe8">
      <PageHeader
        icon={<SheetIcon className="h-6 w-6" data-icod-id="src_pages_sheetpage_tsx_c2ef" />}
        title={sheet.name}
        description={sheet.workspaceName || 'Workspace'}
        actions={headerActions}
        data-icod-id="src_pages_sheetpage_tsx_272d" />
      <div
        className="flex h-64 items-center justify-center"
        data-icod-id="src_pages_sheetpage_tsx_cb9e">
        <p
          className="text-sm text-muted-foreground"
          data-icod-id="src_pages_sheetpage_tsx_09c2">This sheet is empty.</p>
      </div>
    </PageContainer>
  );
}
