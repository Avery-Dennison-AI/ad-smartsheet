import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

/** Underline-style tab switcher. */
export default function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn('flex items-center gap-0 border-b border-border', className)}
      data-icod-id="src_components_ui_tabs_tsx_1fb1">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors duration-150 ease-in-out',
              'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
            data-icod-id={`src_components_ui_tabs_tsx_8b94_${tab.id}`}>
            {tab.icon && <span
              className="h-4 w-4"
              data-icod-id={`src_components_ui_tabs_tsx_543e_${tab.id}`}>{tab.icon}</span>}
            {tab.label}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"
                data-icod-id={`src_components_ui_tabs_tsx_aac1_${tab.id}`} />
            )}
          </button>
        );
      })}
    </div>
  );
}
