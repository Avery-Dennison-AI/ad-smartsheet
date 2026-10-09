import {
  Image as ImageIcon,
  FileText,
  Table,
  Archive,
  FileSpreadsheet,
  Mail,
  File,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

// ─── Extension → icon + color mapping ──────────────────────────────────────

interface FileIconConfig {
  icon: LucideIcon;
  colorClass: string;
}

const EXT_MAP: Record<string, FileIconConfig> = {
  // Images
  png:  { icon: ImageIcon,      colorClass: 'text-success' },
  jpg:  { icon: ImageIcon,      colorClass: 'text-success' },
  jpeg: { icon: ImageIcon,      colorClass: 'text-success' },
  gif:  { icon: ImageIcon,      colorClass: 'text-success' },
  webp: { icon: ImageIcon,      colorClass: 'text-success' },
  // PDF
  pdf:  { icon: FileText,       colorClass: 'text-destructive' },
  // Spreadsheets
  xlsx: { icon: Table,          colorClass: 'text-success' },
  xls:  { icon: Table,          colorClass: 'text-success' },
  csv:  { icon: FileSpreadsheet, colorClass: 'text-muted-foreground' },
  ods:  { icon: Table,          colorClass: 'text-success' },
  // Word / documents
  docx: { icon: FileText,       colorClass: 'text-primary' },
  doc:  { icon: FileText,       colorClass: 'text-primary' },
  odt:  { icon: FileText,       colorClass: 'text-primary' },
  pptx: { icon: FileText,       colorClass: 'text-warning' },
  ppt:  { icon: FileText,       colorClass: 'text-warning' },
  odp:  { icon: FileText,       colorClass: 'text-warning' },
  // Text / data
  txt:  { icon: FileSpreadsheet, colorClass: 'text-muted-foreground' },
  md:   { icon: FileSpreadsheet, colorClass: 'text-muted-foreground' },
  json: { icon: FileSpreadsheet, colorClass: 'text-muted-foreground' },
  // Archives
  zip:  { icon: Archive,        colorClass: 'text-warning' },
  // Email
  eml:  { icon: Mail,           colorClass: 'text-primary' },
  msg:  { icon: Mail,           colorClass: 'text-primary' },
};

const MIME_MAP: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'text/csv': 'csv',
  'application/vnd.oasis.opendocument.spreadsheet': 'ods',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.oasis.opendocument.text': 'odt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.oasis.opendocument.presentation': 'odp',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'application/json': 'json',
  'application/zip': 'zip',
  'message/rfc822': 'eml',
  'application/vnd.ms-outlook': 'msg',
};

const DEFAULT_CONFIG: FileIconConfig = { icon: File, colorClass: 'text-muted-foreground' };

// ─── Component ──────────────────────────────────────────────────────────────

export interface FileIconProps {
  extension: string;
  mimeType?: string;
  size?: number;
  className?: string;
}

export default function FileIcon({ extension, mimeType, size = 20, className }: FileIconProps) {
  const ext = extension.replace(/^\./, '').toLowerCase();
  let config = EXT_MAP[ext];
  if (!config && mimeType) {
    const mappedExt = MIME_MAP[mimeType];
    if (mappedExt) config = EXT_MAP[mappedExt];
  }
  if (!config) config = DEFAULT_CONFIG;

  const Icon = config.icon;

  return (
    <Icon
      className={cn(config.colorClass, className)}
      style={{ width: size, height: size }}
      data-icod-id="src_components_ui_fileicon_tsx_icon" />
  );
}
