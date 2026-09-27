import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Users, LayoutGrid, AlertTriangle } from 'lucide-react';
import { PageContainer, EmptyState, Button, AvatarGroup, Skeleton, DropdownMenu, WorkspaceIcon } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { fetchWorkspace, selectCurrentWorkspace, selectCurrentWorkspaceStatus, clearCurrentWorkspace } from '@/store/slices/workspaceSlice';
import { ShareModal, WorkspaceSettingsModal } from '@/features/workspaces';
import { useWorkspaceAccessLost } from '@/hooks/useWorkspaceAccessLost';

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const workspace = useAppSelector(selectCurrentWorkspace);
  const status = useAppSelector(selectCurrentWorkspaceStatus);
  const { handleAccessLost } = useWorkspaceAccessLost();

  const [shareOpen, setShareOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  /** Load or reload the workspace — handles both initial load and retry. */
  const loadWorkspace = useCallback(() => {
    if (!id) return;
    setFetchError(null);
    dispatch(fetchWorkspace(id))
      .unwrap()
      .catch((err: unknown) => {
        const e = err as { status?: number; statusCode?: number };
        const statusCode = e?.status || e?.statusCode;
        if (statusCode === 403 || statusCode === 404) {
          handleAccessLost(err);
        } else {
          setFetchError('Failed to load workspace. Please try again.');
        }
      });
  }, [id, dispatch, handleAccessLost]);

  useEffect(() => {
    loadWorkspace();
    return () => { dispatch(clearCurrentWorkspace()); };
  }, [loadWorkspace, dispatch]);

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
      icon: <LayoutGrid className="h-4 w-4" data-icod-id="src_pages_workspacepage_tsx_9f9c" />,
      danger: true,
      onClick: () => setSettingsOpen(true),
    });
  }

  // Prepare avatar group items
  const avatarItems = workspace.members.slice(0, 5).map((m) => ({
    name: m.fullName,
  }));

  return (
    <PageContainer fullWidth data-icod-id="src_pages_workspacepage_tsx_9d88">
      {/* Page header */}
      <div
        className="mb-6 flex items-start justify-between gap-4"
        data-icod-id="src_pages_workspacepage_tsx_3da5">
        <div
          className="flex items-center gap-3 min-w-0"
          data-icod-id="src_pages_workspacepage_tsx_fd90">
          <WorkspaceIcon
            name={workspace.name}
            color={workspace.color}
            size="md"
            data-icod-id="src_pages_workspacepage_tsx_993e" />
          <div className="min-w-0" data-icod-id="src_pages_workspacepage_tsx_3f6e">
            <h1
              className="truncate text-xl font-bold text-foreground"
              data-icod-id="src_pages_workspacepage_tsx_7e01">{workspace.name}</h1>
            {workspace.description && (
              <p
                className="truncate text-sm text-muted-foreground"
                data-icod-id="src_pages_workspacepage_tsx_1dd5">{workspace.description}</p>
            )}
          </div>
        </div>

        <div
          className="flex shrink-0 items-center gap-2"
          data-icod-id="src_pages_workspacepage_tsx_7f1f">
          <AvatarGroup
            items={avatarItems}
            max={5}
            size="sm"
            data-icod-id="src_pages_workspacepage_tsx_22e5" />
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
      </div>
      {/* Main content area — placeholder for sheets */}
      <EmptyState
        icon={LayoutGrid}
        title="No sheets yet"
        description="Sheets are coming in the next step."
        data-icod-id="src_pages_workspacepage_tsx_8040" />
      {/* Modals */}
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
    </PageContainer>
  );
}
