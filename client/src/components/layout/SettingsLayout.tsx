import type { ReactNode } from 'react';
import { Link, useMatch } from 'react-router-dom';
import { cn } from '@/utils/cn';

export interface SettingsNavItem {
  label: string;
  route: string;
}

export interface SettingsNavGroup {
  groupLabel?: string;
  items: SettingsNavItem[];
}

interface SettingsLayoutProps {
  navGroups: SettingsNavGroup[];
  children: ReactNode;
  [key: string]: unknown;
}

const focusRingClasses =
  'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]';

/** Two-panel settings shell: left nav + right content area. */
export default function SettingsLayout({ navGroups, children, ...rest }: SettingsLayoutProps) {
  return (
    <div className="flex h-full w-full overflow-hidden" {...rest} data-icod-id="settings_layout">
      {/* Left nav panel */}
      <nav
        className="w-60 shrink-0 border-r border-border flex flex-col gap-1 p-4 overflow-y-auto"
        data-icod-id="settings_layout_nav">
        <h2
          className="text-sm font-semibold text-foreground mb-2"
          data-icod-id="settings_layout_title">Settings</h2>
        {navGroups.map((group, gi) => (
          <div key={gi} data-icod-id={`settings_layout_group_${gi}`}>
            {group.groupLabel && (
              <span
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 mt-3 first:mt-0 block px-2"
                data-icod-id={`settings_layout_grouplabel_${gi}`}>
                {group.groupLabel}
              </span>
            )}
            <div className="flex flex-col gap-0.5" data-icod-id={`settings_layout_items_${gi}`}>
              {group.items.map((item) => (
                <SettingsNavLink
                  key={item.route}
                  label={item.label}
                  to={item.route}
                  data-icod-id={`settings_layout_link_${item.route}`} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      {/* Right content panel */}
      <div
        className="flex-1 overflow-y-auto p-8"
        data-icod-id="settings_layout_content">
        {children}
      </div>
    </div>
  );
}

/* ─── Internal nav link with active detection ─────────────────────────────── */
interface SettingsNavLinkProps {
  label: string;
  to: string;
}

function SettingsNavLink({ label, to }: SettingsNavLinkProps) {
  const match = useMatch(to);
  const active = !!match;

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center rounded-[var(--radius-md)] px-2 py-2 text-sm transition-colors duration-150',
        focusRingClasses,
        active
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
      data-icod-id="settings_nav_link">
      <span className="truncate" data-icod-id="settings_nav_label">{label}</span>
    </Link>
  );
}
