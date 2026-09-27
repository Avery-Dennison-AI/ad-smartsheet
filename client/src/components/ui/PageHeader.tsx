import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn('mb-6 flex items-start justify-between', className)}
      data-icod-id="src_components_ui_pageheader_tsx_3f45">
      <div data-icod-id="src_components_ui_pageheader_tsx_3ffd">
        <h1
          className="font-semibold text-token-xl text-[var(--color-gray-900)]"
          data-icod-id="src_components_ui_pageheader_tsx_398c">
          {title}
        </h1>
        {description && (
          <p
            className="mt-1 text-token-base text-[var(--color-gray-600)]"
            data-icod-id="src_components_ui_pageheader_tsx_48bb">
            {description}
          </p>
        )}
      </div>
      {actions && <div data-icod-id="src_components_ui_pageheader_tsx_3778">{actions}</div>}
    </div>
  );
}
