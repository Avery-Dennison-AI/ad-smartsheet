import { useRef, useState, useCallback, type ReactNode } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface FileDropzoneProps {
  onFiles: (files: File[]) => void;
  accept?: string[];
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

/** Validates file extensions client-side. Returns valid files and rejected count. */
function validateFiles(
  fileList: FileList | File[],
  accept?: string[],
  maxFiles?: number,
): { valid: File[]; rejectedCount: number } {
  const files = Array.from(fileList);
  if (!accept || accept.length === 0) {
    const limited = maxFiles ? files.slice(0, maxFiles) : files;
    return { valid: limited, rejectedCount: files.length - limited.length };
  }

  const acceptSet = new Set(accept.map((a) => a.toLowerCase()));
  const valid: File[] = [];
  let rejectedCount = 0;

  for (const file of files) {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (acceptSet.has(ext)) {
      valid.push(file);
    } else {
      rejectedCount++;
    }
  }

  if (maxFiles && valid.length > maxFiles) {
    rejectedCount += valid.length - maxFiles;
    return { valid: valid.slice(0, maxFiles), rejectedCount };
  }

  return { valid, rejectedCount };
}

export default function FileDropzone({
  onFiles,
  accept,
  maxFiles,
  disabled = false,
  className,
  children,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      if (disabled) return;
      const { valid, rejectedCount } = validateFiles(fileList, accept, maxFiles);
      if (valid.length > 0) {
        onFiles(valid);
      }
      if (rejectedCount > 0) {
        // Show toast via the caller's responsibility — we just report
        // But we can use a simple alert for now; the AttachmentsTab will handle toasts
        console.warn(`[FileDropzone] ${rejectedCount} file(s) rejected due to type or limit`);
      }
    },
    [onFiles, accept, maxFiles, disabled],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (disabled) return;
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles, disabled],
  );

  const handleClick = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
      // Reset so the same file can be selected again
      e.target.value = '';
    },
    [handleFiles],
  );

  // If children are provided, wrap them as the drop target
  if (children) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn('relative', className)}
        data-icod-id="src_components_ui_filedropzone_tsx_children_wrap">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept?.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
          data-icod-id="src_components_ui_filedropzone_tsx_input_children" />
        {children}
      </div>
    );
  }

  // Default drop zone UI
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors',
        isDragOver
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-muted-foreground/40',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      data-icod-id="src_components_ui_filedropzone_tsx_default">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept?.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
        data-icod-id="src_components_ui_filedropzone_tsx_input_default" />
      <Upload
        className="h-8 w-8 text-muted-foreground"
        data-icod-id="src_components_ui_filedropzone_tsx_icon" />
      <p
        className="text-sm text-muted-foreground"
        data-icod-id="src_components_ui_filedropzone_tsx_label">
        Drag files here or click to upload
      </p>
    </div>
  );
}
