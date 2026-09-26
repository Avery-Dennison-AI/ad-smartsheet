import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div
      className="mb-6 flex items-start justify-between"
      data-icod-id="src_components_ui_pageheader_tsx_3f45">
      <div data-icod-id="src_components_ui_pageheader_tsx_3ffd">
        <h1
          className="font-semibold text-[var(--color-gray-900)]"
          style={{ fontSize: 'var(--text-xl)' }}
          data-icod-id="src_components_ui_pageheader_tsx_398c">
          {title}
        </h1>
        {description && (
          <p
            className="mt-1 text-[var(--color-gray-600)]"
            style={{ fontSize: 'var(--text-base)' }}
            data-icod-id="src_components_ui_pageheader_tsx_48bb">
            {description}
          </p>
        )}
      </div>
      {actions && <div data-icod-id="src_components_ui_pageheader_tsx_3778">{actions}</div>}
    </div>
  );
}
