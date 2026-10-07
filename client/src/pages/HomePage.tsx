import { useState, useEffect } from 'react';
import { Plus, FileSpreadsheet, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer, Button, DropdownMenu } from '@/components/ui';
import type { DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { selectMyWorkGroups } from '@/store/slices/myWorkSlice';
import { selectOrgPolicy, fetchOrgPolicy } from '@/store/slices/orgPolicySlice';
import { CreateWorkspaceModal } from '@/features/workspaces';
import { MyWorkSection, RecentStrip } from '@/features/home';

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
  const [createWsOpen, setCreateWsOpen] = useState(false);

  useEffect(() => {
    if (!orgPolicy) {
      dispatch(fetchOrgPolicy());
    }
  }, [orgPolicy, dispatch]);

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

  // Build dropdown items
  const menuItems: DropdownMenuItem[] = [
    {
      label: 'New sheet',
      icon: <FileSpreadsheet className="h-4 w-4" data-icod-id="src_pages_homepage_tsx_2b3d" />,
      onClick: () => navigate('/workspaces'),
    },
  ];

  if (canCreateWorkspaces) {
    menuItems.push({
      label: 'New workspace',
      icon: <Briefcase className="h-4 w-4" data-icod-id="src_pages_homepage_tsx_d574" />,
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
              leftIcon={<Plus className="h-4 w-4" data-icod-id="src_pages_homepage_tsx_adee" />}
              data-icod-id="src_pages_homepage_tsx_new_btn">
              New +
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
    </PageContainer>
  );
}
