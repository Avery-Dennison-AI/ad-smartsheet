import { Table2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SheetIconProps {
  className?: string;
}

export default function SheetIcon({ className }: SheetIconProps) {
  return (
    <Table2
      className={cn('h-4 w-4 text-primary', className)}
      data-icod-id="src_components_ui_sheeticon_tsx_e5c8" />
  );
}
