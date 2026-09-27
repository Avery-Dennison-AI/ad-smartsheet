import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Avatar, Badge, DropdownMenu, ConfirmDialog } from '@/components/ui';
import type { WorkspaceMember, WorkspaceRole } from '@/types';

interface WorkspaceMemberRowProps {
  member: WorkspaceMember;
  currentUserId: string;
  currentUserRole: WorkspaceRole | null;
  workspaceOwnerId: string;
  onRoleChange: (memberId: string, role: WorkspaceRole) => void;
  onRemove: (memberId: string) => void;
}

const ROLE_OPTIONS: { value: WorkspaceRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
];

export default function WorkspaceMemberRow({
  member,
  currentUserId,
  currentUserRole,
  workspaceOwnerId,
  onRoleChange,
  onRemove,
}: WorkspaceMemberRowProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isOwner = member.user._id === workspaceOwnerId;
  const isSelf = member.user._id === currentUserId;
  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

  // Build dropdown items based on permissions
  const menuItems: Array<{ type?: 'item' | 'divider'; label?: string; onClick?: () => void; danger?: boolean }> = [];

  if (canManage && !isOwner) {
    // Role change options
    for (const opt of ROLE_OPTIONS) {
      if (opt.value !== member.role) {
        menuItems.push({
          label: `Change to ${opt.label}`,
          onClick: () => onRoleChange(member.user._id, opt.value),
        });
      }
    }
    if (menuItems.length > 0) {
      menuItems.push({ type: 'divider' });
    }
    menuItems.push({
      label: 'Remove',
      danger: true,
      onClick: () => setConfirmOpen(true),
    });
  } else if (isSelf && !isOwner) {
    menuItems.push({
      label: 'Leave workspace',
      danger: true,
      onClick: () => setConfirmOpen(true),
    });
  }

  return (
    <>
      <div
        className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 transition-colors hover:bg-muted/50"
        data-icod-id="src_features_workspaces_workspacememberrow_tsx_5b80">
        <Avatar
          name={member.user.name}
          size="sm"
          data-icod-id="src_features_workspaces_workspacememberrow_tsx_f4dc" />
        <div
          className="min-w-0 flex-1"
          data-icod-id="src_features_workspaces_workspacememberrow_tsx_be57">
          <div
            className="truncate text-sm font-medium text-foreground"
            data-icod-id="src_features_workspaces_workspacememberrow_tsx_2a70">{member.user.name}</div>
          <div
            className="truncate text-xs text-muted-foreground"
            data-icod-id="src_features_workspaces_workspacememberrow_tsx_6db1">{member.user.email}</div>
        </div>
        {isOwner ? (
          <Badge
            variant="neutral"
            size="sm"
            data-icod-id="src_features_workspaces_workspacememberrow_tsx_5b76">Owner</Badge>
        ) : (
          <Badge
            variant="neutral"
            size="sm"
            data-icod-id="src_features_workspaces_workspacememberrow_tsx_8b01">{member.role}</Badge>
        )}
        {menuItems.length > 0 && (
          <DropdownMenu
            trigger={<MoreHorizontal
              className="h-4 w-4 text-muted-foreground cursor-pointer"
              data-icod-id="src_features_workspaces_workspacememberrow_tsx_7593" />}
            items={menuItems}
            data-icod-id="src_features_workspaces_workspacememberrow_tsx_0de4" />
        )}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={isSelf ? 'Leave workspace?' : 'Remove member?'}
        description={
          isSelf
            ? 'You will lose access to this workspace and all its sheets.'
            : `${member.user.name} will lose access to this workspace.`
        }
        confirmLabel={isSelf ? 'Leave' : 'Remove'}
        onConfirm={() => onRemove(member.user._id)}
        data-icod-id="src_features_workspaces_workspacememberrow_tsx_5472" />
    </>
  );
}
