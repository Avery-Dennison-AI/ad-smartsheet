import { Check, ChevronDown } from 'lucide-react';
import DropdownMenu from './DropdownMenu';
import type { DropdownMenuItem } from './DropdownMenu';
import { inputClass } from './Input';
import { cn } from '@/utils/cn';

export type RoleValue = 'admin' | 'editor' | 'viewer';

export interface RoleMenuProps {
  value: RoleValue;
  onChange: (role: RoleValue) => void;
  onLeave?: () => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
}

const ROLE_ITEMS: { role: RoleValue; label: string; description: string }[] = [
  { role: 'admin', label: 'Admin', description: 'Manage members and settings' },
  { role: 'editor', label: 'Editor', description: 'Edit sheets' },
  { role: 'viewer', label: 'Viewer', description: 'View only' },
];

export default function RoleMenu({
  value,
  onChange,
  onLeave,
  onRemove,
  disabled,
  className,
}: RoleMenuProps) {
  const currentLabel = ROLE_ITEMS.find((r) => r.role === value)?.label ?? value;

  const menuItems: DropdownMenuItem[] = [];

  for (const r of ROLE_ITEMS) {
    const labelNode = (
      <div
        className="flex flex-col"
        data-icod-id="src_components_ui_rolemenu_tsx_26ef">
        <span
          className="text-sm text-foreground"
          data-icod-id="src_components_ui_rolemenu_tsx_ccc8">{r.label}</span>
        <span
          className="text-xs text-muted-foreground"
          data-icod-id="src_components_ui_rolemenu_tsx_177a">{r.description}</span>
      </div>
    );

    menuItems.push({
      label: labelNode,
      onClick: () => onChange(r.role),
      icon: r.role === value ? <Check
        className="h-3 w-3 text-primary"
        data-icod-id="src_components_ui_rolemenu_tsx_64f3" /> : undefined,
    });
  }

  if (onRemove || onLeave) {
    menuItems.push({ type: 'divider' });
  }

  if (onRemove) {
    menuItems.push({
      label: 'Remove from workspace',
      danger: true,
      onClick: onRemove,
    });
  }

  if (onLeave) {
    menuItems.push({
      label: 'Leave workspace',
      danger: true,
      onClick: onLeave,
    });
  }

  return (
    <DropdownMenu
      trigger={
        <button
          type="button"
          disabled={disabled}
          className={cn(
            inputClass('flex shrink-0 items-center gap-1 pr-2', 'sm'),
            'w-auto cursor-pointer appearance-none',
            disabled && 'cursor-not-allowed opacity-50',
            className,
          )}
          data-icod-id="src_components_ui_rolemenu_tsx_f07e">
          <span
            className="text-sm text-foreground capitalize"
            data-icod-id="src_components_ui_rolemenu_tsx_7a6d">{currentLabel}</span>
          <ChevronDown
            className="h-3 w-3 shrink-0 text-muted-foreground"
            data-icod-id="src_components_ui_rolemenu_tsx_f2a7" />
        </button>
      }
      items={menuItems}
      data-icod-id="src_components_ui_rolemenu_tsx_71c4" />
  );
}
