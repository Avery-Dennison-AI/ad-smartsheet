import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LayoutGrid } from 'lucide-react';
import { Button, Input, Alert, Card, IconButton } from '@/components/ui';
import apiClient from '@/services/apiClient';
import { useAppDispatch } from '@/store/hooks';
import { fetchMe } from '@/store/slices/authSlice';

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const safeRedirect = (redirect?.startsWith('/') && !redirect.startsWith('//')) ? redirect : '/home';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!password) {
      errs.password = 'Password is required';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      await apiClient.post('/auth/login', { email, password });
      // Populate Redux auth state after successful login
      await dispatch(fetchMe());
      navigate(safeRedirect, { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { error?: { message?: string }; message?: string } } };
      if (error.response) {
        const status = error.response.status;
        if (status && status >= 400 && status < 500) {
          setError(error.response.data?.error?.message || 'Request failed');
        } else {
          setError('Something went wrong. Please try again.');
        }
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full" data-icod-id="login_page_root">
      {/* Left panel — desktop only */}
      <div
        className="hidden md:flex w-1/2 flex-col items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: 'var(--color-primary)' }}
        data-icod-id="login_page_left_panel">
        {/* Decorative grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.5) 39px, rgba(255,255,255,0.5) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.5) 39px, rgba(255,255,255,0.5) 40px)`,
          }}
          data-icod-id="login_page_grid_pattern" />

        <div className="relative z-10 max-w-md px-8 text-center" data-icod-id="login_page_hero_content">
          <div
            className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-card/20"
            data-icod-id="login_page_logo_bg">
            <LayoutGrid className="h-6 w-6 text-white" data-icod-id="login_page_logo_icon" />
          </div>
          <h1
            className="text-2xl font-semibold text-white leading-tight"
            data-icod-id="login_page_headline">
            Plan, track, and deliver work in one place
          </h1>
          <p
            className="mt-3 text-sm text-white/80"
            data-icod-id="login_page_subheadline">
            GridFlow brings your team's tasks, timelines, and collaboration into a single intuitive workspace.
          </p>
        </div>
      </div>
      {/* Mobile header bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 flex items-center justify-center py-5"
        style={{ backgroundColor: 'var(--color-primary)', height: '80px' }}
        data-icod-id="login_page_mobile_header">
        <span className="text-lg font-bold text-white" data-icod-id="login_page_mobile_logo">GridFlow</span>
      </div>
      {/* Right panel / form area */}
      <div
        className="flex w-full md:w-1/2 flex-col items-center justify-center bg-card pt-[80px] md:pt-0"
        data-icod-id="login_page_right_panel">
        <Card className="w-full max-w-[400px] p-8 shadow-none md:shadow-[var(--shadow-md)] border-0 md:border-border" data-icod-id="login_page_card">
          <div className="mb-6" data-icod-id="login_page_form_header">
            <h2
              className="text-xl font-semibold text-foreground"
              data-icod-id="login_page_welcome">
              Welcome back
            </h2>
            <p
              className="mt-1 text-sm text-muted-foreground"
              data-icod-id="login_page_subtitle">
              Log in to your GridFlow account
            </p>
          </div>

          {error && (
            <div className="mb-4" data-icod-id="login_page_error_wrapper">
              <Alert variant="error" data-icod-id="login_page_alert">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" data-icod-id="login_page_form">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors((prev) => ({ ...prev, email: undefined })); }}
              error={fieldErrors.email}
              data-icod-id="login_page_email_input" />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors((prev) => ({ ...prev, password: undefined })); }}
              error={fieldErrors.password}
              rightIcon={
                <IconButton
                  size="sm"
                  tooltip={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  data-icod-id="login_page_toggle_password">
                  {showPassword ? <EyeOff className="h-4 w-4" data-icod-id="src_pages_loginpage_tsx_44c0" /> : <Eye className="h-4 w-4" data-icod-id="src_pages_loginpage_tsx_63aa" />}
                </IconButton>
              }
              data-icod-id="login_page_password_input" />

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-2"
              data-icod-id="login_page_submit_btn">
              Log in
            </Button>
          </form>
        </Card>

        <p
          className="mt-6 text-xs text-muted-foreground/70"
          data-icod-id="login_page_footer_text">
          Don't have an account? Contact your administrator for an invitation.
        </p>
      </div>
    </div>
  );
}
