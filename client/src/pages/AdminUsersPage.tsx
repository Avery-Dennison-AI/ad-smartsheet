import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Search, Users, Mail, RefreshCw, XCircle, MoreHorizontal } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Badge,
  Tabs,
  PageHeader,
  EmptyState,
  Modal,
  Alert,
  ConfirmDialog,
  DropdownMenu,
  DataTable,
  Pagination,
  CopyField,
  Avatar,
  IconButton,
  PageContainer,
} from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';
import {
  fetchAdminUsers,
  fetchAdminInvitations,
  createAdminInvitation,
  regenerateAdminInvitation,
  revokeAdminInvitation,
  updateAdminUserRole,
  updateAdminUserStatus,
  selectAdminUsers,
  selectAdminUsersStatus,
  selectAdminUsersError,
  selectAdminUsersPagination,
  selectAdminInvitations,
  selectAdminInvitationsStatus,
  selectAdminInvitationsError,
} from '@/store/slices/adminSlice';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { buildInviteLink } from '@/utils/inviteLink';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import type { AdminUser, InvitationItem, InvitationStatus } from '@/types';

// ─── Status badge variant mapping ──────────────────────────────────────────

function statusBadgeVariant(status: InvitationStatus): 'status-blue' | 'status-red' | 'status-gray' {
  switch (status) {
    case 'pending': return 'status-blue';
    case 'revoked': return 'status-red';
    case 'expired': return 'status-gray';
    case 'accepted': return 'status-gray'; // filtered out server-side; fallback only
  }
}

function roleBadgeVariant(role: string): 'status-blue' | 'neutral' {
  return role === 'admin' ? 'status-blue' : 'neutral';
}

/** Capitalize first letter of a string. */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Invite Modal ──────────────────────────────────────────────────────────

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
}

function InviteModal({ open, onClose }: InviteModalProps) {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitePath, setInvitePath] = useState<string | null>(null);

  function resetForm() {
    setEmail('');
    setFullName('');
    setRole('member');
    setError(null);
    setInvitePath(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    setLoading(true);
    try {
      const result = await dispatch(createAdminInvitation({ email: email.trim(), fullName: fullName.trim() || undefined, role })).unwrap();
      setInvitePath(result.invitePath);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  }

  // Stable callback so Modal's focus effect does not re-run on every render.
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose]);

  function handleInviteAnother() {
    setInvitePath(null);
    setEmail('');
    setFullName('');
    setRole('member');
    setError(null);
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Send Invitation"
      footer={
        invitePath ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleInviteAnother}
              data-icod-id="src_pages_adminuserspage_tsx_invite_another">Invite another</Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClose}
              data-icod-id="src_pages_adminuserspage_tsx_done_btn">Done</Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClose}
              data-icod-id="src_pages_adminuserspage_tsx_cancel_invite">Cancel</Button>
            <Button
              size="sm"
              loading={loading}
              type="submit"
              form="invite-form"
              data-icod-id="src_pages_adminuserspage_tsx_send_invite">Send Invitation</Button>
          </>
        )
      }
      data-icod-id="src_pages_adminuserspage_tsx_invite_modal">
      {invitePath ? (
        <div
          className="flex flex-col gap-3"
          data-icod-id="src_pages_adminuserspage_tsx_invite_success">
          <p
            className="text-sm text-muted-foreground"
            data-icod-id="src_pages_adminuserspage_tsx_invite_success_text">
            Invitation created successfully. Share this link with the invitee:
          </p>
          <CopyField
            value={buildInviteLink(invitePath)}
            data-icod-id="src_pages_adminuserspage_tsx_copy_field" />
          <p
            className="text-xs text-muted-foreground"
            data-icod-id="src_pages_adminuserspage_tsx_invite_expiry_note">
            This link is shown only once and expires in 7 days.
          </p>
        </div>
      ) : (
        <form
          id="invite-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          data-icod-id="src_pages_adminuserspage_tsx_invite_form">
          {error && <Alert variant="error" data-icod-id="src_pages_adminuserspage_tsx_invite_error">{error}</Alert>}
          <Input
            label="Email Address"
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            data-icod-id="src_pages_adminuserspage_tsx_invite_email" />
          <Input
            label="Full Name (optional)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            data-icod-id="src_pages_adminuserspage_tsx_invite_name" />
          <Select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
            data-icod-id="src_pages_adminuserspage_tsx_invite_role">
            <option value="member" data-icod-id="src_pages_adminuserspage_tsx_role_member">Member</option>
            <option value="admin" data-icod-id="src_pages_adminuserspage_tsx_role_admin">Admin</option>
          </Select>
        </form>
      )}
    </Modal>
  );
}

// ─── Users Tab ─────────────────────────────────────────────────────────────

interface UsersTabProps {
  inviteOpen: boolean;
  setInviteOpen: (v: boolean) => void;
}

function UsersTab({ inviteOpen: _inviteOpen, setInviteOpen: _setInviteOpen }: UsersTabProps) {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectAdminUsers);
  const status = useAppSelector(selectAdminUsersStatus);
  const error = useAppSelector(selectAdminUsersError);
  const pagination = useAppSelector(selectAdminUsersPagination);
  const currentUser = useAppSelector(selectCurrentUser);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [filterStatus, setFilterStatus] = useState<'active' | 'deactivated' | 'all'>('all');
  const [page, setPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<{ userId: string; action: 'deactivate' | 'activate' | 'demote'; userName: string } | null>(null);

  useEffect(() => {
    dispatch(fetchAdminUsers({ search: debouncedSearch || undefined, status: filterStatus, page, limit: 20 }));
  }, [dispatch, debouncedSearch, filterStatus, page]);

  function handleToggleStatus(user: AdminUser) {
    if (user.isActive) {
      setConfirmAction({ userId: user.id, action: 'deactivate', userName: user.fullName });
    } else {
      dispatch(updateAdminUserStatus({ userId: user.id, isActive: true }));
    }
  }

  function handleRoleChange(user: AdminUser, newRole: 'admin' | 'member') {
    if (newRole === 'member' && user.role === 'admin') {
      setConfirmAction({ userId: user.id, action: 'demote', userName: user.fullName });
    } else {
      dispatch(updateAdminUserRole({ userId: user.id, role: newRole }));
    }
  }

  function executeConfirmAction() {
    if (!confirmAction) return;
    if (confirmAction.action === 'deactivate') {
      dispatch(updateAdminUserStatus({ userId: confirmAction.userId, isActive: false }));
    } else if (confirmAction.action === 'demote') {
      dispatch(updateAdminUserRole({ userId: confirmAction.userId, role: 'member' }));
    }
    setConfirmAction(null);
  }

  const isCurrentUser = (user: AdminUser) => currentUser?.id === user.id;

  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: 'user',
      header: 'User',
      cell: (user) => (
        <div
          className="flex items-center gap-3"
          data-icod-id={`admin_users_user_cell_${user.id}`}>
          <Avatar name={user.fullName} size="sm" data-icod-id={`admin_users_avatar_${user.id}`} />
          <div className="flex flex-col" data-icod-id={`admin_users_info_${user.id}`}>
            <div className="flex items-center gap-2" data-icod-id={`admin_users_name_row_${user.id}`}>
              <span className="font-medium text-foreground" data-icod-id={`admin_users_name_${user.id}`}>{user.fullName}</span>
              {isCurrentUser(user) && (
                <Badge variant="neutral" size="sm" data-icod-id={`admin_users_you_badge_${user.id}`}>You</Badge>
              )}
            </div>
            <span className="text-token-xs text-muted-foreground" data-icod-id={`admin_users_email_${user.id}`}>{user.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (user) => (
        <Badge variant={roleBadgeVariant(user.role)} data-icod-id={`admin_users_role_${user.id}`}>{capitalize(user.role)}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (user) => (
        <Badge
          variant={user.isActive ? 'status-green' : 'status-gray'}
          data-icod-id={`admin_users_status_${user.id}`}>
          {user.isActive ? 'Active' : 'Deactivated'}
        </Badge>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last login',
      cell: (user) => (
        <span className="text-muted-foreground" data-icod-id={`admin_users_login_${user.id}`}>
          {formatRelativeTime(user.lastLoginAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (user) => {
        if (isCurrentUser(user)) return null;
        return (
          <DropdownMenu
            trigger={
              <IconButton
                size="sm"
                tooltip="Actions"
                data-icod-id={`admin_users_actions_btn_${user.id}`}>
                <MoreHorizontal className="h-4 w-4" data-icod-id={`admin_users_actions_icon_${user.id}`} />
              </IconButton>
            }
            items={[
              {
                label: user.role === 'admin' ? 'Make member' : 'Make admin',
                onClick: () => handleRoleChange(user, user.role === 'admin' ? 'member' : 'admin'),
              },
              {
                label: user.isActive ? 'Deactivate' : 'Reactivate',
                danger: user.isActive,
                onClick: () => handleToggleStatus(user),
              },
            ]}
            data-icod-id={`admin_users_dropdown_${user.id}`} />
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4" data-icod-id="admin_users_tab_root">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4" data-icod-id="admin_users_filters">
        <div className="w-64" data-icod-id="admin_users_search_wrap">
          <Input
            leftIcon={<Search className="h-4 w-4" data-icod-id="admin_users_search_icon" />}
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            data-icod-id="admin_users_search_input" />
        </div>
        <Select
          className="w-40"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as typeof filterStatus); setPage(1); }}
          data-icod-id="admin_users_status_filter">
          <option value="all" data-icod-id="admin_users_filter_all">All Users</option>
          <option value="active" data-icod-id="admin_users_filter_active">Active</option>
          <option value="deactivated" data-icod-id="admin_users_filter_deactivated">Deactivated</option>
        </Select>
      </div>
      {error && <Alert variant="error" data-icod-id="admin_users_error">{error}</Alert>}
      {/* Table */}
      <DataTable
        columns={columns}
        rows={users}
        rowKey={(u) => u.id}
        loading={status === 'loading'}
        emptyState={
          <EmptyState
            icon={Users}
            title="No users found"
            description="Try adjusting your search or filters."
            data-icod-id="admin_users_empty" />
        }
        className="rounded-[var(--radius-lg)] border border-border bg-card"
        data-icod-id="admin_users_table" />
      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        pageSize={20}
        onPageChange={setPage}
        data-icod-id="admin_users_pagination" />
      {/* Confirmation dialog for destructive actions */}
      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction?.action === 'deactivate' ? 'Deactivate User' :
          confirmAction?.action === 'demote' ? 'Demote Admin' : 'Confirm'
        }
        description={
          confirmAction?.action === 'deactivate'
            ? `Are you sure you want to deactivate ${confirmAction?.userName}? They will lose access immediately.`
            : confirmAction?.action === 'demote'
            ? `Are you sure you want to remove admin privileges from ${confirmAction?.userName}?`
            : ''
        }
        confirmLabel={
          confirmAction?.action === 'deactivate' ? 'Deactivate' :
          confirmAction?.action === 'demote' ? 'Demote' : 'Confirm'
        }
        onConfirm={executeConfirmAction}
        data-icod-id="admin_users_confirm" />
    </div>
  );
}

// ─── Invitations Tab ───────────────────────────────────────────────────────

interface InvitationsTabProps {
  inviteOpen: boolean;
  setInviteOpen: (v: boolean) => void;
}

function InvitationsTab({ inviteOpen, setInviteOpen }: InvitationsTabProps) {
  const dispatch = useAppDispatch();
  const invitations = useAppSelector(selectAdminInvitations);
  const status = useAppSelector(selectAdminInvitationsStatus);
  const error = useAppSelector(selectAdminInvitationsError);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [regenResult, setRegenResult] = useState<{ invitePath: string } | null>(null);

  useEffect(() => {
    dispatch(fetchAdminInvitations());
  }, [dispatch]);

  async function handleRegenerate(id: string) {
    try {
      const result = await dispatch(regenerateAdminInvitation(id)).unwrap();
      setRegenResult({ invitePath: result.invitePath });
    } catch {
      // Error handled by slice
    }
  }

  function handleRevoke(id: string) {
    setRevokeTarget(id);
  }

  function executeRevoke() {
    if (revokeTarget) {
      dispatch(revokeAdminInvitation(revokeTarget));
      setRevokeTarget(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  function getInvitedByName(inv: InvitationItem): string {
    if (typeof inv.invitedBy === 'string') return inv.invitedBy;
    return inv.invitedBy?.fullName || '-';
  }

  const columns: DataTableColumn<InvitationItem>[] = [
    {
      key: 'email',
      header: 'Email',
      cell: (inv) => (
        <span className="font-medium text-foreground" data-icod-id={`admin_inv_email_${inv.id}`}>{inv.email}</span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (inv) => (
        <Badge variant={roleBadgeVariant(inv.role)} data-icod-id={`admin_inv_role_${inv.id}`}>{capitalize(inv.role)}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (inv) => (
        <Badge variant={statusBadgeVariant(inv.status)} data-icod-id={`admin_inv_status_${inv.id}`}>{capitalize(inv.status)}</Badge>
      ),
    },
    {
      key: 'invitedBy',
      header: 'Invited by',
      cell: (inv) => (
        <span className="text-muted-foreground" data-icod-id={`admin_inv_by_${inv.id}`}>{getInvitedByName(inv)}</span>
      ),
    },
    {
      key: 'date',
      header: 'Expires / Accepted',
      cell: (inv) => (
        <span className="text-muted-foreground" data-icod-id={`admin_inv_date_${inv.id}`}>
          {inv.acceptedAt ? formatDate(inv.acceptedAt) : formatDate(inv.expiresAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (inv) => {
        if (inv.status !== 'pending' && inv.status !== 'expired') return null;
        return (
          <DropdownMenu
            trigger={
              <IconButton
                size="sm"
                tooltip="Actions"
                data-icod-id={`admin_inv_actions_btn_${inv.id}`}>
                <MoreHorizontal className="h-4 w-4" data-icod-id={`admin_inv_actions_icon_${inv.id}`} />
              </IconButton>
            }
            items={[
              {
                label: 'Regenerate link',
                icon: <RefreshCw className="h-4 w-4" data-icod-id={`admin_inv_regen_icon_${inv.id}`} />,
                onClick: () => handleRegenerate(inv.id),
              },
              {
                label: 'Revoke',
                icon: <XCircle className="h-4 w-4" data-icod-id={`admin_inv_revoke_icon_${inv.id}`} />,
                danger: true,
                onClick: () => handleRevoke(inv.id),
              },
            ]}
            data-icod-id={`admin_inv_dropdown_${inv.id}`} />
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4" data-icod-id="admin_inv_tab_root">
      {error && <Alert variant="error" data-icod-id="admin_inv_error">{error}</Alert>}
      <DataTable
        columns={columns}
        rows={invitations}
        rowKey={(inv) => inv.id}
        loading={status === 'loading'}
        emptyState={
          <EmptyState
            compact
            icon={Mail}
            title="No invitations yet."
            description="Send an invitation to add a new team member."
            action={<Button onClick={() => setInviteOpen(true)} data-icod-id="admin_inv_empty_btn">Send Invitation</Button>}
            data-icod-id="admin_inv_empty" />
        }
        className="rounded-[var(--radius-lg)] border border-border bg-card"
        data-icod-id="admin_inv_table" />
      {/* Regenerated link modal */}
      <Modal
        open={!!regenResult}
        onClose={() => setRegenResult(null)}
        title="Link Regenerated"
        footer={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRegenResult(null)}
            data-icod-id="admin_inv_regen_done">Done</Button>
        }
        data-icod-id="admin_inv_regen_modal">
        {regenResult && (
          <div className="flex flex-col gap-3" data-icod-id="admin_inv_regen_content">
            <p className="text-sm text-muted-foreground" data-icod-id="admin_inv_regen_text">
              A new invitation link has been generated:
            </p>
            <CopyField
              value={buildInviteLink(regenResult.invitePath)}
              data-icod-id="admin_inv_regen_copy" />
            <p className="text-xs text-muted-foreground" data-icod-id="admin_inv_regen_note">
              This link is shown only once and expires in 7 days.
            </p>
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        title="Revoke Invitation"
        description="Are you sure you want to revoke this invitation? The link will become invalid immediately."
        confirmLabel="Revoke"
        onConfirm={executeRevoke}
        data-icod-id="admin_inv_revoke_confirm" />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

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
          description="Manage who has access to GridFlow"
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
        {activeTab === 'users' && <UsersTab inviteOpen={inviteOpen} setInviteOpen={setInviteOpen} data-icod-id="admin_page_users_tab" />}
        {activeTab === 'invitations' && <InvitationsTab inviteOpen={inviteOpen} setInviteOpen={setInviteOpen} data-icod-id="admin_page_inv_tab" />}
      </div>
      <InviteModal
        open={inviteOpen}
        onClose={handleCloseInvite}
        data-icod-id="admin_page_invite_modal" />
    </PageContainer>
  );
}
