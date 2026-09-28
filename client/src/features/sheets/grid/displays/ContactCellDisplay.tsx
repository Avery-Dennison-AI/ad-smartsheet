import { Avatar } from '@/components/ui';

interface GridMember {
  id: string;
  fullName: string;
  email: string;
}

interface ContactCellDisplayProps {
  value: string | number | boolean | null;
  workspaceMembers?: GridMember[];
}

export default function ContactCellDisplay({ value, workspaceMembers }: ContactCellDisplayProps) {
  if (value == null || value === '') {
    return (
      <span
        className="text-muted-foreground/40"
        data-icod-id="src_features_sheets_grid_displays_contactcelldisplay_tsx_dd8f" />
    );
  }

  const member = workspaceMembers?.find((m) => m.id === String(value));
  if (member) {
    return (
      <div
        className="flex items-center gap-1.5 truncate"
        data-icod-id="src_features_sheets_grid_displays_contactcelldisplay_tsx_713d">
        <Avatar
          name={member.fullName}
          size="sm"
          className="!h-5 !w-5"
          data-icod-id="src_features_sheets_grid_displays_contactcelldisplay_tsx_d70b" />
        <span
          className="truncate text-xs"
          data-icod-id="src_features_sheets_grid_displays_contactcelldisplay_tsx_8b6f">{member.fullName}</span>
      </div>
    );
  }

  return (
    <span
      className="truncate"
      data-icod-id="src_features_sheets_grid_displays_contactcelldisplay_tsx_92ad">{String(value)}</span>
  );
}
