import { useState, useCallback } from 'react';
import { Modal, Button, Select, useToast, ConfirmDialog, Avatar, WorkspaceIcon } from '@/components/ui';
import RoleMenu from '@/components/ui/RoleMenu';
import type { RoleValue } from '@/components/ui/RoleMenu';
import UserPicker from '@/components/ui/UserPicker';
import type { UserOption } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { addMember, removeMember, updateMemberRole } from '@/store/slices/workspaceSlice';
import { searchUsers as searchUsersApi } from '@/services/workspaceService';
import { useWorkspaceAccessLost } from '@/hooks/useWorkspaceAccessLost';
import type { Workspace, WorkspaceRole } from '@/types';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  workspace: Workspace;
}

export default function ShareModal({ open, onClose, workspace }: ShareModalProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const { addToast } = useToast();
  const { handleActionError } = useWorkspaceAccessLost();

  // Add-people state
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole>('editor');
  const [adding, setAdding] = useState(false);

  // Confirm-remove state
  const [confirmRemove, setConfirmRemove] = useState<{ memberId: string; memberName: string; isSelf: boolean } | null>(null);

  // Determine current user's role in this workspace
  const currentMember = workspace.members.find((m) => m.id === user?.id);
  const currentUserRole = currentMember?.role ?? null;
  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

  // Build a set of existing member IDs for filtering search results
  const existingMemberIds = new Set(workspace.members.map((m) => m.id));

  // Search function for UserPicker — excludes existing members
  const handleSearch = useCallback(
    async (query: string): Promise<UserOption[]> => {
      try {
        const res = await searchUsersApi(workspace.id, query);
        const results = (res.data.data as Array<{ _id: string; fullName: string; email: string }>) || [];
        return results
          .filter((r) => !existingMemberIds.has(r._id))
          .map((r) => ({ id: r._id, fullName: r.fullName, email: r.email }));
      } catch {
        return [];
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspace.id],
  );

  async function handleAddMember() {
    if (!selectedUser) return;
    setAdding(true);
    try {
      await dispatch(addMember({ workspaceId: workspace.id, data: { userId: selectedUser.id, role: selectedRole } })).unwrap();
      addToast('success', 'Member added');
      setSelectedUser(null);
      setSelectedRole('editor');
    } catch (err) {
      handleActionError(err);
    } finally {
      setAdding(false);
    }
  }

  async function handleRoleChange(memberId: string, role: WorkspaceRole) {
    try {
      await dispatch(updateMemberRole({ workspaceId: workspace.id, memberId, role })).unwrap();
      addToast('success', 'Role updated');
    } catch (err) {
      handleActionError(err);
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      await dispatch(removeMember({ workspaceId: workspace.id, memberId })).unwrap();
      addToast('success', 'Member removed');
      setConfirmRemove(null);
    } catch (err) {
      handleActionError(err);
    }
  }

  function handleClose() {
    onClose();
    setSelectedUser(null);
    setSelectedRole('editor');
  }

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title="Share workspace"
        size="lg"
        footer={
          <Button
            variant="secondary"
            onClick={handleClose}
            data-icod-id="src_features_workspaces_sharemodal_tsx_c3c5">Done</Button>
        }
        data-icod-id="src_features_workspaces_sharemodal_tsx_b50a">
        {/* Subtitle */}
        <div
          className="flex items-center gap-2 -mt-2 mb-2"
          data-icod-id="src_features_workspaces_sharemodal_tsx_149e">
          <WorkspaceIcon
            name={workspace.name}
            color={workspace.color}
            size="sm"
            data-icod-id="src_features_workspaces_sharemodal_tsx_ecba" />
          <span
            className="text-sm text-muted-foreground truncate"
            data-icod-id="src_features_workspaces_sharemodal_tsx_ac62">{workspace.name}</span>
        </div>

        {/* Zone A — Add people (owner/admin only) */}
        {canManage && (
          <div
            className="flex items-center gap-2 mb-4"
            data-icod-id="src_features_workspaces_sharemodal_tsx_d730">
            <UserPicker
              placeholder="Search by name or email…"
              onSearch={handleSearch}
              value={selectedUser}
              onChange={setSelectedUser}
              containerClassName="flex-1 min-w-0"
              data-icod-id="src_features_workspaces_sharemodal_tsx_5c9b" />
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as WorkspaceRole)}
              size="md"
              containerClassName="w-36 shrink-0"
              data-icod-id="src_features_workspaces_sharemodal_tsx_f91d">
              <option value="admin" data-icod-id="src_features_workspaces_sharemodal_tsx_0e48">Admin · manage members</option>
              <option value="editor" data-icod-id="src_features_workspaces_sharemodal_tsx_e59e">Editor · edit sheets</option>
              <option value="viewer" data-icod-id="src_features_workspaces_sharemodal_tsx_0a3a">Viewer · view only</option>
            </Select>
            <Button
              size="md"
              disabled={!selectedUser}
              loading={adding}
              onClick={handleAddMember}
              data-icod-id="src_features_workspaces_sharemodal_tsx_2dd7">
              Add
            </Button>
          </div>
        )}

        {/* Zone B — People with access header */}
        <div
          className="flex items-center gap-2 mb-1"
          data-icod-id="src_features_workspaces_sharemodal_tsx_a70c">
          <span
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            data-icod-id="src_features_workspaces_sharemodal_tsx_c9eb">
            People with access
          </span>
          <span
            className="text-xs text-muted-foreground"
            data-icod-id="src_features_workspaces_sharemodal_tsx_8a6f">
            {workspace.members.length}
          </span>
        </div>

        {/* Zone C — Member list (scrollable) */}
        <div
          className="overflow-y-auto max-h-80 -mx-2 px-2"
          data-icod-id="src_features_workspaces_sharemodal_tsx_5367">
          {workspace.members.map((member) => {
            const isOwner = member.id === workspace.owner;
            const isSelf = member.id === user?.id;

            // Determine right-hand control
            let roleControl: React.ReactNode;
            if (isOwner) {
              // Owner row — plain muted text
              roleControl = (
                <span
                  className="text-sm text-muted-foreground"
                  data-icod-id={`src_features_workspaces_sharemodal_tsx_7b1d_${member.id}`}>Owner</span>
              );
            } else if (isSelf) {
              // Current user's own row (non-owner) — RoleMenu with onLeave only
              roleControl = (
                <RoleMenu
                  value={member.role as RoleValue}
                  onChange={() => {/* no-op — can't change own role */}}
                  onLeave={() => setConfirmRemove({ memberId: member.id, memberName: member.fullName, isSelf: true })}
                  data-icod-id={`src_features_workspaces_sharemodal_tsx_e1e9_${member.id}`} />
              );
            } else if (canManage) {
              // Another member, viewed by owner/admin — full RoleMenu with onChange + onRemove
              roleControl = (
                <RoleMenu
                  value={member.role as RoleValue}
                  onChange={(role) => handleRoleChange(member.id, role as WorkspaceRole)}
                  onRemove={() => setConfirmRemove({ memberId: member.id, memberName: member.fullName, isSelf: false })}
                  data-icod-id={`src_features_workspaces_sharemodal_tsx_a7be_${member.id}`} />
              );
            } else {
              // Another member, viewed by editor/viewer — read-only text
              roleControl = (
                <span
                  className="text-sm capitalize text-muted-foreground"
                  data-icod-id={`src_features_workspaces_sharemodal_tsx_403f_${member.id}`}>{member.role}</span>
              );
            }

            return (
              <div
                key={member.id}
                className="flex h-12 items-center gap-3 px-1 py-2"
                data-icod-id={`src_features_workspaces_sharemodal_tsx_691e_${member.id}`}>
                <Avatar
                  name={member.fullName}
                  size="sm"
                  data-icod-id={`src_features_workspaces_sharemodal_tsx_c9e1_${member.id}`} />
                <div
                  className="min-w-0 flex-1"
                  data-icod-id={`src_features_workspaces_sharemodal_tsx_adc1_${member.id}`}>
                  <div
                    className="truncate text-sm font-medium text-foreground"
                    data-icod-id={`src_features_workspaces_sharemodal_tsx_552d_${member.id}`}>
                    {member.fullName}
                    {isSelf && <span
                      className="text-muted-foreground"
                      data-icod-id={`src_features_workspaces_sharemodal_tsx_219a_${member.id}`}> (you)</span>}
                  </div>
                  <div
                    className="truncate text-xs text-muted-foreground"
                    data-icod-id={`src_features_workspaces_sharemodal_tsx_cf72_${member.id}`}>{member.email}</div>
                </div>
                {roleControl}
              </div>
            );
          })}
        </div>

        {/* Read-only note for viewer/editor */}
        {!canManage && (
          <p
            className="mt-2 text-xs italic text-muted-foreground"
            data-icod-id="src_features_workspaces_sharemodal_tsx_168c">
            Only owners and admins can manage members.
          </p>
        )}
      </Modal>
      {/* Confirm remove/leave dialog */}
      {confirmRemove && (
        <ConfirmDialog
          open={!!confirmRemove}
          onClose={() => setConfirmRemove(null)}
          title={confirmRemove.isSelf ? 'Leave workspace?' : 'Remove member?'}
          description={
            confirmRemove.isSelf
              ? 'You will lose access to this workspace and all its sheets.'
              : `${confirmRemove.memberName} will lose access to the workspace.`
          }
          confirmLabel={confirmRemove.isSelf ? 'Leave' : 'Remove'}
          onConfirm={() => handleRemoveMember(confirmRemove.memberId)}
          data-icod-id="src_features_workspaces_sharemodal_tsx_43e5" />
      )}
    </>
  );
}
