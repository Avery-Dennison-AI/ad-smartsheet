import { useState, useCallback, type FormEvent } from 'react';
import {
  Button,
  Input,
  Select,
  Modal,
  Alert,
  CopyField,
} from '@/components/ui';
import { useAppDispatch } from '@/store/hooks';
import { createAdminInvitation } from '@/store/slices/adminSlice';
import { buildInviteLink } from '@/utils/inviteLink';

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
}

export default function InviteModal({ open, onClose }: InviteModalProps) {
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
