import { CheckCircle, AlertCircle } from 'lucide-react';
import FileIcon from './FileIcon';
import { cn } from '@/utils/cn';

export interface UploadProgressRowProps {
  fileName: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  errorMessage?: string;
}

/** Extract extension from a filename. */
function getExt(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot >= 0 ? fileName.slice(dot) : '';
}

/** Truncate filename to ~30 chars with ellipsis in the middle. */
function truncateName(name: string, max = 30): string {
  if (name.length <= max) return name;
  const ext = getExt(name);
  const baseMax = max - ext.length - 1; // 1 for ellipsis
  if (baseMax <= 3) return name.slice(0, max - 1) + '\u2026';
  return name.slice(0, baseMax) + '\u2026' + ext;
}

export default function UploadProgressRow({
  fileName,
  progress,
  status,
  errorMessage,
}: UploadProgressRowProps) {
  const ext = getExt(fileName);

  return (
    <div
      className="flex items-center gap-3 rounded-md border border-border bg-card p-2"
      data-icod-id="src_components_ui_uploadprogressrow_tsx_row">
      <FileIcon
        extension={ext}
        size={18}
        data-icod-id="src_components_ui_uploadprogressrow_tsx_icon" />

      <div
        className="min-w-0 flex-1"
        data-icod-id="src_components_ui_uploadprogressrow_tsx_info">
        <p
          className="truncate text-sm font-medium text-foreground"
          title={fileName}
          data-icod-id="src_components_ui_uploadprogressrow_tsx_name">
          {truncateName(fileName)}
        </p>

        {status === 'uploading' && (
          <div
            className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted"
            data-icod-id="src_components_ui_uploadprogressrow_tsx_bar_bg">
            <div
              className={cn('h-full rounded-full bg-primary transition-all duration-200')}
              style={{ width: `${Math.min(progress, 100)}%` }}
              data-icod-id="src_components_ui_uploadprogressrow_tsx_bar_fill" />
          </div>
        )}

        {status === 'error' && errorMessage && (
          <p
            className="mt-0.5 text-xs text-destructive"
            data-icod-id="src_components_ui_uploadprogressrow_tsx_error">
            {errorMessage}
          </p>
        )}
      </div>

      {status === 'done' && (
        <CheckCircle
          className="h-4 w-4 shrink-0 text-success"
          data-icod-id="src_components_ui_uploadprogressrow_tsx_done" />
      )}
      {status === 'error' && (
        <AlertCircle
          className="h-4 w-4 shrink-0 text-destructive"
          data-icod-id="src_components_ui_uploadprogressrow_tsx_err_icon" />
      )}
    </div>
  );
}
