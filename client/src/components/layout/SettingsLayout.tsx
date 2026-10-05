import type { ReactNode } from 'react';

export interface SettingsNavItem {
  label: string;
  route: string;
}

export interface SettingsNavGroup {
  groupLabel?: string;
  items: SettingsNavItem[];
}

interface SettingsLayoutProps {
  /** @deprecated Nav is now in AppShell sidebar. Prop kept for backward compat. */
  navGroups?: SettingsNavGroup[];
  children: ReactNode;
  [key: string]: unknown;
}

/** Content wrapper for settings pages — nav is now in AppShell sidebar. */
export default function SettingsLayout({ children, ...rest }: SettingsLayoutProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6" {...rest} data-icod-id="settings_layout">
      {children}
    </div>
  );
}
