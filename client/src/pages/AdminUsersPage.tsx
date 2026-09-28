import { useState, useCallback } from 'react';
import { Users, Mail } from 'lucide-react';
import { Button, Tabs, PageHeader, PageContainer } from '@/components/ui';
import { useAppSelector } from '@/store/hooks';
import { selectAdminUsers, selectAdminInvitations } from '@/store/slices/adminSlice';
import { InviteModal, UsersTab, InvitationsTab } from '@/features/admin';

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [inviteOpen, setInviteOpen] = useState(false);

  const users = useAppSelector(selectAdminUsers);
  const invitations = useAppSelector(selectAdminInvitations);

  const tabs = [
    { id: 'users', label: 'Users', icon: <Users className="h-4 w-4" data-icod-id="admin_page_users_icon" />, badge: users.length },
    { id: 'invitations', label: 'Invitations', icon: <Mail className="h-4 w-4" data-icod-id="admin_page_inv_icon" />, badge: invitations.length },
  ];

  // Stable callback for closing the invite modal.
  const handleCloseInvite = useCallback(() => setInviteOpen(false), []);

  return (
    <PageContainer fullWidth data-icod-id="src_pages_adminuserspage_tsx_744e">
      <div className="flex flex-col gap-4" data-icod-id="admin_page_root">
        <PageHeader
          title="Users"
           description="Manage who has access to AD Smartsheet"
          className="mb-3"
          actions={
            <Button
              variant="primary"
              onClick={() => setInviteOpen(true)}
              data-icod-id="admin_page_invite_btn">Invite user</Button>
          }
          data-icod-id="admin_page_header" />
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="mt-3 mb-4"
          data-icod-id="admin_page_tabs" />
        {activeTab === 'users' && <UsersTab data-icod-id="admin_page_users_tab" />}
        {activeTab === 'invitations' && <InvitationsTab onInvite={() => setInviteOpen(true)} data-icod-id="admin_page_inv_tab" />}
      </div>
      <InviteModal
        open={inviteOpen}
        onClose={handleCloseInvite}
        data-icod-id="admin_page_invite_modal" />
    </PageContainer>
  );
}
