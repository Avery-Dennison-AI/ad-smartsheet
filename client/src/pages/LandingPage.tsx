import { Link } from 'react-router-dom';
import { LayoutGrid, Grid2x2, GanttChart, Zap, BarChart2 } from 'lucide-react';
import { Button, Card, Badge, Avatar, buttonClass } from '@/components/ui';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';

const features = [
  { icon: Grid2x2, title: 'Flexible Grids', description: 'Organize tasks in customizable spreadsheet-style views that adapt to your workflow.' },
  { icon: GanttChart, title: 'Timelines & Gantt', description: 'Visualize project schedules and dependencies with interactive timeline charts.' },
  { icon: Zap, title: 'Automated Workflows', description: 'Set up rules and triggers to automate repetitive tasks and keep work moving.' },
  { icon: BarChart2, title: 'Dashboards & Reports', description: 'Track team performance and project health with real-time analytics dashboards.' },
];

const steps = [
  { number: '1', title: 'Create a workspace', description: 'Set up a dedicated space for your team with custom fields and views.' },
  { number: '2', title: 'Build your sheets', description: 'Add tasks, assign owners, and set deadlines in a familiar grid layout.' },
  { number: '3', title: 'Collaborate with your team', description: 'Comment, share, and track progress together in real time.' },
];

const mockTasks = [
  { task: 'Design new onboarding flow', status: 'Done', statusVariant: 'status-green' as const, initials: 'SL', date: 'Jan 15' },
  { task: 'API rate limiting', status: 'In Progress', statusVariant: 'status-yellow' as const, initials: 'MK', date: 'Jan 22' },
  { task: 'Write Q1 report', status: 'In Review', statusVariant: 'status-blue' as const, initials: 'AR', date: 'Jan 28' },
  { task: 'Update dependencies', status: 'Backlog', statusVariant: 'status-gray' as const, initials: 'TN', date: 'Feb 3' },
];

export default function LandingPage() {
  const user = useAppSelector(selectCurrentUser);

  return (
    <div className="min-h-screen bg-card" data-icod-id="landing_page_root">
      {/* ─── Sticky Nav ──────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 flex h-[48px] items-center justify-between border-b border-border bg-card px-6"
        data-icod-id="landing_nav">
        <div className="flex items-center gap-2" data-icod-id="landing_nav_logo">
          <LayoutGrid
            className="h-5 w-5 text-primary"
            data-icod-id="src_pages_landingpage_tsx_2970" />
          <span
            className="text-md font-bold text-primary"
             data-icod-id="src_pages_landingpage_tsx_fae4">AD Smartsheet</span>
        </div>
        <div data-icod-id="landing_nav_action">
          {user ? (
            <Link
              to="/home"
              className={buttonClass({ variant: 'secondary', size: 'sm' })}
              data-icod-id="src_pages_landingpage_tsx_2bf8">
              Go to app
            </Link>
          ) : (
            <Link
              to="/login"
              className={buttonClass({ variant: 'primary', size: 'sm' })}
              data-icod-id="src_pages_landingpage_tsx_17ae">
              Log in
            </Link>
          )}
        </div>
      </nav>
      {/* ─── Hero Section ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-24" data-icod-id="landing_hero">
        <div className="grid gap-12 md:grid-cols-2 md:items-center" data-icod-id="landing_hero_grid">
          {/* Left column */}
          <div data-icod-id="landing_hero_text">
            <h1
              className="text-4xl font-semibold leading-tight text-foreground"
              data-icod-id="landing_hero_headline">
              Work management that feels like a spreadsheet, and works like a team
            </h1>
            <p
              className="mt-4 max-w-lg text-base text-muted-foreground"
              data-icod-id="landing_hero_description">
               AD Smartsheet combines the flexibility of spreadsheets with powerful project management tools. Plan, track, and deliver work — all in one place.
            </p>
            <div className="mt-8" data-icod-id="landing_hero_cta">
              <Link
                to="/login"
                className={buttonClass({ variant: 'primary', size: 'lg' })}
                data-icod-id="src_pages_landingpage_tsx_fa34">
                 Log in to AD Smartsheet
              </Link>
            </div>
          </div>

          {/* Right column — product preview mockup */}
          <Card className="overflow-hidden shadow-[var(--shadow-md)]" data-icod-id="landing_hero_mockup">
            {/* Header row */}
            <div
              className="flex items-center border-b border-border bg-muted/50 h-8"
              data-icod-id="landing_mockup_header">
              <div
                className="w-[40%] px-3 text-xs font-medium text-muted-foreground"
                data-icod-id="src_pages_landingpage_tsx_af81">Task</div>
              <div
                className="w-[20%] px-3 text-xs font-medium text-muted-foreground"
                data-icod-id="src_pages_landingpage_tsx_2714">Status</div>
              <div
                className="w-[20%] px-3 text-xs font-medium text-muted-foreground"
                data-icod-id="src_pages_landingpage_tsx_51be">Assignee</div>
              <div
                className="w-[20%] px-3 text-xs font-medium text-muted-foreground"
                data-icod-id="src_pages_landingpage_tsx_2cac">Due Date</div>
            </div>
            {/* Task rows */}
            {mockTasks.map((row) => (
              <div
                key={row.task}
                className="flex items-center border-b border-border last:border-b-0 h-10"
                data-icod-id={`landing_mockup_row_${row.initials}`}>
                <div
                  className="w-[40%] truncate px-3 text-sm text-foreground"
                  data-icod-id={`src_pages_landingpage_tsx_d05a_${row.task}`}>{row.task}</div>
                <div
                  className="w-[20%] px-3"
                  data-icod-id={`src_pages_landingpage_tsx_b9db_${row.task}`}>
                  <Badge
                    variant={row.statusVariant}
                    size="sm"
                    data-icod-id={`src_pages_landingpage_tsx_47ca_${row.task}`}>{row.status}</Badge>
                </div>
                <div
                  className="w-[20%] px-3"
                  data-icod-id={`src_pages_landingpage_tsx_a120_${row.task}`}>
                  <Avatar
                    name={row.initials}
                    size="sm"
                    data-icod-id={`src_pages_landingpage_tsx_9293_${row.task}`} />
                </div>
                <div
                  className="w-[20%] px-3 text-sm text-muted-foreground"
                  data-icod-id={`src_pages_landingpage_tsx_a924_${row.task}`}>{row.date}</div>
              </div>
            ))}
          </Card>
        </div>
      </section>
      {/* ─── Features Section ────────────────────────────────────────── */}
      <section className="bg-muted/30 py-20" data-icod-id="landing_features">
        <div className="mx-auto max-w-6xl px-6" data-icod-id="landing_features_inner">
          <h2
            className="mb-12 text-center text-xl font-semibold text-foreground"
            data-icod-id="landing_features_heading">
            Everything your team needs
          </h2>
          <div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            data-icod-id="landing_features_grid">
            {features.map((f) => (
              <Card key={f.title} className="p-6" data-icod-id={`landing_feature_${f.title}`}>
                <f.icon className="mb-3 h-6 w-6 text-primary" />
                <h3
                  className="mb-1 text-md font-semibold text-foreground"
                  data-icod-id={`src_pages_landingpage_tsx_d433_${f.title}`}>{f.title}</h3>
                <p
                  className="text-sm text-muted-foreground"
                  data-icod-id={`src_pages_landingpage_tsx_8c09_${f.title}`}>{f.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* ─── How It Works Strip ───────────────────────────────────────── */}
      <section className="bg-card py-20" data-icod-id="landing_how_it_works">
        <div className="mx-auto max-w-6xl px-6" data-icod-id="landing_steps_inner">
          <h2
            className="mb-12 text-center text-xl font-semibold text-foreground"
            data-icod-id="landing_steps_heading">
            Get started in minutes
          </h2>
          <div
            className="grid gap-8 md:grid-cols-3"
            data-icod-id="landing_steps_grid">
            {steps.map((step) => (
              <div key={step.number} className="text-center" data-icod-id={`landing_step_${step.number}`}>
                <div
                  className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-md font-semibold text-primary-foreground"
                  data-icod-id={`landing_step_number_${step.number}`}>
                  {step.number}
                </div>
                <h3
                  className="mt-4 text-md font-semibold text-foreground"
                  data-icod-id={`src_pages_landingpage_tsx_494b_${step.number}`}>{step.title}</h3>
                <p
                  className="mt-1 text-sm text-muted-foreground"
                  data-icod-id={`src_pages_landingpage_tsx_fda0_${step.number}`}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ─── CTA Band ────────────────────────────────────────────────── */}
      <section
        className="bg-primary/10 py-16 text-center"
        data-icod-id="landing_cta_band">
        <div className="mx-auto max-w-6xl px-6" data-icod-id="landing_cta_inner">
          <h2 className="text-xl font-semibold text-foreground" data-icod-id="landing_cta_heading">
            Ready to get organized?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground" data-icod-id="landing_cta_subtext">
             Join teams who use AD Smartsheet to ship faster and stay aligned.
          </p>
          <div className="mt-6" data-icod-id="landing_cta_button">
            <Link
              to="/login"
              className={buttonClass({ variant: 'primary', size: 'lg' })}
              data-icod-id="src_pages_landingpage_tsx_13a6">
                             Log in to AD Smartsheet
            </Link>
          </div>
        </div>
      </section>
      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer
        className="border-t border-border bg-card py-8"
        data-icod-id="landing_footer">
        <div
          className="mx-auto flex max-w-6xl items-center justify-between px-6"
          data-icod-id="landing_footer_inner">
          <div className="flex items-center gap-2" data-icod-id="landing_footer_logo">
            <LayoutGrid
              className="h-4 w-4 text-primary"
              data-icod-id="src_pages_landingpage_tsx_005c" />
            <span
              className="text-sm font-bold text-primary"
               data-icod-id="src_pages_landingpage_tsx_fffb">AD Smartsheet</span>
          </div>
          <p className="text-xs text-muted-foreground" data-icod-id="landing_footer_copy">
             &copy; 2026 AD Smartsheet. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
