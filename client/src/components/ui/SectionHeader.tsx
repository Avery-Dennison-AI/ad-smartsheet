import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  actions?: ReactNode;
}

export default function SectionHeader({ title, actions }: SectionHeaderProps) {
  return (
    <div
      className="mb-4 flex items-start justify-between"
      data-icod-id="src_components_ui_sectionheader_tsx_5b5b">
      <h2
        className="text-xl font-semibold text-[var(--color-gray-900)]"
        data-icod-id="src_components_ui_sectionheader_tsx_0b35">
        {title}
      </h2>
      {actions && <div data-icod-id="src_components_ui_sectionheader_tsx_a86a">{actions}</div>}
    </div>
  );
}
