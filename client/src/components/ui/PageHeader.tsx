import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export default function PageHeader({ title, description, actions, icon, className }: PageHeaderProps) {
  return (
    <div
      className={cn('mb-6 flex items-center justify-between', className)}
      data-icod-id="src_components_ui_pageheader_tsx_3f45">
      <div className="flex items-center gap-3 min-w-0" data-icod-id="src_components_ui_pageheader_tsx_3ffd">
        {icon && (
          <div className="self-stretch flex items-center shrink-0" data-icod-id="src_components_ui_pageheader_tsx_icon">
            {icon}
          </div>
        )}
        <div className="min-w-0" data-icod-id="src_components_ui_pageheader_tsx_titleblock">
          <h1
            className="truncate font-semibold text-xl text-[var(--color-gray-900)]"
            data-icod-id="src_components_ui_pageheader_tsx_398c">
            {title}
          </h1>
          {description && (
            <p
              className="mt-1 truncate text-base text-[var(--color-gray-600)]"
              data-icod-id="src_components_ui_pageheader_tsx_48bb">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="shrink-0 self-center" data-icod-id="src_components_ui_pageheader_tsx_3778">{actions}</div>}
    </div>
  );
}
