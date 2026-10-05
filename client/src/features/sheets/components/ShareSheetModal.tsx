import { useState, useCallback, useEffect } from 'react';
import { Modal, Button, Select, useToast, ConfirmDialog, Avatar, Badge, Spinner } from '@/components/ui';
import RoleMenu from '@/components/ui/RoleMenu';
import type { RoleValue } from '@/components/ui/RoleMenu';
import UserPicker from '@/components/ui/UserPicker';
import type { UserOption } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';
import {
  fetchSheetMembers,
  addSheetMember,
  updateSheetMemberRole,
  removeSheetMember,
  selectSheetMembers,
  selectSheetMembersStatus,
} from '@/store/slices/sheetsSlice';
import { searchUsersGlobal } from '@/services/userSearchService';
import type { SheetRole } from '@/types';

interface ShareSheetModalProps {
  open: boolean;
  onClose: () => void;
  sheetId: string;
  sheetName: string;
  userRole: string;
}

export default function ShareSheetModal({
  open,
  onClose,
  sheetId,
  sheetName,
  userRole,
}: ShareSheetModalProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const members = useAppSelector(selectSheetMembers);
  const status = useAppSelector(selectSheetMembersStatus);
  const { addToast } = useToast();

  // Add-people state
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [selectedRole, setSelectedRole] = useState<SheetRole>('editor');
  const [adding, setAdding] = useState(false);

  // Confirm-remove state
  const [confirmRemove, setConfirmRemove] = useState<{ memberId: string; memberName: string } | null>(null);

  const canManage = userRole === 'admin' || userRole === 'owner';

  // Fetch members when modal opens
  useEffect(() => {
    if (open && sheetId) {
      dispatch(fetchSheetMembers(sheetId));
    }
  }, [open, sheetId, dispatch]);

  // Build a set of existing direct member IDs for filtering search results
  const existingMemberIds = new Set(
    members?.directMembers.map((m) => m.id) ?? [],
  );

  // Search function for UserPicker
  const handleSearch = useCallback(
    async (query: string): Promise<UserOption[]> => {
      try {
        const results = await searchUsersGlobal(query);
        return results
          .filter((r) => !existingMemberIds.has(r._id))
          .map((r) => ({ id: r._id, fullName: r.fullName, email: r.email }));
      } catch {
        return [];
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sheetId],
  );

  async function handleAddMember() {
    if (!selectedUser) return;
    setAdding(true);
    try {
      await dispatch(addSheetMember({ sheetId, userId: selectedUser.id, role: selectedRole })).unwrap();
      addToast('success', 'Member added');
      setSelectedUser(null);
      setSelectedRole('editor');
    } catch (err) {
      addToast('error', typeof err === 'string' ? err : 'Failed to add member');
    } finally {
      setAdding(false);
    }
  }

  async function handleRoleChange(memberId: string, role: SheetRole) {
    try {
      await dispatch(updateSheetMemberRole({ sheetId, userId: memberId, role })).unwrap();
      addToast('success', 'Role updated');
    } catch (err) {
      addToast('error', typeof err === 'string' ? err : 'Failed to update role');
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      await dispatch(removeSheetMember({ sheetId, userId: memberId })).unwrap();
      addToast('success', 'Member removed');
      setConfirmRemove(null);
    } catch (err) {
      addToast('error', typeof err === 'string' ? err : 'Failed to remove member');
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
        title="Share sheet"
        size="lg"
        footer={
          <Button
            variant="secondary"
            onClick={handleClose}
            data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_4b2c">Done</Button>
        }
        data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_163f">
        {/* Subtitle */}
        <div
          className="flex items-center gap-2 -mt-2 mb-2"
          data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_c730">
          <span
            className="text-sm text-muted-foreground truncate"
            data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_64e1">{sheetName}</span>
        </div>

        {/* Zone A — Add people (admin/owner only) */}
        {canManage && (
          <div
            className="flex items-center gap-2 mb-4"
            data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_7a08">
            <UserPicker
              placeholder="Search by name or email..."
              onSearch={handleSearch}
              value={selectedUser}
              onChange={setSelectedUser}
              containerClassName="flex-1 min-w-0"
              data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_3849" />
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as SheetRole)}
              size="md"
              containerClassName="w-36 shrink-0"
              data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_b2a4">
              <option
                value="admin"
                data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_2a39">Admin</option>
              <option
                value="editor"
                data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_9c81">Editor</option>
              <option
                value="viewer"
                data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_4923">Viewer</option>
            </Select>
            <Button
              size="md"
              disabled={!selectedUser}
              loading={adding}
              onClick={handleAddMember}
              data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_bf4e">
              Share
            </Button>
          </div>
        )}

        {/* Loading state */}
        {status === 'loading' && (
          <div
            className="flex justify-center py-8"
            data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_7abd">
            <Spinner
              size="md"
              data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_0f13" />
          </div>
        )}

        {status !== 'loading' && members && (
          <>
            {/* Zone B — Direct members */}
            {members.directMembers.length > 0 && (
              <>
                <div
                  className="flex items-center gap-2 mb-1"
                  data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_dc37">
                  <span
                    className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_ab31">
                    Shared with this sheet
                  </span>
                  <span
                    className="text-xs text-muted-foreground"
                    data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_8af6">
                    {members.directMembers.length}
                  </span>
                </div>

                <div
                  className="overflow-y-auto max-h-48 -mx-2 px-2 mb-4"
                  data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_de0c">
                  {members.directMembers.map((member) => {
                    const isSelf = member.id === currentUser?.id;

                    let roleControl: React.ReactNode;
                    if (isSelf) {
                      roleControl = (
                        <span
                          className="text-sm capitalize text-muted-foreground"
                          data-icod-id={`src_features_sheets_components_sharesheetmodal_tsx_f4c3_${member.id}`}>{member.role}</span>
                      );
                    } else if (canManage) {
                      roleControl = (
                        <RoleMenu
                          value={member.role as RoleValue}
                          onChange={(role) => handleRoleChange(member.id, role as SheetRole)}
                          onRemove={() => setConfirmRemove({ memberId: member.id, memberName: member.fullName })}
                          data-icod-id={`src_features_sheets_components_sharesheetmodal_tsx_a6c6_${member.id}`} />
                      );
                    } else {
                      roleControl = (
                        <span
                          className="text-sm capitalize text-muted-foreground"
                          data-icod-id={`src_features_sheets_components_sharesheetmodal_tsx_b15f_${member.id}`}>{member.role}</span>
                      );
                    }

                    return (
                      <div
                        key={member.id}
                        className="flex h-12 items-center gap-3 px-1 py-2"
                        data-icod-id={`src_features_sheets_components_sharesheetmodal_tsx_1f01_${member.id}`}>
                        <Avatar
                          name={member.fullName}
                          size="sm"
                          data-icod-id={`src_features_sheets_components_sharesheetmodal_tsx_7db6_${member.id}`} />
                        <div
                          className="min-w-0 flex-1"
                          data-icod-id={`src_features_sheets_components_sharesheetmodal_tsx_5bb2_${member.id}`}>
                          <div
                            className="flex items-center gap-1.5 truncate"
                            data-icod-id={`src_features_sheets_components_sharesheetmodal_tsx_8483_${member.id}`}>
                            <span
                              className="text-sm font-medium text-foreground"
                              data-icod-id={`src_features_sheets_components_sharesheetmodal_tsx_8f0f_${member.id}`}>
                              {member.fullName}
                              {isSelf && <span
                                className="text-muted-foreground"
                                data-icod-id={`src_features_sheets_components_sharesheetmodal_tsx_254e_${member.id}`}> (you)</span>}
                            </span>
                            {member.userRole === 'guest' && (
                              <Badge
                                variant="warning"
                                size="sm"
                                data-icod-id={`src_features_sheets_components_sharesheetmodal_tsx_b3c7_${member.id}`}>Guest</Badge>
                            )}
                          </div>
                          <div
                            className="truncate text-xs text-muted-foreground"
                            data-icod-id={`src_features_sheets_components_sharesheetmodal_tsx_f0c0_${member.id}`}>{member.email}</div>
                        </div>
                        {roleControl}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Zone C — Workspace members (read-only) */}
            {members.workspaceMembers.length > 0 && (
              <>
                <div
                  className="flex items-center gap-2 mb-1"
                  data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_9c1f">
                  <span
                    className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_e3f1">
                    From the workspace
                  </span>
                  <span
                    className="text-xs text-muted-foreground"
                    data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_b6e1">
                    {members.workspaceMembers.length}
                  </span>
                </div>

                <div
                  className="overflow-y-auto max-h-48 -mx-2 px-2"
                  data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_8214">
                  {members.workspaceMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex h-12 items-center gap-3 px-1 py-2"
                      data-icod-id={`src_features_sheets_components_sharesheetmodal_tsx_42b3_${member.id}`}>
                      <Avatar
                        name={member.fullName}
                        size="sm"
                        data-icod-id={`src_features_sheets_components_sharesheetmodal_tsx_e1ae_${member.id}`} />
                      <div
                        className="min-w-0 flex-1"
                        data-icod-id={`src_features_sheets_components_sharesheetmodal_tsx_7f82_${member.id}`}>
                        <div
                          className="truncate text-sm font-medium text-foreground"
                          data-icod-id={`src_features_sheets_components_sharesheetmodal_tsx_e572_${member.id}`}>{member.fullName}</div>
                        <div
                          className="truncate text-xs text-muted-foreground"
                          data-icod-id={`src_features_sheets_components_sharesheetmodal_tsx_8d4f_${member.id}`}>{member.email}</div>
                      </div>
                      <span
                        className="text-sm capitalize text-muted-foreground"
                        data-icod-id={`src_features_sheets_components_sharesheetmodal_tsx_2ed5_${member.id}`}>{member.role}</span>
                    </div>
                  ))}
                </div>

                <p
                  className="mt-2 text-xs italic text-muted-foreground"
                  data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_e8be">
                  Manage workspace members in workspace settings.
                </p>
              </>
            )}
          </>
        )}

        {/* Read-only note for non-admins */}
        {!canManage && members && members.directMembers.length > 0 && (
          <p
            className="mt-2 text-xs italic text-muted-foreground"
            data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_f29c">
            Only admins and owners can manage sharing.
          </p>
        )}
      </Modal>
      {/* Confirm remove dialog */}
      {confirmRemove && (
        <ConfirmDialog
          open={!!confirmRemove}
          onClose={() => setConfirmRemove(null)}
          title="Remove member?"
          description={`${confirmRemove.memberName} will lose direct access to this sheet.`}
          confirmLabel="Remove"
          onConfirm={() => handleRemoveMember(confirmRemove.memberId)}
          data-icod-id="src_features_sheets_components_sharesheetmodal_tsx_8458" />
      )}
    </>
  );
}
