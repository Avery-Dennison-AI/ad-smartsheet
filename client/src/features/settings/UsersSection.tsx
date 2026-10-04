import { useState, useCallback } from 'react';
import { Users, Mail } from 'lucide-react';
import { Button, Tabs } from '@/components/ui';
import { useAppSelector } from '@/store/hooks';
import { selectAdminUsers, selectAdminInvitations } from '@/store/slices/adminSlice';
import { InviteModal, UsersTab, InvitationsTab } from '@/features/admin';

/** Users admin section — manages users and invitations. */
export default function UsersSection() {
  const [activeTab, setActiveTab] = useState('users');
  const [inviteOpen, setInviteOpen] = useState(false);

  const users = useAppSelector(selectAdminUsers);
  const invitations = useAppSelector(selectAdminInvitations);

  const tabs = [
    { id: 'users', label: 'Users', icon: <Users className="h-4 w-4" data-icod-id="users_section_users_icon" />, badge: users.length },
    { id: 'invitations', label: 'Invitations', icon: <Mail className="h-4 w-4" data-icod-id="users_section_inv_icon" />, badge: invitations.length },
  ];

  const handleCloseInvite = useCallback(() => setInviteOpen(false), []);

  return (
    <div className="flex flex-col gap-4" data-icod-id="users_section">
      <div className="flex items-center justify-between" data-icod-id="users_section_header">
        <div data-icod-id="users_section_title_wrap">
          <h2
            className="text-lg font-semibold text-foreground"
            data-icod-id="users_section_title">Users</h2>
          <p
            className="mt-1 text-sm text-muted-foreground"
            data-icod-id="users_section_desc">Manage who has access to NEO</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setInviteOpen(true)}
          data-icod-id="users_section_invite_btn">Invite user</Button>
      </div>
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mt-1 mb-2"
        data-icod-id="users_section_tabs" />
      {activeTab === 'users' && <UsersTab data-icod-id="users_section_users_tab" />}
      {activeTab === 'invitations' && (
        <InvitationsTab
          onInvite={() => setInviteOpen(true)}
          data-icod-id="users_section_inv_tab" />
      )}
      <InviteModal
        open={inviteOpen}
        onClose={handleCloseInvite}
        data-icod-id="users_section_invite_modal" />
    </div>
  );
}
