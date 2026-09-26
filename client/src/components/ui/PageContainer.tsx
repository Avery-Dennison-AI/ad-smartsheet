import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/** Shared wrapper used by every app page for consistent padding and max-width. */
export default function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full max-w-6xl px-6 py-6 xl:px-8 xl:py-8', className)}
      data-icod-id="src_components_ui_pagecontainer_tsx_8bc5">
      {children}
    </div>
  );
}
