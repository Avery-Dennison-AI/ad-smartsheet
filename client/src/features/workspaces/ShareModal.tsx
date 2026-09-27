import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Input, Button, Select, useToast } from '@/components/ui';
import Avatar from '@/components/ui/Avatar';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { addMember, removeMember, updateMemberRole, fetchWorkspaces } from '@/store/slices/workspaceSlice';
import { searchUsers as searchUsersApi } from '@/services/workspaceService';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import WorkspaceMemberRow from './WorkspaceMemberRow';
import type { Workspace, WorkspaceRole } from '@/types';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  workspace: Workspace;
}

interface SearchResult {
  _id: string;
  fullName: string;
  email: string;
}

export default function ShareModal({ open, onClose, workspace }: ShareModalProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const { addToast } = useToast();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole>('editor');
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  // Determine current user's role in this workspace
  const currentMember = workspace.members.find((m) => m.user._id === user?.id);
  const currentUserRole = currentMember?.role ?? null;

  // Search effect — only fire when query is at least 2 characters
  useEffect(() => {
    if (!open || debouncedQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    setSearching(true);

    searchUsersApi(workspace._id, debouncedQuery)
      .then((res) => {
        if (!cancelled) setSearchResults(res.data.data as SearchResult[]);
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => { cancelled = true; };
  }, [debouncedQuery, workspace._id, open]);

  /** Handle access-loss errors (403/404): redirect to home */
  function handleAccessLoss(message: string) {
    addToast('error', message);
    onClose();
    dispatch(fetchWorkspaces());
    navigate('/home', { replace: true });
  }

  /** Check if a rejected thunk payload indicates access loss */
  function isAccessError(err: unknown): boolean {
    const e = err as { status?: number; statusCode?: number; message?: string };
    const status = e?.status || e?.statusCode;
    return status === 403 || status === 404;
  }

  async function handleAddMember(userId: string) {
    setAddingUserId(userId);
    try {
      await dispatch(addMember({ workspaceId: workspace._id, data: { userId, role: selectedRole } })).unwrap();
      addToast('success', 'Member added');
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      if (isAccessError(err)) {
        handleAccessLoss('You no longer have access to this workspace');
      } else {
        addToast('error', 'Failed to add member');
      }
    } finally {
      setAddingUserId(null);
    }
  }

  async function handleRoleChange(memberId: string, role: WorkspaceRole) {
    try {
      await dispatch(updateMemberRole({ workspaceId: workspace._id, memberId, role })).unwrap();
      addToast('success', 'Role updated');
    } catch (err) {
      if (isAccessError(err)) {
        handleAccessLoss('You no longer have access to this workspace');
      } else {
        addToast('error', 'Failed to update role');
      }
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      await dispatch(removeMember({ workspaceId: workspace._id, memberId })).unwrap();
      addToast('success', 'Member removed');
    } catch (err) {
      if (isAccessError(err)) {
        handleAccessLoss('You no longer have access to this workspace');
      } else {
        addToast('error', 'Failed to remove member');
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); setSearchQuery(''); setSearchResults([]); }}
      title="Share workspace"
      className="max-w-lg"
      data-icod-id="src_features_workspaces_sharemodal_tsx_b3d0">
      <div
        className="flex flex-col gap-4"
        data-icod-id="src_features_workspaces_sharemodal_tsx_0267">
        {/* Add people section */}
        <div
          className="space-y-2"
          data-icod-id="src_features_workspaces_sharemodal_tsx_31fb">
          <label
            className="text-sm font-medium text-foreground"
            data-icod-id="src_features_workspaces_sharemodal_tsx_6812">Add people</label>
          <div
            className="flex gap-2"
            data-icod-id="src_features_workspaces_sharemodal_tsx_4a80">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              data-icod-id="src_features_workspaces_sharemodal_tsx_88fe" />
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as WorkspaceRole)}
              className="w-28"
              data-icod-id="src_features_workspaces_sharemodal_tsx_e246">
              <option value="editor" data-icod-id="src_features_workspaces_sharemodal_tsx_8f05">Editor</option>
              <option value="viewer" data-icod-id="src_features_workspaces_sharemodal_tsx_75b5">Viewer</option>
              <option value="admin" data-icod-id="src_features_workspaces_sharemodal_tsx_d190">Admin</option>
            </Select>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div
              className="rounded-[var(--radius-md)] border border-border bg-card"
              data-icod-id="src_features_workspaces_sharemodal_tsx_cfe9">
              {searchResults.map((result) => (
                <div
                  key={result._id}
                  className="flex items-center justify-between px-3 py-2 first:rounded-t-[var(--radius-md)] last:rounded-b-[var(--radius-md)] hover:bg-muted/50"
                  data-icod-id={`src_features_workspaces_sharemodal_tsx_06cc_${result._id}`}>
                  <div
                    className="flex items-center gap-2 min-w-0"
                    data-icod-id={`src_features_workspaces_sharemodal_tsx_dd74_${result._id}`}>
                    <Avatar
                      name={result.fullName}
                      size="sm"
                      data-icod-id={`src_features_workspaces_sharemodal_tsx_avatar_${result._id}`} />
                    <div
                      className="min-w-0"
                      data-icod-id={`src_features_workspaces_sharemodal_tsx_b838_${result._id}`}>
                      <div
                        className="truncate text-sm font-medium text-foreground"
                        data-icod-id={`src_features_workspaces_sharemodal_tsx_9ea2_${result._id}`}>{result.fullName}</div>
                      <div
                        className="truncate text-xs text-muted-foreground"
                        data-icod-id={`src_features_workspaces_sharemodal_tsx_c435_${result._id}`}>{result.email}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddMember(result._id)}
                    loading={addingUserId === result._id}
                    data-icod-id={`src_features_workspaces_sharemodal_tsx_5218_${result._id}`}>
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
          {searching && <div
            className="text-xs text-muted-foreground"
            data-icod-id="src_features_workspaces_sharemodal_tsx_f31a">Searching...</div>}
        </div>

        {/* Member list */}
        <div
          className="space-y-1"
          data-icod-id="src_features_workspaces_sharemodal_tsx_63a4">
          <label
            className="text-sm font-medium text-foreground"
            data-icod-id="src_features_workspaces_sharemodal_tsx_f9ef">
            Members ({workspace.members.length})
          </label>
          <div
            className="flex flex-col"
            data-icod-id="src_features_workspaces_sharemodal_tsx_7ecf">
            {workspace.members.map((member) => (
              <WorkspaceMemberRow
                key={member.user._id}
                member={member}
                currentUserId={user?.id || ''}
                currentUserRole={currentUserRole}
                workspaceOwnerId={workspace.owner}
                onRoleChange={handleRoleChange}
                onRemove={handleRemoveMember}
                data-icod-id={`src_features_workspaces_sharemodal_tsx_19af_${member.user._id}`} />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
