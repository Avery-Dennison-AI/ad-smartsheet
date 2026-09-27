import { useState, useEffect } from 'react';
import { Mail, RefreshCw, XCircle, MoreHorizontal } from 'lucide-react';
import {
  Button,
  Badge,
  EmptyState,
  Modal,
  Alert,
  ConfirmDialog,
  DropdownMenu,
  DataTable,
  CopyField,
  IconButton,
} from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchAdminInvitations,
  regenerateAdminInvitation,
  revokeAdminInvitation,
  selectAdminInvitations,
  selectAdminInvitationsStatus,
  selectAdminInvitationsError,
} from '@/store/slices/adminSlice';
import { buildInviteLink } from '@/utils/inviteLink';
import { statusBadgeVariant, roleBadgeVariant, capitalize } from './helpers';
import type { InvitationItem } from '@/types';

interface InvitationsTabProps {
  onInvite: () => void;
}

export default function InvitationsTab({ onInvite }: InvitationsTabProps) {
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
            action={<Button onClick={onInvite} data-icod-id="admin_inv_empty_btn">Send Invitation</Button>}
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
