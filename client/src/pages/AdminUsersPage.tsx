import { useState, useEffect, type FormEvent } from 'react';
import { Search, Plus, Users, Mail, Copy, RefreshCw, XCircle, MoreHorizontal } from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Select,
  Badge,
  Tabs,
  PageHeader,
  Spinner,
  EmptyState,
  Modal,
  Alert,
  ConfirmDialog,
  DropdownMenu,
} from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
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
import type { AdminUser, InvitationItem, InvitationStatus } from '@/types';

// ─── Status badge variant mapping ──────────────────────────────────────────

function statusBadgeVariant(status: InvitationStatus): 'status-blue' | 'status-green' | 'status-red' | 'status-gray' {
  switch (status) {
    case 'pending': return 'status-blue';
    case 'accepted': return 'status-green';
    case 'revoked': return 'status-red';
    case 'expired': return 'status-gray';
  }
}

function roleBadgeVariant(role: string): 'status-blue' | 'neutral' {
  return role === 'admin' ? 'status-blue' : 'neutral';
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
  const [copied, setCopied] = useState(false);

  function resetForm() {
    setEmail('');
    setFullName('');
    setRole('member');
    setError(null);
    setInvitePath(null);
    setCopied(false);
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

  function handleCopyLink() {
    if (!invitePath) return;
    const fullUrl = `${window.location.origin}${invitePath}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Send Invitation"
      footer={
        invitePath ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClose}
            data-icod-id="src_pages_adminuserspage_tsx_beb4">Done</Button>
        ) : (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClose}
              data-icod-id="src_pages_adminuserspage_tsx_e548">Cancel</Button>
            <Button
              size="sm"
              loading={loading}
              onClick={() => document.getElementById('invite-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
              data-icod-id="src_pages_adminuserspage_tsx_4d64">Send Invitation</Button>
          </>
        )
      }
      data-icod-id="src_pages_adminuserspage_tsx_5097">
      {invitePath ? (
        <div
          className="flex flex-col gap-3"
          data-icod-id="src_pages_adminuserspage_tsx_6fb3">
          <p
            className="text-sm text-muted-foreground"
            data-icod-id="src_pages_adminuserspage_tsx_9c6e">
            Invitation created successfully. Share this link with the invitee:
          </p>
          <div
            className="flex items-center gap-2"
            data-icod-id="src_pages_adminuserspage_tsx_d869">
            <div
              className="flex-1 truncate rounded-[var(--radius)] border border-border bg-muted px-3 py-2 text-sm text-muted-foreground font-mono"
              data-icod-id="src_pages_adminuserspage_tsx_0820">
              {window.location.origin}{invitePath}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyLink}
              data-icod-id="src_pages_adminuserspage_tsx_6933">
              {copied ? 'Copied!' : <><Copy className="h-4 w-4 mr-1" data-icod-id="src_pages_adminuserspage_tsx_8ffd" /> Copy</>}
            </Button>
          </div>
        </div>
      ) : (
        <form
          id="invite-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          data-icod-id="src_pages_adminuserspage_tsx_0d02">
          {error && <Alert variant="error" data-icod-id="src_pages_adminuserspage_tsx_4510">{error}</Alert>}
          <Input
            label="Email Address"
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            data-icod-id="src_pages_adminuserspage_tsx_122c" />
          <Input
            label="Full Name (optional)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            data-icod-id="src_pages_adminuserspage_tsx_bf6a" />
          <Select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
            data-icod-id="src_pages_adminuserspage_tsx_03e3">
            <option value="member" data-icod-id="src_pages_adminuserspage_tsx_229a">Member</option>
            <option value="admin" data-icod-id="src_pages_adminuserspage_tsx_6340">Admin</option>
          </Select>
        </form>
      )}
    </Modal>
  );
}

// ─── Users Tab ─────────────────────────────────────────────────────────────

function UsersTab() {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectAdminUsers);
  const status = useAppSelector(selectAdminUsersStatus);
  const error = useAppSelector(selectAdminUsersError);
  const pagination = useAppSelector(selectAdminUsersPagination);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'active' | 'deactivated' | 'all'>('all');
  const [page, setPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<{ userId: string; action: 'deactivate' | 'activate' | 'demote'; userName: string } | null>(null);

  useEffect(() => {
    dispatch(fetchAdminUsers({ search: search || undefined, status: filterStatus, page, limit: 20 }));
  }, [dispatch, search, filterStatus, page]);

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

  return (
    <div
      className="flex flex-col gap-4"
      data-icod-id="src_pages_adminuserspage_tsx_4278">
      {/* Filters */}
      <div
        className="flex flex-col sm:flex-row gap-3"
        data-icod-id="src_pages_adminuserspage_tsx_14e2">
        <div
          className="relative flex-1"
          data-icod-id="src_pages_adminuserspage_tsx_fc98">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            data-icod-id="src_pages_adminuserspage_tsx_d547" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-[var(--radius)] border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:shadow-[var(--focus-ring)]"
            data-icod-id="src_pages_adminuserspage_tsx_247f" />
        </div>
        <Select
          className="w-full sm:w-40"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as typeof filterStatus); setPage(1); }}
          data-icod-id="src_pages_adminuserspage_tsx_dc66">
          <option value="all" data-icod-id="src_pages_adminuserspage_tsx_ae3a">All Users</option>
          <option value="active" data-icod-id="src_pages_adminuserspage_tsx_74ee">Active</option>
          <option value="deactivated" data-icod-id="src_pages_adminuserspage_tsx_fe19">Deactivated</option>
        </Select>
      </div>
      {error && <Alert variant="error" data-icod-id="src_pages_adminuserspage_tsx_c95f">{error}</Alert>}
      {/* Table */}
      {status === 'loading' ? (
        <div
          className="flex justify-center py-12"
          data-icod-id="src_pages_adminuserspage_tsx_a4cf"><Spinner size="lg" data-icod-id="src_pages_adminuserspage_tsx_4455" /></div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Try adjusting your search or filters."
          data-icod-id="src_pages_adminuserspage_tsx_e939" />
      ) : (
        <Card
          className="overflow-hidden p-0"
          data-icod-id="src_pages_adminuserspage_tsx_6f46">
          <div
            className="overflow-x-auto"
            data-icod-id="src_pages_adminuserspage_tsx_12c8">
            <table
              className="w-full text-left text-sm"
              data-icod-id="src_pages_adminuserspage_tsx_068b">
              <thead
                className="border-b border-border bg-muted/50"
                data-icod-id="src_pages_adminuserspage_tsx_c167">
                <tr data-icod-id="src_pages_adminuserspage_tsx_b3ae">
                  <th
                    className="px-4 py-3 font-medium text-muted-foreground"
                    data-icod-id="src_pages_adminuserspage_tsx_9fc4">Name</th>
                  <th
                    className="px-4 py-3 font-medium text-muted-foreground"
                    data-icod-id="src_pages_adminuserspage_tsx_bd3a">Email</th>
                  <th
                    className="px-4 py-3 font-medium text-muted-foreground"
                    data-icod-id="src_pages_adminuserspage_tsx_2b96">Role</th>
                  <th
                    className="px-4 py-3 font-medium text-muted-foreground"
                    data-icod-id="src_pages_adminuserspage_tsx_4250">Status</th>
                  <th
                    className="px-4 py-3 font-medium text-muted-foreground"
                    data-icod-id="src_pages_adminuserspage_tsx_504a">Last Login</th>
                  <th
                    className="px-4 py-3 font-medium text-muted-foreground text-right"
                    data-icod-id="src_pages_adminuserspage_tsx_5241">Actions</th>
                </tr>
              </thead>
              <tbody
                className="divide-y divide-border"
                data-icod-id="src_pages_adminuserspage_tsx_2845">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-muted/30 transition-colors"
                    data-icod-id={`src_pages_adminuserspage_tsx_8a58_${user.id}`}>
                    <td
                      className="px-4 py-3 font-medium text-foreground"
                      data-icod-id={`src_pages_adminuserspage_tsx_3607_${user.id}`}>{user.fullName}</td>
                    <td
                      className="px-4 py-3 text-muted-foreground"
                      data-icod-id={`src_pages_adminuserspage_tsx_3937_${user.id}`}>{user.email}</td>
                    <td
                      className="px-4 py-3"
                      data-icod-id={`src_pages_adminuserspage_tsx_92f1_${user.id}`}>
                      <DropdownMenu
                        trigger={
                          <button
                            className="cursor-pointer"
                            data-icod-id={`src_pages_adminuserspage_tsx_b158_${user.id}`}>
                            <Badge
                              variant={roleBadgeVariant(user.role)}
                              data-icod-id={`src_pages_adminuserspage_tsx_ba57_${user.id}`}>{user.role}</Badge>
                          </button>
                        }
                        items={[
                          { label: 'Admin', onClick: () => handleRoleChange(user, 'admin') },
                          { label: 'Member', onClick: () => handleRoleChange(user, 'member') },
                        ]}
                        data-icod-id={`src_pages_adminuserspage_tsx_26af_${user.id}`} />
                    </td>
                    <td
                      className="px-4 py-3"
                      data-icod-id={`src_pages_adminuserspage_tsx_1439_${user.id}`}>
                      <Badge
                        variant={user.isActive ? 'status-green' : 'status-red'}
                        data-icod-id={`src_pages_adminuserspage_tsx_4ff7_${user.id}`}>
                        {user.isActive ? 'Active' : 'Deactivated'}
                      </Badge>
                    </td>
                    <td
                      className="px-4 py-3 text-muted-foreground"
                      data-icod-id={`src_pages_adminuserspage_tsx_5610_${user.id}`}>
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td
                      className="px-4 py-3 text-right"
                      data-icod-id={`src_pages_adminuserspage_tsx_c096_${user.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(user)}
                        data-icod-id={`src_pages_adminuserspage_tsx_1a0a_${user.id}`}>
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div
          className="flex items-center justify-between text-sm text-muted-foreground"
          data-icod-id="src_pages_adminuserspage_tsx_8787">
          <span data-icod-id="src_pages_adminuserspage_tsx_ab4f">Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, pagination.total)} of {pagination.total}</span>
          <div className="flex gap-2" data-icod-id="src_pages_adminuserspage_tsx_be93">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              data-icod-id="src_pages_adminuserspage_tsx_85d3">Previous</Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              data-icod-id="src_pages_adminuserspage_tsx_42c4">Next</Button>
          </div>
        </div>
      )}
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
        data-icod-id="src_pages_adminuserspage_tsx_042b" />
    </div>
  );
}

// ─── Invitations Tab ───────────────────────────────────────────────────────

function InvitationsTab() {
  const dispatch = useAppDispatch();
  const invitations = useAppSelector(selectAdminInvitations);
  const status = useAppSelector(selectAdminInvitationsStatus);
  const error = useAppSelector(selectAdminInvitationsError);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchAdminInvitations());
  }, [dispatch]);

  function handleRegenerate(id: string) {
    dispatch(regenerateAdminInvitation(id));
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

  return (
    <div
      className="flex flex-col gap-4"
      data-icod-id="src_pages_adminuserspage_tsx_8eef">
      <div
        className="flex justify-end"
        data-icod-id="src_pages_adminuserspage_tsx_371d">
        <Button
          onClick={() => setInviteModalOpen(true)}
          data-icod-id="src_pages_adminuserspage_tsx_85ed">
          <Plus className="h-4 w-4 mr-2" data-icod-id="src_pages_adminuserspage_tsx_a3d1" /> Send Invitation
        </Button>
      </div>
      {error && <Alert variant="error" data-icod-id="src_pages_adminuserspage_tsx_3277">{error}</Alert>}
      {status === 'loading' ? (
        <div
          className="flex justify-center py-12"
          data-icod-id="src_pages_adminuserspage_tsx_b2e7"><Spinner size="lg" data-icod-id="src_pages_adminuserspage_tsx_8627" /></div>
      ) : invitations.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No invitations"
          description="Send an invitation to add a new team member."
          action={<Button
            onClick={() => setInviteModalOpen(true)}
            data-icod-id="src_pages_adminuserspage_tsx_deb6">Send Invitation</Button>}
          data-icod-id="src_pages_adminuserspage_tsx_3d02" />
      ) : (
        <Card
          className="overflow-hidden p-0"
          data-icod-id="src_pages_adminuserspage_tsx_9558">
          <div
            className="overflow-x-auto"
            data-icod-id="src_pages_adminuserspage_tsx_5765">
            <table
              className="w-full text-left text-sm"
              data-icod-id="src_pages_adminuserspage_tsx_ddb4">
              <thead
                className="border-b border-border bg-muted/50"
                data-icod-id="src_pages_adminuserspage_tsx_aa0b">
                <tr data-icod-id="src_pages_adminuserspage_tsx_aed1">
                  <th
                    className="px-4 py-3 font-medium text-muted-foreground"
                    data-icod-id="src_pages_adminuserspage_tsx_6da3">Email</th>
                  <th
                    className="px-4 py-3 font-medium text-muted-foreground"
                    data-icod-id="src_pages_adminuserspage_tsx_5c73">Name</th>
                  <th
                    className="px-4 py-3 font-medium text-muted-foreground"
                    data-icod-id="src_pages_adminuserspage_tsx_22c1">Role</th>
                  <th
                    className="px-4 py-3 font-medium text-muted-foreground"
                    data-icod-id="src_pages_adminuserspage_tsx_a8a0">Status</th>
                  <th
                    className="px-4 py-3 font-medium text-muted-foreground"
                    data-icod-id="src_pages_adminuserspage_tsx_d700">Sent</th>
                  <th
                    className="px-4 py-3 font-medium text-muted-foreground"
                    data-icod-id="src_pages_adminuserspage_tsx_4336">Expires</th>
                  <th
                    className="px-4 py-3 font-medium text-muted-foreground text-right"
                    data-icod-id="src_pages_adminuserspage_tsx_441e">Actions</th>
                </tr>
              </thead>
              <tbody
                className="divide-y divide-border"
                data-icod-id="src_pages_adminuserspage_tsx_a2db">
                {invitations.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-muted/30 transition-colors"
                    data-icod-id={`src_pages_adminuserspage_tsx_55bf_${inv.id}`}>
                    <td
                      className="px-4 py-3 font-medium text-foreground"
                      data-icod-id={`src_pages_adminuserspage_tsx_603f_${inv.id}`}>{inv.email}</td>
                    <td
                      className="px-4 py-3 text-muted-foreground"
                      data-icod-id={`src_pages_adminuserspage_tsx_ccd4_${inv.id}`}>{inv.fullName || '-'}</td>
                    <td
                      className="px-4 py-3"
                      data-icod-id={`src_pages_adminuserspage_tsx_db73_${inv.id}`}>
                      <Badge
                        variant={roleBadgeVariant(inv.role)}
                        data-icod-id={`src_pages_adminuserspage_tsx_58d0_${inv.id}`}>{inv.role}</Badge>
                    </td>
                    <td
                      className="px-4 py-3"
                      data-icod-id={`src_pages_adminuserspage_tsx_fd69_${inv.id}`}>
                      <Badge
                        variant={statusBadgeVariant(inv.status)}
                        data-icod-id={`src_pages_adminuserspage_tsx_a6b4_${inv.id}`}>{inv.status}</Badge>
                    </td>
                    <td
                      className="px-4 py-3 text-muted-foreground"
                      data-icod-id={`src_pages_adminuserspage_tsx_e14f_${inv.id}`}>{formatDate(inv.createdAt)}</td>
                    <td
                      className="px-4 py-3 text-muted-foreground"
                      data-icod-id={`src_pages_adminuserspage_tsx_1829_${inv.id}`}>{formatDate(inv.expiresAt)}</td>
                    <td
                      className="px-4 py-3 text-right"
                      data-icod-id={`src_pages_adminuserspage_tsx_7828_${inv.id}`}>
                      {(inv.status === 'pending' || inv.status === 'expired') && (
                        <DropdownMenu
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              data-icod-id={`src_pages_adminuserspage_tsx_e31f_${inv.id}`}>
                              <MoreHorizontal
                                className="h-4 w-4"
                                data-icod-id={`src_pages_adminuserspage_tsx_d96f_${inv.id}`} />
                            </Button>
                          }
                          items={[
                            { label: 'Regenerate Link', icon: <RefreshCw
                              className="h-4 w-4"
                              data-icod-id={`src_pages_adminuserspage_tsx_5fb9_${inv.id}`} />, onClick: () => handleRegenerate(inv.id) },
                            { label: 'Revoke', icon: <XCircle
                              className="h-4 w-4"
                              data-icod-id={`src_pages_adminuserspage_tsx_ae47_${inv.id}`} />, onClick: () => handleRevoke(inv.id) },
                          ]}
                          data-icod-id={`src_pages_adminuserspage_tsx_00ce_${inv.id}`} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <InviteModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        data-icod-id="src_pages_adminuserspage_tsx_d346" />
      <ConfirmDialog
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        title="Revoke Invitation"
        description="Are you sure you want to revoke this invitation? The link will become invalid immediately."
        confirmLabel="Revoke"
        onConfirm={executeRevoke}
        data-icod-id="src_pages_adminuserspage_tsx_13bd" />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', label: 'Users', icon: <Users className="h-4 w-4" data-icod-id="src_pages_adminuserspage_tsx_dd99" /> },
    { id: 'invitations', label: 'Invitations', icon: <Mail className="h-4 w-4" data-icod-id="src_pages_adminuserspage_tsx_f5bb" /> },
  ];

  return (
    <div
      className="flex flex-col gap-6 p-6"
      data-icod-id="src_pages_adminuserspage_tsx_d308">
      <PageHeader
        title="User Management"
        description="Manage team members and send invitations"
        data-icod-id="src_pages_adminuserspage_tsx_c484" />
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        data-icod-id="src_pages_adminuserspage_tsx_a230" />
      {activeTab === 'users' && <UsersTab data-icod-id="src_pages_adminuserspage_tsx_d912" />}
      {activeTab === 'invitations' && <InvitationsTab data-icod-id="src_pages_adminuserspage_tsx_5a4e" />}
    </div>
  );
}
