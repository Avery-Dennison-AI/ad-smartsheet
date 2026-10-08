import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      data-icod-id="src_components_ui_breadcrumbs_tsx_4149">
      <ol
        className="flex items-center gap-1 text-sm"
        data-icod-id="src_components_ui_breadcrumbs_tsx_aaf9">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={index}
              className="flex items-center gap-1"
              data-icod-id={`src_components_ui_breadcrumbs_tsx_8ef6_${index}`}>
              {index > 0 && (
                <ChevronRight
                  className="h-[14px] w-[14px] text-[var(--color-gray-400)]"
                  aria-hidden="true"
                  data-icod-id={`src_components_ui_breadcrumbs_tsx_63c0_${index}`} />
              )}
              {isLast ? (
                <span
                  aria-current="page"
                  className="flex items-center gap-1 font-medium text-[var(--color-gray-900)]"
                  data-icod-id={`src_components_ui_breadcrumbs_tsx_ec14_${index}`}>
                  {item.icon}
                  {item.label}
                </span>
              ) : item.to ? (
                <Link
                  to={item.to}
                  className="flex items-center gap-1 text-[var(--color-gray-600)] hover:text-[var(--color-primary)] transition-colors"
                  data-icod-id={`src_components_ui_breadcrumbs_tsx_8a65_${index}`}>
                  {item.icon}
                  {item.label}
                </Link>
              ) : (
                <span
                  className="flex items-center gap-1 text-[var(--color-gray-600)]"
                  data-icod-id={`src_components_ui_breadcrumbs_tsx_0440_${index}`}>
                  {item.icon}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
