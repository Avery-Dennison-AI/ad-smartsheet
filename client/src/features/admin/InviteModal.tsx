import { useState, useCallback, useEffect, type FormEvent } from 'react';
import {
  Button,
  Input,
  Select,
  Modal,
  Alert,
  CopyField,
  DatePicker,
  Field,
} from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createAdminInvitation } from '@/store/slices/adminSlice';
import { selectOrgPolicy, fetchOrgPolicy } from '@/store/slices/orgPolicySlice';
import { buildInviteLink } from '@/utils/inviteLink';
import type { UserRole } from '@/types';

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
}

export default function InviteModal({ open, onClose }: InviteModalProps) {
  const dispatch = useAppDispatch();
  const orgPolicy = useAppSelector(selectOrgPolicy);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [guestExpiresAt, setGuestExpiresAt] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitePath, setInvitePath] = useState<string | null>(null);

  // Fetch org policy when modal opens
  useEffect(() => {
    if (open) {
      dispatch(fetchOrgPolicy());
    }
  }, [open, dispatch]);

  // Pre-fill guest expiry date when role changes to guest and policy requires it
  useEffect(() => {
    if (role === 'guest' && orgPolicy?.guestAccessExpiry === 'required' && !guestExpiresAt) {
      const d = new Date();
      d.setDate(d.getDate() + (orgPolicy.defaultGuestExpiryDays || 90));
      setGuestExpiresAt(d.toISOString().split('T')[0]);
    }
  }, [role, orgPolicy, guestExpiresAt]);

  function resetForm() {
    setEmail('');
    setFullName('');
    setRole('member');
    setGuestExpiresAt('');
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
      const result = await dispatch(createAdminInvitation({
        email: email.trim(),
        fullName: fullName.trim() || undefined,
        role,
        guestExpiresAt: role === 'guest' && guestExpiresAt ? guestExpiresAt : undefined,
      })).unwrap();
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
    setGuestExpiresAt('');
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
            onChange={(e) => setRole(e.target.value as UserRole)}
            data-icod-id="src_pages_adminuserspage_tsx_invite_role">
            <option value="member" data-icod-id="src_pages_adminuserspage_tsx_role_member">Member</option>
            <option value="admin" data-icod-id="src_pages_adminuserspage_tsx_role_admin">Admin</option>
            <option value="guest" data-icod-id="src_features_admin_invitemodal_tsx_f010">Guest</option>
          </Select>
          {role === 'guest' && (
            <>
              {/* Policy hints */}
              {orgPolicy?.allowedGuestEmailDomains && orgPolicy.allowedGuestEmailDomains.length > 0 && (
                <p className="text-xs text-muted-foreground" data-icod-id="invite_domain_hint">
                  Guests must have an email from: {orgPolicy.allowedGuestEmailDomains.join(', ')}
                </p>
              )}
              {orgPolicy?.maxGuestRole === 'viewer' && (
                <p className="text-xs text-warning" data-icod-id="invite_max_role_hint">
                  Guest role is capped at Viewer by organization policy.
                </p>
              )}
              <Field
                label={orgPolicy?.guestAccessExpiry === 'required' ? 'Guest expiry date' : 'Guest expiry date (optional)'}
                required={orgPolicy?.guestAccessExpiry === 'required'}
                data-icod-id="src_features_admin_invitemodal_tsx_b735">
                <DatePicker
                  value={guestExpiresAt}
                  onChange={setGuestExpiresAt}
                  data-icod-id="invite_guest_expiry" />
              </Field>
              <p
                className="text-xs text-muted-foreground"
                data-icod-id="src_features_admin_invitemodal_tsx_cce4">
                Guests can only access sheets explicitly shared with them.
              </p>
            </>
          )}
        </form>
      )}
    </Modal>
  );
}
