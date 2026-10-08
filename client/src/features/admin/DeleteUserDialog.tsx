import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal, Button, Field, Input, Alert, Spinner, Select } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { deleteAdminUser, selectAdminUsers } from '@/store/slices/adminSlice';
import { getUserOwnedWorkspaces } from '@/services/adminService';
import type { AdminUser } from '@/types';

interface DeleteUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onSuccess?: () => void;
}

export default function DeleteUserDialog({
  open,
  onClose,
  user,
  onSuccess,
}: DeleteUserDialogProps) {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectAdminUsers);

  const [ownedWorkspaces, setOwnedWorkspaces] = useState<Array<{ _id: string; name: string }>>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [transferToUserId, setTransferToUserId] = useState('');
  const [typedEmail, setTypedEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open && user) {
      setOwnedWorkspaces([]);
      setTransferToUserId('');
      setTypedEmail('');
      setDeleting(false);
      setError(null);
      setLoadingWorkspaces(true);

      getUserOwnedWorkspaces(user.id)
        .then((ws) => setOwnedWorkspaces(ws))
        .catch(() => setError('Failed to load workspace information'))
        .finally(() => setLoadingWorkspaces(false));
    }
  }, [open, user]);

  if (!user) return null;

  const hasOwnedWorkspaces = ownedWorkspaces.length > 0;
  const canConfirm = typedEmail.trim() === user.email && (!hasOwnedWorkspaces || transferToUserId);

  // Filter eligible transfer targets: active, non-deleted, non-guest users excluding the target
  const eligibleTransferTargets = users.filter(
    (u) => u.id !== user.id && u.isActive && !u.isDeleted && u.role !== 'guest',
  );

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      await dispatch(
        deleteAdminUser({
          userId: user.id,
          transferToUserId: hasOwnedWorkspaces ? transferToUserId : undefined,
        }),
      ).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Delete ${user.fullName}?`}
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={deleting}
            data-icod-id="src_features_admin_deleteuserdialog_tsx_8e70">
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={!canConfirm || deleting}
            loading={deleting}
            data-icod-id="src_features_admin_deleteuserdialog_tsx_dc54">
            Delete User
          </Button>
        </>
      }
      className="max-w-md"
      data-icod-id="src_features_admin_deleteuserdialog_tsx_3020">
      <div
        className="space-y-4"
        data-icod-id="src_features_admin_deleteuserdialog_tsx_e73d">
        <Alert
          variant="warning"
          data-icod-id="src_features_admin_deleteuserdialog_tsx_12c6">
          <div
            className="flex items-start gap-2"
            data-icod-id="src_features_admin_deleteuserdialog_tsx_9fc8">
            <AlertTriangle
              className="h-5 w-5 shrink-0 mt-0.5"
              data-icod-id="src_features_admin_deleteuserdialog_tsx_eab8" />
            <div
              className="text-sm"
              data-icod-id="src_features_admin_deleteuserdialog_tsx_dce7">
              <p
                className="font-medium"
                data-icod-id="src_features_admin_deleteuserdialog_tsx_77ce">This action cannot be undone.</p>
              <p
                className="mt-1"
                data-icod-id="src_features_admin_deleteuserdialog_tsx_d7d5">
                All sessions will be invalidated immediately. The name "{user.fullName}" will remain
                in history as "{user.fullName} (deleted)". Consider deactivating the user instead if
                you may need to restore access later.
              </p>
            </div>
          </div>
        </Alert>

        {loadingWorkspaces && (
          <div
            className="flex items-center justify-center py-4"
            data-icod-id="src_features_admin_deleteuserdialog_tsx_2952">
            <Spinner size="md" data-icod-id="src_features_admin_deleteuserdialog_tsx_6545" />
          </div>
        )}

        {!loadingWorkspaces && hasOwnedWorkspaces && (
          <div
            className="space-y-3"
            data-icod-id="src_features_admin_deleteuserdialog_tsx_aeac">
            <div
              className="rounded-md border border-border bg-muted/50 p-3"
              data-icod-id="src_features_admin_deleteuserdialog_tsx_9bdb">
              <p
                className="text-sm font-medium text-foreground mb-2"
                data-icod-id="src_features_admin_deleteuserdialog_tsx_0d9a">
                This user owns {ownedWorkspaces.length} workspace{ownedWorkspaces.length > 1 ? 's' : ''}:
              </p>
              <ul
                className="list-disc list-inside text-sm text-muted-foreground space-y-1"
                data-icod-id="src_features_admin_deleteuserdialog_tsx_f55a">
                {ownedWorkspaces.map((ws) => (
                  <li
                    key={ws._id}
                    data-icod-id={`src_features_admin_deleteuserdialog_tsx_2e21_${ws._id}`}>{ws.name}</li>
                ))}
              </ul>
            </div>

            <Field
              label="Transfer ownership to"
              htmlFor="transfer-target"
              required
              data-icod-id="src_features_admin_deleteuserdialog_tsx_3278">
              <Select
                id="transfer-target"
                value={transferToUserId}
                onChange={(e) => setTransferToUserId(e.target.value)}
                data-icod-id="src_features_admin_deleteuserdialog_tsx_3d43">
                <option value="" data-icod-id="src_features_admin_deleteuserdialog_tsx_9ef6">Select a user...</option>
                {eligibleTransferTargets.map((u) => (
                  <option
                    key={u.id}
                    value={u.id}
                    data-icod-id={`src_features_admin_deleteuserdialog_tsx_c58b_${u.id}`}>
                    {u.fullName} ({u.email})
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}

        {error && <Alert
          variant="error"
          data-icod-id="src_features_admin_deleteuserdialog_tsx_9a15">{error}</Alert>}

        <Field
          label={`Type "${user.email}" to confirm`}
          htmlFor="confirm-email-input"
          data-icod-id="src_features_admin_deleteuserdialog_tsx_7ae1">
          <Input
            id="confirm-email-input"
            value={typedEmail}
            onChange={(e) => setTypedEmail(e.target.value)}
            placeholder={user.email}
            autoFocus
            data-icod-id="src_features_admin_deleteuserdialog_tsx_b6fa" />
        </Field>
      </div>
    </Modal>
  );
}
