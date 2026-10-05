import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Table2, Users, Layers, Smartphone } from 'lucide-react';
import { buttonClass, AnimatedBrandBackground } from '@/components/ui';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';

const features = [
  { icon: Table2, title: 'Spreadsheet power', description: 'Rows, columns, formulas — all yours.' },
  { icon: Users, title: 'Team collaboration', description: 'Invite members and work together.' },
  { icon: Layers, title: 'Nested hierarchy', description: 'Organize rows with parent–child nesting.' },
  { icon: Smartphone, title: 'Any device', description: 'Responsive and fast on desktop and mobile.' },
];

/**
 * Inject fadeUp keyframes once for hero entrance animation.
 */
const FADE_UP_STYLE_ID = 'landing-fadeup-style';
const FADE_UP_CSS = `
@keyframes abb-fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .abb-fade-up {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
`;

export default function LandingPage() {
  const user = useAppSelector(selectCurrentUser);
  const injected = useRef(false);

  useEffect(() => {
    if (!injected.current && typeof document !== 'undefined') {
      if (!document.getElementById(FADE_UP_STYLE_ID)) {
        const style = document.createElement('style');
        style.id = FADE_UP_STYLE_ID;
        style.textContent = FADE_UP_CSS;
        document.head.appendChild(style);
      }
      injected.current = true;
    }
  }, []);

  return (
    <div className="min-h-screen bg-card" data-icod-id="landing_page_root">
      {/* ─── Hero Section ────────────────────────────────────────────── */}
      <section className="relative min-h-screen overflow-hidden" data-icod-id="landing_hero">
        <AnimatedBrandBackground data-icod-id="src_pages_landingpage_tsx_f4a1" />

        {/* Nav — transparent overlay */}
        <nav
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-5 sm:px-10"
          data-icod-id="landing_nav"
        >
          <div className="flex items-center gap-2" data-icod-id="landing_nav_logo">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-primary text-sm font-bold text-primary-foreground"
              data-icod-id="landing_nav_logo_mark"
            >
              N
            </span>
            <span className="text-lg font-semibold text-white" data-icod-id="landing_nav_logo_text">
              NEO
            </span>
          </div>
          <div data-icod-id="landing_nav_action">
            <Link
              to={user ? '/home' : '/login'}
              className={buttonClass({ variant: 'primary', size: 'sm', className: '!rounded-full !bg-white !text-primary hover:!bg-white/90' })}
              data-icod-id="landing_nav_cta"
            >
              {user ? 'Go to app' : 'Log in'}
            </Link>
          </div>
        </nav>

        {/* Hero content — centered */}
        <div
          className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center"
          data-icod-id="landing_hero_content"
        >
          <h1
            className="abb-fade-up text-4xl font-bold text-white sm:text-5xl lg:text-6xl motion-reduce:animate-none"
            style={{ animation: 'abb-fade-up 0.7s ease-out both' }}
            data-icod-id="landing_hero_headline"
          >
            Work, connected.
          </h1>
          <p
            className="abb-fade-up mt-4 max-w-md text-lg text-white/80 motion-reduce:animate-none"
            style={{ animation: 'abb-fade-up 0.7s ease-out 0.15s both' }}
            data-icod-id="landing_hero_subline"
          >
            One place for every project, every team.
          </p>
          <div
            className="abb-fade-up mt-8 motion-reduce:animate-none"
            style={{ animation: 'abb-fade-up 0.7s ease-out 0.3s both' }}
            data-icod-id="landing_hero_cta"
          >
            <Link
              to={user ? '/home' : '/login'}
              className={buttonClass({ variant: 'primary', size: 'lg', className: '!rounded-full !bg-white !text-primary hover:!bg-white/90' })}
              data-icod-id="landing_hero_cta_btn"
            >
              {user ? 'Go to app' : 'Log in'}
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce text-white/50 motion-reduce:animate-none"
          data-icod-id="landing_scroll_hint"
        >
          <ChevronDown className="h-6 w-6" data-icod-id="src_pages_landingpage_tsx_2d86" />
        </div>
      </section>
      {/* ─── Features Strip ──────────────────────────────────────────── */}
      <section
        className="mx-auto max-w-5xl px-6 py-16"
        data-icod-id="landing_features"
      >
        <div
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
          data-icod-id="landing_features_grid"
        >
          {features.map((f) => (
            <div key={f.title} className="flex flex-col gap-2" data-icod-id={`landing_feature_${f.title}`}>
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="font-semibold text-foreground" data-icod-id={`landing_feature_title_${f.title}`}>
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground" data-icod-id={`landing_feature_desc_${f.title}`}>
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>
      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer
        className="border-t border-border py-6 text-center text-sm text-muted-foreground"
        data-icod-id="landing_footer"
      >
        &copy; 2026 NEO
      </footer>
    </div>
  );
}
