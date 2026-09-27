import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Settings, Users, AlertTriangle, Trash2 } from 'lucide-react';
import { PageContainer, EmptyState, Button, AvatarGroup, Skeleton, DropdownMenu, WorkspaceIcon, PageHeader } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { fetchWorkspace, selectCurrentWorkspace, selectCurrentWorkspaceStatus, clearCurrentWorkspace } from '@/store/slices/workspaceSlice';
import { fetchSheets, selectSheetsByWorkspace, selectSheetsLoading } from '@/store/slices/sheetsSlice';
import { selectFavorites } from '@/store/slices/userMetaSlice';
import { ShareModal, WorkspaceSettingsModal, DeleteWorkspaceDialog } from '@/features/workspaces';
import { SheetListTable, CreateSheetModal } from '@/features/sheets';
import { useWorkspaceAccessLost } from '@/hooks/useWorkspaceAccessLost';

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const workspace = useAppSelector(selectCurrentWorkspace);
  const status = useAppSelector(selectCurrentWorkspaceStatus);
  const sheets = useAppSelector(selectSheetsByWorkspace(id || ''));
  const sheetsLoading = useAppSelector(selectSheetsLoading);
  const favorites = useAppSelector(selectFavorites);
  const { handleAccessLost, isAccessError } = useWorkspaceAccessLost();

  const [shareOpen, setShareOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Build favorites map for quick lookup
  const favoritesMap: Record<string, boolean> = {};
  for (const fav of favorites) {
    favoritesMap[fav.sheet.id] = true;
  }

  /** Load or reload the workspace — handles both initial load and retry. */
  const loadWorkspace = useCallback(() => {
    if (!id) return;
    setFetchError(null);
    dispatch(fetchWorkspace(id))
      .unwrap()
      .catch((err: unknown) => {
        if (isAccessError(err)) {
          handleAccessLost(err);
        } else {
          setFetchError('Failed to load workspace. Please try again.');
        }
      });
  }, [id, dispatch, handleAccessLost, isAccessError]);

  useEffect(() => {
    loadWorkspace();
    return () => { dispatch(clearCurrentWorkspace()); };
  }, [loadWorkspace, dispatch]);

  // Fetch sheets when workspace loads
  useEffect(() => {
    if (id && workspace) {
      dispatch(fetchSheets(id));
    }
  }, [id, workspace, dispatch]);

  if (fetchError) {
    return (
      <PageContainer fullWidth data-icod-id="src_pages_workspacepage_tsx_error">
        <EmptyState
          icon={AlertTriangle}
          title="Something went wrong"
          description={fetchError}
          action={
            <Button
              size="sm"
              onClick={loadWorkspace}
              data-icod-id="src_pages_workspacepage_tsx_retry">
              Try again
            </Button>
          }
          data-icod-id="src_pages_workspacepage_tsx_errstate" />
      </PageContainer>
    );
  }

  if (status === 'loading' || !workspace) {
    return (
      <PageContainer fullWidth data-icod-id="src_pages_workspacepage_tsx_e274">
        <div className="space-y-4" data-icod-id="src_pages_workspacepage_tsx_5e20">
          <Skeleton
            variant="line"
            width="30%"
            data-icod-id="src_pages_workspacepage_tsx_4e49" />
          <Skeleton
            variant="line"
            width="60%"
            data-icod-id="src_pages_workspacepage_tsx_eb1a" />
          <Skeleton variant="card" data-icod-id="src_pages_workspacepage_tsx_f687" />
        </div>
      </PageContainer>
    );
  }

  // Determine current user's role
  const currentMember = workspace.members.find((m) => m.id === user?.id);
  const currentUserRole = currentMember?.role ?? null;
  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';
  const canCreate = currentUserRole === 'editor' || currentUserRole === 'admin' || currentUserRole === 'owner';
  const isOwner = currentUserRole === 'owner';

  // Build settings dropdown items
  const settingsItems = [];
  if (canManage) {
    settingsItems.push({
      label: 'Workspace settings',
      icon: <Settings className="h-4 w-4" data-icod-id="src_pages_workspacepage_tsx_b5a8" />,
      onClick: () => setSettingsOpen(true),
    });
  }
  if (isOwner) {
    settingsItems.push({ type: 'divider' as const });
    settingsItems.push({
      label: 'Delete workspace',
      icon: <Trash2 className="h-4 w-4" data-icod-id="src_pages_workspacepage_tsx_9f9c" />,
      danger: true,
      onClick: () => setDeleteDialogOpen(true),
    });
  }

  // Prepare avatar group items
  const avatarItems = workspace.members.slice(0, 5).map((m) => ({
    name: m.fullName,
  }));

  return (
    <PageContainer fullWidth data-icod-id="src_pages_workspacepage_tsx_9d88">
      {/* Page header */}
      <PageHeader
        icon={<WorkspaceIcon
          name={workspace.name}
          color={workspace.color}
          size="lg"
          data-icod-id="src_pages_workspacepage_tsx_2729" />}
        title={workspace.name}
        description={workspace.description || undefined}
        actions={
          <div className="flex shrink-0 items-center gap-2" data-icod-id="src_pages_workspacepage_tsx_7f1f">
            <AvatarGroup
              items={avatarItems}
              max={5}
              size="sm"
              data-icod-id="src_pages_workspacepage_tsx_22e5" />
            {canCreate && (
              <Button
                size="sm"
                leftIcon={<Plus className="h-4 w-4" data-icod-id="src_pages_workspacepage_tsx_b1f6" />}
                onClick={() => setCreateSheetOpen(true)}
                data-icod-id="src_pages_workspacepage_tsx_newsheet">
                New sheet
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Users className="h-4 w-4" data-icod-id="src_pages_workspacepage_tsx_c8a5" />}
              onClick={() => setShareOpen(true)}
              data-icod-id="src_pages_workspacepage_tsx_e503">
              Share
            </Button>
            {settingsItems.length > 0 && (
              <DropdownMenu
                trigger={<Settings
                  className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-foreground"
                  data-icod-id="src_pages_workspacepage_tsx_c710" />}
                items={settingsItems}
                data-icod-id="src_pages_workspacepage_tsx_4090" />
            )}
          </div>
        }
        data-icod-id="src_pages_workspacepage_tsx_30c3" />
      {/* Sheets list */}
      <SheetListTable
        sheets={sheets}
        loading={sheetsLoading}
        userRole={currentUserRole}
        workspaceId={workspace.id}
        onCreateClick={() => setCreateSheetOpen(true)}
        favoritesMap={favoritesMap}
        data-icod-id="src_pages_workspacepage_tsx_b9a7" />
      {/* Modals */}
      <CreateSheetModal
        open={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        workspaceId={workspace.id}
        data-icod-id="src_pages_workspacepage_tsx_9213" />
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        workspace={workspace}
        data-icod-id="src_pages_workspacepage_tsx_1ff6" />
      {workspace && (
        <WorkspaceSettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          workspace={workspace}
          data-icod-id="src_pages_workspacepage_tsx_ab36" />
      )}
      {workspace && (
        <DeleteWorkspaceDialog
          open={deleteDialogOpen}
          workspace={workspace}
          onClose={() => setDeleteDialogOpen(false)}
          data-icod-id="src_pages_workspacepage_tsx_4c04" />
      )}
    </PageContainer>
  );
}
