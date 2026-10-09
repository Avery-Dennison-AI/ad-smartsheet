import { useEffect, useState, useCallback, useRef } from 'react';
import { Download, Trash2, Paperclip, X } from 'lucide-react';
import {
  Button,
  Spinner,
  EmptyState,
  Modal,
  ConfirmDialog,
  Tooltip,
  RelativeTime,
  FileIcon,
  FileDropzone,
  UploadProgressRow,
} from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  loadAttachments,
  uploadAttachments,
  removeAttachment,
  selectAttachmentsForRow,
} from '@/store/slices/attachmentsSlice';
import { getDownloadUrl, getPreviewUrl, fetchAttachmentConfig } from '@/services/attachmentService';
import type { WorkspaceRole, FormattedAttachment, AttachmentConfig } from '@/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Format bytes to human-readable size. */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Check if a MIME type is previewable (image or PDF). */
function isPreviewable(contentType: string): boolean {
  return (
    contentType.startsWith('image/') ||
    contentType === 'application/pdf'
  );
}

/** Extract extension from filename. */
function getExt(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot) : '';
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface AttachmentsTabProps {
  sheetId: string;
  rowId: string;
  userRole: WorkspaceRole;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AttachmentsTab({ sheetId, rowId, userRole }: AttachmentsTabProps) {
  const dispatch = useAppDispatch();
  const { items, loading, uploading, error, uploadProgress } = useAppSelector((state) =>
    selectAttachmentsForRow(state, rowId),
  );
  const canEdit = userRole !== 'viewer';

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Config cache — fetched once
  const configRef = useRef<AttachmentConfig | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Preview modal state
  const [previewAtt, setPreviewAtt] = useState<FormattedAttachment | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Upload file tracking for progress display
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);

  // Load attachments on mount
  useEffect(() => {
    dispatch(loadAttachments({ sheetId, rowId }));
  }, [dispatch, sheetId, rowId]);

  // Load config once
  useEffect(() => {
    if (configRef.current) return;
    fetchAttachmentConfig()
      .then((cfg) => {
        if (!isMountedRef.current) return;
        configRef.current = cfg;
        setConfigLoaded(true);
      })
      .catch((err) => {
        if (!isMountedRef.current) return;
        console.error('[AttachmentsTab] Failed to load config:', err);
        setConfigLoaded(true); // proceed anyway
      });
  }, []);

  // Handle file upload
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      if (!canEdit || files.length === 0) return;

      // Client-side validation against config
      const config = configRef.current;
      if (config) {
        const allowedSet = new Set(config.allowedExtensions.map((e) => e.toLowerCase()));
        const validFiles: File[] = [];
        for (const file of files) {
          const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '');
          if (!allowedSet.has(ext)) {
            console.warn(`[AttachmentsTab] Rejected ${file.name}: extension ${ext} not allowed`);
            continue;
          }
          validFiles.push(file);
        }
        if (validFiles.length === 0) return;
        if (isMountedRef.current) setUploadingFiles(validFiles);
        await dispatch(uploadAttachments({ sheetId, rowId, files: validFiles }));
        if (isMountedRef.current) setUploadingFiles([]);
      } else {
        if (isMountedRef.current) setUploadingFiles(files);
        await dispatch(uploadAttachments({ sheetId, rowId, files }));
        if (isMountedRef.current) setUploadingFiles([]);
      }
    },
    [dispatch, sheetId, rowId, canEdit],
  );

  // Handle delete
  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    dispatch(removeAttachment({ attachmentId: deleteTarget, rowId }));
    setDeleteTarget(null);
  }, [dispatch, deleteTarget, rowId]);

  // Handle preview click
  const handlePreviewClick = useCallback((att: FormattedAttachment) => {
    if (isPreviewable(att.contentType)) {
      setPreviewAtt(att);
    }
  }, []);

  // Close preview
  const handleClosePreview = useCallback(() => {
    setPreviewAtt(null);
  }, []);

  // Accept list for dropzone
  const acceptList = configRef.current?.allowedExtensions;

  if (loading && items.length === 0) {
    return (
      <div className="flex justify-center py-8" data-icod-id="src_features_itemdetail_attachmentstab_tsx_loading">
        <Spinner size="md" data-icod-id="src_features_itemdetail_attachmentstab_tsx_spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-sm text-destructive" data-icod-id="src_features_itemdetail_attachmentstab_tsx_error">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-icod-id="src_features_itemdetail_attachmentstab_tsx_container">
      {/* Upload zone — editors/admins only */}
      {canEdit && configLoaded && (
        <div data-icod-id="src_features_itemdetail_attachmentstab_tsx_upload_zone">
          <FileDropzone
            onFiles={handleFilesSelected}
            accept={acceptList}
            maxFiles={configRef.current?.maxFilesPerUpload}
            disabled={uploading}
            data-icod-id="src_features_itemdetail_attachmentstab_tsx_dropzone" />

          {/* Upload progress rows */}
          {uploadingFiles.length > 0 && (
            <div className="mt-3 flex flex-col gap-2" data-icod-id="src_features_itemdetail_attachmentstab_tsx_progress_list">
              {uploadingFiles.map((file, idx) => {
                const key = `${rowId}-${idx}`;
                const pct = uploadProgress[key] ?? 0;
                return (
                  <UploadProgressRow
                    key={key}
                    fileName={file.name}
                    progress={pct}
                    status={uploading ? 'uploading' : 'done'}
                    data-icod-id={`src_features_itemdetail_attachmentstab_tsx_progress_${idx}`} />
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* File list */}
      {items.length === 0 ? (
        <EmptyState
          icon={Paperclip}
          title="No attachments yet"
          description="Upload files to attach them to this item"
          data-icod-id="src_features_itemdetail_attachmentstab_tsx_empty" />
      ) : (
        <div className="flex flex-col gap-1" data-icod-id="src_features_itemdetail_attachmentstab_tsx_list">
          {items.map((att) => {
            const ext = getExt(att.originalName);
            const canDelete = userRole === 'admin' || userRole === 'owner' || att.uploadedBy === att.uploadedBy; // uploader check done below
            const showPreview = isPreviewable(att.contentType);

            return (
              <div
                key={att.id}
                className="group flex items-center gap-3 rounded-md border border-border bg-card p-2 transition-colors hover:bg-muted/30"
                data-icod-id={`src_features_itemdetail_attachmentstab_tsx_row_${att.id}`}>
                {/* Thumbnail or icon */}
                {att.contentType.startsWith('image/') ? (
                  <button
                    type="button"
                    onClick={() => handlePreviewClick(att)}
                    className="shrink-0 overflow-hidden rounded"
                    data-icod-id={`src_features_itemdetail_attachmentstab_tsx_thumb_${att.id}`}>
                    <img
                      src={getPreviewUrl(att.id)}
                      alt={att.originalName}
                      className="h-10 w-10 object-cover"
                      loading="lazy"
                      data-icod-id={`src_features_itemdetail_attachmentstab_tsx_img_${att.id}`} />
                  </button>
                ) : (
                  <div
                    className={showPreview ? 'cursor-pointer' : ''}
                    onClick={() => showPreview && handlePreviewClick(att)}
                    data-icod-id={`src_features_itemdetail_attachmentstab_tsx_iconwrap_${att.id}`}>
                    <FileIcon extension={ext} mimeType={att.contentType} size={24} data-icod-id={`src_features_itemdetail_attachmentstab_tsx_ficon_${att.id}`} />
                  </div>
                )}
                {/* Filename + meta */}
                <div className="min-w-0 flex-1" data-icod-id={`src_features_itemdetail_attachmentstab_tsx_info_${att.id}`}>
                  <Tooltip
                    content={att.originalName}
                    data-icod-id={`src_features_itemdetail_attachmentstab_tsx_f2dd_${att.id}`}>
                    <p
                      className={`truncate text-sm font-medium text-foreground ${showPreview ? 'cursor-pointer hover:underline' : ''}`}
                      onClick={() => showPreview && handlePreviewClick(att)}
                      data-icod-id={`src_features_itemdetail_attachmentstab_tsx_name_${att.id}`}>
                      {att.originalName.length > 30
                        ? att.originalName.slice(0, 27) + '\u2026' + ext
                        : att.originalName}
                    </p>
                  </Tooltip>
                  <p className="text-xs text-muted-foreground" data-icod-id={`src_features_itemdetail_attachmentstab_tsx_meta_${att.id}`}>
                    {formatSize(att.size)} &middot; {att.uploaderName} &middot;{' '}
                    <RelativeTime date={att.createdAt} data-icod-id={`src_features_itemdetail_attachmentstab_tsx_time_${att.id}`} />
                  </p>
                </div>
                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1" data-icod-id={`src_features_itemdetail_attachmentstab_tsx_actions_${att.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Download"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = getDownloadUrl(att.id);
                      a.download = att.originalName;
                      a.rel = 'noopener noreferrer';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    className="!h-7 !w-7 !p-0 opacity-0 group-hover:opacity-100"
                    data-icod-id={`src_features_itemdetail_attachmentstab_tsx_dl_${att.id}`}>
                    <Download className="h-4 w-4" data-icod-id={`src_features_itemdetail_attachmentstab_tsx_dl_icon_${att.id}`} />
                  </Button>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Delete attachment"
                      onClick={() => setDeleteTarget(att.id)}
                      className="opacity-0 group-hover:opacity-100"
                      data-icod-id={`src_features_itemdetail_attachmentstab_tsx_del_${att.id}`}>
                      <Trash2 className="h-4 w-4" data-icod-id={`src_features_itemdetail_attachmentstab_tsx_del_icon_${att.id}`} />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Preview Modal */}
      <Modal
        open={!!previewAtt}
        onClose={handleClosePreview}
        title={previewAtt?.originalName}
        size="lg"
        footer={
          previewAtt ? (
            <div className="flex justify-end gap-2" data-icod-id="src_features_itemdetail_attachmentstab_tsx_preview_footer">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Download
                  className="h-4 w-4"
                  data-icod-id="src_features_itemdetail_attachmentstab_tsx_de31" />}
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = getDownloadUrl(previewAtt.id);
                  a.download = previewAtt.originalName;
                  a.rel = 'noopener noreferrer';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                data-icod-id="src_features_itemdetail_attachmentstab_tsx_preview_dl_btn">
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClosePreview} data-icod-id="src_features_itemdetail_attachmentstab_tsx_preview_close">
                Close
              </Button>
            </div>
          ) : undefined
        }
        data-icod-id="src_features_itemdetail_attachmentstab_tsx_preview_modal">
        {previewAtt && (
          <div className="flex min-h-[300px] items-center justify-center" data-icod-id="src_features_itemdetail_attachmentstab_tsx_preview_content">
            {previewAtt.contentType.startsWith('image/') ? (
              <img
                src={getPreviewUrl(previewAtt.id)}
                alt={previewAtt.originalName}
                className="max-h-[70vh] max-w-full rounded object-contain"
                data-icod-id="src_features_itemdetail_attachmentstab_tsx_preview_img" />
            ) : previewAtt.contentType === 'application/pdf' ? (
              <iframe
                src={getPreviewUrl(previewAtt.id)}
                title={previewAtt.originalName}
                className="h-[70vh] w-full rounded border border-border"
                data-icod-id="src_features_itemdetail_attachmentstab_tsx_preview_pdf" />
            ) : null}
          </div>
        )}
      </Modal>
      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete attachment"
        description="Are you sure you want to delete this attachment? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        data-icod-id="src_features_itemdetail_attachmentstab_tsx_delete_dialog" />
    </div>
  );
}
