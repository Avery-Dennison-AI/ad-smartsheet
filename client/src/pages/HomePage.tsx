import { useState, useEffect } from 'react';
import { Plus, ChevronDown, Building2 } from 'lucide-react';
import SheetIcon from '@/components/ui/SheetIcon';
import { useNavigate } from 'react-router-dom';
import { PageContainer, Button, DropdownMenu } from '@/components/ui';
import type { DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { selectMyWorkGroups } from '@/store/slices/myWorkSlice';
import { selectOrgPolicy, fetchOrgPolicy } from '@/store/slices/orgPolicySlice';
import { selectWorkspaceList, fetchWorkspaces, selectWorkspaceStatus } from '@/store/slices/workspaceSlice';
import { CreateWorkspaceModal } from '@/features/workspaces';
import { MyWorkSection, RecentStrip } from '@/features/home';
import { CreateProjectModal, ProjectIcon } from '@/features/projects';
import type { Workspace } from '@/types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const groups = useAppSelector(selectMyWorkGroups);
  const orgPolicy = useAppSelector(selectOrgPolicy);
  const workspaces = useAppSelector(selectWorkspaceList);
  const workspaceStatus = useAppSelector(selectWorkspaceStatus);
  const [createWsOpen, setCreateWsOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  useEffect(() => {
    if (!orgPolicy) {
      dispatch(fetchOrgPolicy());
    }
  }, [orgPolicy, dispatch]);

  // Fetch workspaces for project creation permission check
  useEffect(() => {
    if (workspaceStatus === 'idle' && workspaces.length === 0) {
      dispatch(fetchWorkspaces());
    }
  }, [workspaceStatus, workspaces.length, dispatch]);

  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const greeting = getGreeting();

  // Compute summary line
  const dueTodayCount = groups?.dueToday.total ?? 0;
  const overdueCount = groups?.overdue.total ?? 0;
  let summary: string;
  if (dueTodayCount === 0 && overdueCount === 0) {
    summary = "Nothing due today — you're on track.";
  } else {
    const parts: string[] = [];
    if (dueTodayCount > 0) parts.push(`${dueTodayCount} task${dueTodayCount !== 1 ? 's' : ''} due today`);
    if (overdueCount > 0) parts.push(`${overdueCount} overdue`);
    summary = `You have ${parts.join(' and ')}.`;
  }

  // Determine workspace creation permission
  const isAdmin = user?.role === 'admin';
  const canCreateWorkspaces = orgPolicy?.whoCanCreateWorkspaces !== 'admins' || isAdmin;

  // Check if user can create projects (editor or above in at least one workspace)
  const canCreateProject = workspaces.some((ws: Workspace) => {
    const member = ws.members.find((m) => m.id === user?.id);
    const role = member?.role;
    return role === 'editor' || role === 'admin' || role === 'owner';
  });

  // Build dropdown items — "New project" first, then "New sheet", then "New workspace"
  const menuItems: DropdownMenuItem[] = [];

  if (canCreateProject) {
    menuItems.push({
      label: 'New project',
      icon: <ProjectIcon
        className="h-4 w-4 text-muted-foreground"
        data-icod-id="src_pages_homepage_tsx_5305" />,
      onClick: () => setCreateProjectOpen(true),
    });
  }

  menuItems.push({
    label: 'New sheet',
    icon: <SheetIcon
      className="h-4 w-4 text-muted-foreground"
      data-icod-id="src_pages_homepage_tsx_ea08" />,
    onClick: () => navigate('/workspaces'),
  });

  if (canCreateWorkspaces) {
    menuItems.push({
      label: 'New workspace',
      icon: <Building2
        className="h-4 w-4 text-muted-foreground"
        data-icod-id="src_pages_homepage_tsx_f184" />,
      onClick: () => setCreateWsOpen(true),
    });
  }

  return (
    <PageContainer data-icod-id="src_pages_homepage_tsx_root">
      {/* Page header */}
      <div
        className="mb-6 flex items-start justify-between"
        data-icod-id="src_pages_homepage_tsx_header"
      >
        <div data-icod-id="src_pages_homepage_tsx_greeting">
          <h1
            className="text-xl font-bold text-foreground"
            data-icod-id="src_pages_homepage_tsx_6b0b">
            {greeting}, {firstName}
          </h1>
          <p
            className="mt-1 text-sm text-muted-foreground"
            data-icod-id="src_pages_homepage_tsx_1a19">{summary}</p>
        </div>

        <DropdownMenu
          trigger={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" data-icod-id="src_pages_homepage_tsx_4996" />}
              data-icod-id="src_pages_homepage_tsx_new_btn">
              New<ChevronDown className="ml-1 h-3 w-3" data-icod-id="src_pages_homepage_tsx_ed9a" />
            </Button>
          }
          items={menuItems}
          data-icod-id="src_pages_homepage_tsx_dropdown" />
      </div>
      {/* Recent strip */}
      <RecentStrip data-icod-id="src_pages_homepage_tsx_recent" />
      {/* My Work — full width */}
      <MyWorkSection data-icod-id="src_pages_homepage_tsx_mywork" />
      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        open={createWsOpen}
        onClose={() => setCreateWsOpen(false)}
        data-icod-id="src_pages_homepage_tsx_create_ws_modal" />
      {/* Create Project Modal */}
      <CreateProjectModal
        open={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        data-icod-id="src_pages_homepage_tsx_4f4b" />
    </PageContainer>
  );
}
