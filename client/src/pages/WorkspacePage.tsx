import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Users, LayoutGrid } from 'lucide-react';
import { PageContainer, EmptyState, Button, AvatarGroup, Skeleton, DropdownMenu, WorkspaceIcon, useToast } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { fetchWorkspace, selectCurrentWorkspace, selectCurrentWorkspaceStatus, clearCurrentWorkspace } from '@/store/slices/workspaceSlice';
import { ShareModal, WorkspaceSettingsModal } from '@/features/workspaces';

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const workspace = useAppSelector(selectCurrentWorkspace);
  const status = useAppSelector(selectCurrentWorkspaceStatus);
  const { addToast } = useToast();

  const [shareOpen, setShareOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchWorkspace(id));
    return () => { dispatch(clearCurrentWorkspace()); };
  }, [id, dispatch]);

  // Navigate away on failure (user lost access)
  useEffect(() => {
    if (status === 'failed') {
      addToast('error', 'You no longer have access to this workspace.');
      navigate('/home', { replace: true });
    }
  }, [status, navigate, addToast]);

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
  const currentMember = workspace.members.find((m) => m.user._id === user?.id);
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
    name: m.user.name,
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
