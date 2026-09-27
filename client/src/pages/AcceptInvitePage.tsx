import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button, Input, Alert, Card, IconButton, Spinner, PasswordRequirements } from '@/components/ui';
import AuthLayout from '@/components/layout/AuthLayout';
import { getInvitationPreview, acceptInvitation } from '@/services/adminService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMe, logoutUser, selectCurrentUser } from '@/store/slices/authSlice';
import { PASSWORD_RULES } from '@/utils/passwordPolicy';
import { parseApiError } from '@/utils/parseApiError';
import type { InvitationPreview } from '@/types';

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ fullName?: string; password?: string; confirmPassword?: string }>({});

  // Load invitation preview on mount
  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const data = await getInvitationPreview(token);
        if (!cancelled) {
          setPreview(data);
          if (data.fullName) setFullName(data.fullName);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setPreviewError(parseApiError(err).message);
        }
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    })();

    return () => { cancelled = true; };
  }, [token]);

  function validate(): boolean {
    const errs: typeof fieldErrors = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    if (!password) errs.password = 'Password is required';
    else {
      // Client-side password policy check
      const failedRules = PASSWORD_RULES.filter((rule) => !rule.test(password));
      if (failedRules.length > 0) {
        errs.password = `Password does not meet requirements: ${failedRules.map((r) => r.label).join(', ')}`;
      }
    }
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate() || !token) return;

    setSubmitting(true);
    try {
      await acceptInvitation(token, { fullName: fullName.trim(), password, confirmPassword });
      await dispatch(fetchMe());
      navigate('/home', { replace: true });
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setError(parsed.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await dispatch(logoutUser());
  }

  // Loading state
  if (loadingPreview) {
    return (
      <div
        className="flex min-h-screen w-full items-center justify-center bg-card"
        data-icod-id="src_pages_acceptinvitepage_tsx_e525">
        <Spinner size="lg" data-icod-id="src_pages_acceptinvitepage_tsx_4098" />
      </div>
    );
  }

  // Invalid / expired invitation
  if (previewError || !preview) {
    return (
      <AuthLayout data-icod-id="accept_invite_error_layout">
        <Card
          className="w-full max-w-[400px] p-8 text-center border-border shadow-[var(--shadow-md)]"
          data-icod-id="src_pages_acceptinvitepage_tsx_9408">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10"
            data-icod-id="src_pages_acceptinvitepage_tsx_63c4">
            <CheckCircle2
              className="h-6 w-6 text-destructive"
              data-icod-id="src_pages_acceptinvitepage_tsx_39bd" />
          </div>
          <h1
            className="text-xl font-semibold text-foreground"
            data-icod-id="src_pages_acceptinvitepage_tsx_3ec0">Invalid Invitation</h1>
          <p
            className="mt-2 text-sm text-muted-foreground"
            data-icod-id="src_pages_acceptinvitepage_tsx_e49a">
            {previewError ?? 'This invitation link is invalid or has expired.'}
          </p>
          <Button
            className="mt-6 w-full"
            onClick={() => navigate('/login')}
            data-icod-id="src_pages_acceptinvitepage_tsx_eeb9">
            Go to Login
          </Button>
        </Card>
      </AuthLayout>
    );
  }

  // Already logged in — show alert instead of form
  if (currentUser) {
    return (
      <AuthLayout data-icod-id="accept_invite_logged_in_layout">
        <Card
          className="w-full max-w-[400px] p-8 border-border shadow-[var(--shadow-md)]"
          data-icod-id="accept_invite_logged_in_card">
          <Alert variant="info" data-icod-id="accept_invite_logged_in_alert">
            You're signed in as {currentUser.email}. Log out to accept this invitation.
          </Alert>
          <Button
            variant="secondary"
            className="mt-4 w-full"
            onClick={handleLogout}
            data-icod-id="accept_invite_logout_btn">
            Log out
          </Button>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout data-icod-id="accept_invite_form_layout">
      <Card
        className="w-full max-w-[400px] p-8 shadow-none md:shadow-[var(--shadow-md)] border-0 md:border-border"
        data-icod-id="src_pages_acceptinvitepage_tsx_a7ac">
        <div className="mb-6" data-icod-id="src_pages_acceptinvitepage_tsx_8bc7">
          <h2
            className="text-xl font-semibold text-foreground"
            data-icod-id="src_pages_acceptinvitepage_tsx_fecf">Create your account</h2>
          <p
            className="mt-1 text-sm text-muted-foreground"
            data-icod-id="src_pages_acceptinvitepage_tsx_5cf6">
            Invited as <span
            className="font-medium text-foreground"
            data-icod-id="src_pages_acceptinvitepage_tsx_55d3">{preview.email}</span>
            {' '}({preview.role})
          </p>
        </div>

        {error && (
          <div className="mb-4" data-icod-id="src_pages_acceptinvitepage_tsx_1985">
            <Alert variant="error" data-icod-id="src_pages_acceptinvitepage_tsx_a493">{error}</Alert>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          data-icod-id="src_pages_acceptinvitepage_tsx_50bf">
          <Input
            label="Full Name"
            autoFocus
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); setFieldErrors((prev) => ({ ...prev, fullName: undefined })); }}
            error={fieldErrors.fullName}
            data-icod-id="src_pages_acceptinvitepage_tsx_9cc0" />

          <div className="flex flex-col gap-1.5" data-icod-id="accept_invite_password_group">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors((prev) => ({ ...prev, password: undefined })); }}
              error={fieldErrors.password}
              rightIcon={
                <IconButton
                  size="sm"
                  tooltip={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  data-icod-id="src_pages_acceptinvitepage_tsx_d294">
                  {showPassword ? <EyeOff className="h-4 w-4" data-icod-id="src_pages_acceptinvitepage_tsx_8a9b" /> : <Eye className="h-4 w-4" data-icod-id="src_pages_acceptinvitepage_tsx_c185" />}
                </IconButton>
              }
              data-icod-id="src_pages_acceptinvitepage_tsx_b3ce" />
            <PasswordRequirements
              password={password}
              data-icod-id="accept_invite_pw_requirements" />
          </div>

          <Input
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined })); }}
            error={fieldErrors.confirmPassword}
            data-icod-id="src_pages_acceptinvitepage_tsx_e621" />

          <Button
            type="submit"
            loading={submitting}
            className="w-full mt-2"
            data-icod-id="src_pages_acceptinvitepage_tsx_fc29">
            Create Account
          </Button>
        </form>
      </Card>

      <p
        className="mt-6 text-xs text-muted-foreground/70"
        data-icod-id="src_pages_acceptinvitepage_tsx_05b1">
        Already have an account? <Link
        to="/login"
        className="underline hover:text-foreground"
        data-icod-id="src_pages_acceptinvitepage_tsx_bc35">Log in</Link>
      </p>
    </AuthLayout>
  );
}
