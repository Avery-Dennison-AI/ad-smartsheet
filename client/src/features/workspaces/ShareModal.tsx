import { useState, useCallback } from 'react';
import { Modal, Button, Select, useToast, ConfirmDialog, Avatar, WorkspaceIcon } from '@/components/ui';
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
                {/* Right side — role/action */}
                {isOwner ? (
                  <span
                    className="text-sm text-muted-foreground"
                    data-icod-id={`src_features_workspaces_sharemodal_tsx_d5c7_${member.id}`}>Owner</span>
                ) : canManage ? (
                  /* Owner/admin actor — non-owner members get a role selector with remove */
                  (<select
                    className={[
                      'h-8 w-36 shrink-0 rounded-[var(--radius-sm)] border border-border bg-card text-sm leading-tight text-foreground',
                      'focus:border-primary focus:outline-none focus:shadow-[var(--focus-ring)]',
                      'appearance-none cursor-pointer',
                    ].join(' ')}
                    value={member.role}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__remove__') {
                        setConfirmRemove({ memberId: member.id, memberName: member.fullName, isSelf: false });
                        // Reset to current role so the select doesn't visually show "remove"
                        e.target.value = member.role;
                      } else if (val === '__leave__') {
                        setConfirmRemove({ memberId: member.id, memberName: member.fullName, isSelf: true });
                        e.target.value = member.role;
                      } else {
                        handleRoleChange(member.id, val as WorkspaceRole);
                      }
                    }}
                    data-icod-id={`src_features_workspaces_sharemodal_tsx_4755_${member.id}`}>
                    <option
                      value="admin"
                      data-icod-id={`src_features_workspaces_sharemodal_tsx_418c_${member.id}`}>Admin</option>
                    <option
                      value="editor"
                      data-icod-id={`src_features_workspaces_sharemodal_tsx_714c_${member.id}`}>Editor</option>
                    <option
                      value="viewer"
                      data-icod-id={`src_features_workspaces_sharemodal_tsx_0548_${member.id}`}>Viewer</option>
                    <option
                      disabled
                      data-icod-id={`src_features_workspaces_sharemodal_tsx_2f79_${member.id}`}>──────────</option>
                    {isSelf ? (
                      <option
                        value="__leave__"
                        className="text-destructive"
                        data-icod-id={`src_features_workspaces_sharemodal_tsx_a9c3_${member.id}`}>Leave</option>
                    ) : (
                      <option
                        value="__remove__"
                        className="text-destructive"
                        data-icod-id={`src_features_workspaces_sharemodal_tsx_d972_${member.id}`}>Remove</option>
                    )}
                  </select>)
                ) : (
                  /* Viewer/editor actor — plain text role */
                  (<span
                    className="text-sm capitalize text-muted-foreground"
                    data-icod-id={`src_features_workspaces_sharemodal_tsx_b9e7_${member.id}`}>{member.role}</span>)
                )}
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
