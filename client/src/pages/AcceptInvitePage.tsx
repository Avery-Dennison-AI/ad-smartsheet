import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { Button, Input, Alert, Card, IconButton, Spinner } from '@/components/ui';
import { getInvitationPreview, acceptInvitation } from '@/services/adminService';
import { useAppDispatch } from '@/store/hooks';
import { fetchMe } from '@/store/slices/authSlice';
import type { InvitationPreview } from '@/types';

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

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
          const e = err as { response?: { data?: { error?: { message?: string } } } };
          setPreviewError(e.response?.data?.error?.message ?? 'This invitation link is invalid or has expired.');
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
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
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
      const e = err as { response?: { status?: number; data?: { error?: { message?: string } } } };
      if (e.response) {
        const status = e.response.status;
        if (status && status >= 400 && status < 500) {
          setError(e.response.data?.error?.message || 'Request failed');
        } else {
          setError('Something went wrong. Please try again.');
        }
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
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
      <div
        className="flex min-h-screen w-full flex-col items-center justify-center bg-card px-4"
        data-icod-id="src_pages_acceptinvitepage_tsx_aac2">
        <Card
          className="w-full max-w-[400px] p-8 text-center border-border shadow-[var(--shadow-md)]"
          data-icod-id="src_pages_acceptinvitepage_tsx_9408">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10"
            data-icod-id="src_pages_acceptinvitepage_tsx_63c4">
            <LayoutGrid
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
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full" data-icod-id="accept_invite_root">
      {/* Left panel — desktop only */}
      <div
        className="hidden md:flex w-1/2 flex-col items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: 'var(--color-primary)' }}
        data-icod-id="accept_invite_left_panel">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.5) 39px, rgba(255,255,255,0.5) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.5) 39px, rgba(255,255,255,0.5) 40px)`,
          }}
          data-icod-id="src_pages_acceptinvitepage_tsx_7be7" />
        <div
          className="relative z-10 max-w-md px-8 text-center"
          data-icod-id="src_pages_acceptinvitepage_tsx_fbdb">
          <div
            className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-card/20"
            data-icod-id="src_pages_acceptinvitepage_tsx_2f0a">
            <CheckCircle2
              className="h-6 w-6 text-white"
              data-icod-id="src_pages_acceptinvitepage_tsx_03b4" />
          </div>
          <h1
            className="text-2xl font-semibold text-white leading-tight"
            data-icod-id="src_pages_acceptinvitepage_tsx_a370">
            You're invited to GridFlow
          </h1>
          <p
            className="mt-3 text-sm text-white/80"
            data-icod-id="src_pages_acceptinvitepage_tsx_b57e">
            Create your account and start collaborating with your team.
          </p>
        </div>
      </div>
      {/* Mobile header bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 flex items-center justify-center py-5"
        style={{ backgroundColor: 'var(--color-primary)', height: '80px' }}
        data-icod-id="src_pages_acceptinvitepage_tsx_032a">
        <span
          className="text-lg font-bold text-white"
          data-icod-id="src_pages_acceptinvitepage_tsx_b50b">GridFlow</span>
      </div>
      {/* Right panel / form area */}
      <div
        className="flex w-full md:w-1/2 flex-col items-center justify-center bg-card pt-[80px] md:pt-0"
        data-icod-id="accept_invite_right_panel">
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

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors((prev) => ({ ...prev, password: undefined })); }}
              error={fieldErrors.password}
              helperText="Must be 8+ chars with uppercase, lowercase, number, and special character"
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
          Already have an account? <a
          href="/login"
          className="underline hover:text-foreground"
          data-icod-id="src_pages_acceptinvitepage_tsx_bc35">Log in</a>
        </p>
      </div>
    </div>
  );
}
