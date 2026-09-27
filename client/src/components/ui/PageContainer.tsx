import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  /** When true, removes the max-width constraint but keeps horizontal/vertical padding. */
  fullWidth?: boolean;
}

/** Shared wrapper used by every app page for consistent padding and max-width. */
export default function PageContainer({ children, className, fullWidth = false }: PageContainerProps) {
  return (
    <div
      className={cn(
        'w-full px-6 py-6 xl:px-8 xl:py-8',
        !fullWidth && 'mx-auto max-w-6xl',
        className,
      )}
      data-icod-id="src_components_ui_pagecontainer_tsx_8bc5">
      {children}
    </div>
  );
}
