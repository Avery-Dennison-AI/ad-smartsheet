import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { PageContainer, Button, EmptyState, Spinner } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSheet, selectCurrentSheet, selectSheetsLoading, selectSheetsError, selectSheetsErrorStatus, clearCurrentSheet } from '@/store/slices/sheetsSlice';
import { setFavoriteMeta, selectRecents, selectFavorites } from '@/store/slices/userMetaSlice';
import { fetchWorkspace, selectCurrentWorkspace } from '@/store/slices/workspaceSlice';
import { selectGridSaving, selectGridSaveError, clearGrid } from '@/store/slices/gridSlice';
import { useWorkspaceAccessLost } from '@/hooks/useWorkspaceAccessLost';
import SheetGrid from '@/features/sheets/grid/SheetGrid';
import SheetToolbar from '@/features/sheets/grid/SheetToolbar';

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
  const workspace = useAppSelector(selectCurrentWorkspace);
  const saving = useAppSelector(selectGridSaving);
  const saveError = useAppSelector(selectGridSaveError);
  const { handleSheetAccessLost, isAccessError } = useWorkspaceAccessLost();

  // Derive favorite state from userMeta
  const isFavorite = sheetId
    ? [...recents, ...favorites].some((item) => item.sheet.id === sheetId && item.isFavorite)
    : false;

  useEffect(() => {
    if (sheetId) {
      dispatch(fetchSheet(sheetId));
    }
    return () => {
      dispatch(clearCurrentSheet());
      dispatch(clearGrid());
    };
  }, [sheetId, dispatch]);

  // Fetch workspace when we have the sheet (for workspace members)
  useEffect(() => {
    if (sheet?.workspaceId && (!workspace || workspace.id !== sheet.workspaceId)) {
      dispatch(fetchWorkspace(sheet.workspaceId));
    }
  }, [sheet?.workspaceId, workspace, dispatch]);

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

  return (
    <div className="flex h-full flex-col overflow-hidden" data-icod-id="src_pages_sheetpage_tsx_ffe8">
      <SheetToolbar
        sheetId={sheet.id}
        sheetName={sheet.name}
        description={sheet.description}
        userRole={sheet.userRole || 'viewer'}
        isFavorite={isFavorite}
        onToggleFavorite={() => dispatch(setFavoriteMeta({ sheetId: sheet.id, starred: !isFavorite }))}
        saving={saving}
        saveError={saveError}
        data-icod-id="src_pages_sheetpage_tsx_toolbar" />
      <div
        className="flex-1 min-h-0 overflow-hidden"
        data-icod-id="src_pages_sheetpage_tsx_grid_wrap">
        <SheetGrid
          sheetId={sheet.id}
          userRole={sheet.userRole || 'viewer'}
          workspaceMembers={workspace?.members}
          data-icod-id="src_pages_sheetpage_tsx_d329" />
      </div>
    </div>
  );
}
