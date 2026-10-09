import crypto from 'crypto';
import fs from 'fs';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';
import mongoose from 'mongoose';
import Attachment, { type IAttachment } from '../models/Attachment';
import { storageDriver } from './storage';
import { requireSheetAccess } from './permissionService';
import { recordActivity } from './activityService';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import {
  checkExtensionAndMime,
  validateFileSize,
  verifySignature,
  sanitizeFilename,
} from './fileSecurity';
import { virusScanner } from './virusScanner';

// ─── Input types ────────────────────────────────────────────────────────────

/** Disk-based file input from multer diskStorage. */
export interface DiskFileInput {
  tempPath: string;
  originalname: string;
  size: number;
  mimetype: string;
}

/**
 * Legacy buffer-based input — kept for backward compatibility with tests.
 * When used, the buffer is written to a temp file first.
 */
export interface UploadFileInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

// ─── Formatted attachment response ──────────────────────────────────────────

interface FormattedAttachment {
  id: string;
  sheetId: string;
  rowId: string;
  uploadedBy: string;
  uploaderName: string;
  originalName: string;
  contentType: string;
  size: number;
  createdAt: Date;
}

function formatAttachment(doc: any): FormattedAttachment {
  const uploader = doc.uploadedBy as { _id?: mongoose.Types.ObjectId; fullName?: string; deletedAt?: Date } | string;
  let uploaderName: string;
  let uploaderIdStr: string;

  if (uploader && typeof uploader === 'object' && 'fullName' in uploader) {
    const name = uploader.fullName ?? 'Unknown';
    uploaderName = uploader.deletedAt ? `${name} (deleted)` : name;
    uploaderIdStr = uploader._id ? uploader._id.toString() : '';
  } else {
    uploaderName = 'Unknown';
    uploaderIdStr = String(uploader);
  }

  return {
    id: doc._id.toString(),
    sheetId: doc.sheetId.toString(),
    rowId: doc.rowId.toString(),
    uploadedBy: uploaderIdStr,
    uploaderName,
    originalName: doc.originalName,
    contentType: doc.contentType,
    size: doc.size,
    createdAt: doc.createdAt,
  };
}

// ─── uploadAttachments ──────────────────────────────────────────────────────

/**
 * Uploads one or more files as attachments to a row. Requires editor+ access.
 *
 * Accepts either disk-based inputs (from multer diskStorage) or legacy
 * buffer-based inputs (for test compatibility). Buffer inputs are written
 * to a temp file before processing.
 *
 * Partial uploads are acceptable: if file 3 of 5 fails, files 1–2 that
 * already succeeded remain stored. Each file's temp path is cleaned up
 * in a per-file try/finally block.
 */
export async function uploadAttachments(
  sheetId: string,
  rowId: string,
  userId: string,
  files: DiskFileInput[] | UploadFileInput[],
): Promise<FormattedAttachment[]> {
  await requireSheetAccess(userId, sheetId, 'editor');

  if (!files || files.length === 0) {
    throw new AppError('No files provided', 400);
  }

  if (files.length > env.MAX_FILES_PER_UPLOAD) {
    throw new AppError(`Too many files. Maximum ${env.MAX_FILES_PER_UPLOAD} files per upload`, 400);
  }

  // Normalize inputs: convert buffer-based to disk-based if needed
  const normalizedFiles: DiskFileInput[] = [];
  const tempFilesCreated: string[] = []; // track temp files we create from buffers

  for (const file of files) {
    if ('tempPath' in file) {
      normalizedFiles.push(file as DiskFileInput);
    } else {
      // Legacy buffer input — write to temp file
      const bufferFile = file as UploadFileInput;
      const tmpDir = path.join(os.tmpdir(), 'upload-staging');
      fs.mkdirSync(tmpDir, { recursive: true });
      const tempPath = path.join(tmpDir, `${crypto.randomUUID()}`);
      await fsp.writeFile(tempPath, bufferFile.buffer);
      tempFilesCreated.push(tempPath);
      normalizedFiles.push({
        tempPath,
        originalname: bufferFile.originalname,
        size: bufferFile.size,
        mimetype: bufferFile.mimetype,
      });
    }
  }

  // Check total request size
  const maxRequestBytes = env.MAX_REQUEST_SIZE_MB * 1024 * 1024;
  const totalRequestSize = normalizedFiles.reduce((sum, f) => sum + f.size, 0);
  if (totalRequestSize > maxRequestBytes) {
    // Clean up any temp files we created
    for (const tp of tempFilesCreated) {
      try { await fsp.unlink(tp); } catch { /* ignore */ }
    }
    throw new AppError(
      `Total upload size exceeds the ${env.MAX_REQUEST_SIZE_MB} MB request limit`,
      413,
    );
  }

  // Pre-validate all files before saving any
  const validatedEntries: Array<{ entry: NonNullable<ReturnType<typeof checkExtensionAndMime>>; file: DiskFileInput }> = [];
  for (const file of normalizedFiles) {
    const entry = checkExtensionAndMime(file.originalname, file.mimetype);
    if (!entry) {
      // Clean up temp files we created
      for (const tp of tempFilesCreated) {
        try { await fsp.unlink(tp); } catch { /* ignore */ }
      }
      throw new AppError(
        `File type "${path.extname(file.originalname)}" is not allowed. Allowed extensions: .pdf, .docx, .doc, .xlsx, .xls, .pptx, .ppt, .odt, .ods, .odp, .txt, .csv, .md, .json, .png, .jpg, .jpeg, .gif, .webp, .zip, .eml, .msg`,
        400,
      );
    }
    validateFileSize(file.size, entry);
    validatedEntries.push({ entry, file });
  }

  // Check total row attachment size
  const existingAttachments = await Attachment.find({
    sheetId: new mongoose.Types.ObjectId(sheetId),
    rowId: new mongoose.Types.ObjectId(rowId),
    deletedAt: null,
  }).select('size');
  const existingSize = existingAttachments.reduce((sum, a) => sum + a.size, 0);
  const incomingSize = normalizedFiles.reduce((sum, f) => sum + f.size, 0);
  if (existingSize + incomingSize > env.MAX_ROW_ATTACHMENT_BYTES) {
    for (const tp of tempFilesCreated) {
      try { await fsp.unlink(tp); } catch { /* ignore */ }
    }
    throw new AppError(
      `Total attachments for this row would exceed the ${Math.round(env.MAX_ROW_ATTACHMENT_BYTES / (1024 * 1024))} MB limit`,
      413,
    );
  }

  // Verify signatures and scan for viruses
  for (const { entry, file } of validatedEntries) {
    await verifySignature(file.tempPath, entry);
    const scanResult = await virusScanner.scan(file.tempPath);
    if (!scanResult.clean) {
      console.warn(`[attachmentService] Virus scanner rejected "${file.originalname}": ${scanResult.threat}`);
      // Clean up temp files we created
      for (const tp of tempFilesCreated) {
        try { await fsp.unlink(tp); } catch { /* ignore */ }
      }
      throw new AppError('File rejected by virus scanner', 400);
    }
  }

  // Process each file: stream to storage, create DB record, clean up temp
  const created: FormattedAttachment[] = [];

  for (const { entry, file } of validatedEntries) {
    try {
      const ext = path.extname(file.originalname).toLowerCase();
      const uuid = crypto.randomUUID();
      const storageKey = `${sheetId}/${uuid}${ext}`;

      // Stream from temp file to storage
      const readStream = fs.createReadStream(file.tempPath);
      await storageDriver.save(storageKey, readStream, entry.mimeTypes[0]);

      const sanitized = sanitizeFilename(file.originalname);

      const attachment = await Attachment.create({
        sheetId: new mongoose.Types.ObjectId(sheetId),
        rowId: new mongoose.Types.ObjectId(rowId),
        uploadedBy: new mongoose.Types.ObjectId(userId),
        originalName: sanitized,
        storageKey,
        contentType: entry.mimeTypes[0], // canonical type, never browser-supplied
        size: file.size,
      });

      // Record activity (fire-and-forget)
      try {
        recordActivity({
          sheetId,
          rowId,
          actorId: userId,
          action: 'attachment.added',
          details: { fileName: sanitized, attachmentId: attachment._id.toString() },
        });
      } catch (err) {
        console.error('[attachmentService] Failed to record attachment.added activity:', err);
      }

      // Populate and format
      const populated = await Attachment.findById(attachment._id)
        .populate('uploadedBy', 'fullName deletedAt');
      if (populated) {
        created.push(formatAttachment(populated.toObject()));
      }
    } finally {
      // Always clean up the temp file
      try { await fsp.unlink(file.tempPath); } catch { /* ignore ENOENT */ }
    }
  }

  return created;
}

// ─── listAttachments ────────────────────────────────────────────────────────

/**
 * Lists non-deleted attachments for a row, newest first.
 * Requires viewer+ access.
 */
export async function listAttachments(
  sheetId: string,
  rowId: string,
  userId: string,
): Promise<FormattedAttachment[]> {
  await requireSheetAccess(userId, sheetId, 'viewer');

  const attachments = await Attachment.find({
    sheetId: new mongoose.Types.ObjectId(sheetId),
    rowId: new mongoose.Types.ObjectId(rowId),
    deletedAt: null,
  })
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'fullName deletedAt');

  return attachments.map((a) => formatAttachment(a.toObject()));
}

// ─── downloadAttachment ─────────────────────────────────────────────────────

interface DownloadResult {
  stream: NodeJS.ReadableStream;
  contentType: string;
  originalName: string;
}

/**
 * Returns a read stream for downloading an attachment.
 * Requires viewer+ access on the attachment's sheet.
 */
export async function downloadAttachment(
  attachmentId: string,
  userId: string,
): Promise<DownloadResult> {
  if (!mongoose.Types.ObjectId.isValid(attachmentId)) {
    throw new AppError('Invalid attachment ID', 400);
  }

  const attachment = await Attachment.findById(attachmentId);
  if (!attachment || attachment.deletedAt) {
    throw new AppError('Attachment not found', 404);
  }

  // Check viewer+ access on the sheet
  await requireSheetAccess(userId, attachment.sheetId.toString(), 'viewer');

  const stream = await storageDriver.readStream(attachment.storageKey);

  return {
    stream,
    contentType: attachment.contentType,
    originalName: attachment.originalName,
  };
}

// ─── deleteAttachment ───────────────────────────────────────────────────────

/**
 * Soft-deletes an attachment. Allowed if the user is the uploader OR has admin+ on the sheet.
 */
export async function deleteAttachment(
  attachmentId: string,
  userId: string,
): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(attachmentId)) {
    throw new AppError('Invalid attachment ID', 400);
  }

  const attachment = await Attachment.findById(attachmentId);
  if (!attachment || attachment.deletedAt) {
    throw new AppError('Attachment not found', 404);
  }

  const isUploader = attachment.uploadedBy.toString() === userId;

  if (!isUploader) {
    // Check admin+ on the sheet
    try {
      await requireSheetAccess(userId, attachment.sheetId.toString(), 'admin');
    } catch {
      throw new AppError('Not authorized to delete this attachment', 403);
    }
  }

  // Soft-delete in DB
  attachment.deletedAt = new Date();
  await attachment.save();

  // Physical file removal (ignore ENOENT)
  try {
    await storageDriver.delete(attachment.storageKey);
  } catch (err) {
    console.error('[attachmentService] Failed to delete physical file:', err);
  }

  // Record activity (fire-and-forget)
  try {
    recordActivity({
      sheetId: attachment.sheetId.toString(),
      rowId: attachment.rowId.toString(),
      actorId: userId,
      action: 'attachment.deleted',
      details: { fileName: attachment.originalName, attachmentId: attachment._id.toString() },
    });
  } catch (err) {
    console.error('[attachmentService] Failed to record attachment.deleted activity:', err);
  }
}

// ─── getAttachmentCountsByRow ───────────────────────────────────────────────

/**
 * Aggregates attachment counts by rowId for a set of rows within a sheet.
 * Returns a Map of rowId -> count for non-deleted attachments.
 */
export async function getAttachmentCountsByRow(
  sheetId: string,
  rowIds: string[],
): Promise<Map<string, number>> {
  if (rowIds.length === 0) return new Map();

  const objectIds = rowIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (objectIds.length === 0) return new Map();

  const results = await Attachment.aggregate([
    {
      $match: {
        sheetId: new mongoose.Types.ObjectId(sheetId),
        rowId: { $in: objectIds },
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: '$rowId',
        count: { $sum: 1 },
      },
    },
  ]);

  const map = new Map<string, number>();
  for (const entry of results) {
    map.set(entry._id.toString(), entry.count);
  }
  return map;
}

// ─── Bulk deletion helpers ──────────────────────────────────────────────────

/**
 * Soft-deletes all attachments for the given rows and removes physical files.
 * Used during row deletion — fire-and-forget.
 */
export async function deleteAttachmentsForRows(rowIds: string[]): Promise<void> {
  if (rowIds.length === 0) return;

  const objectIds = rowIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (objectIds.length === 0) return;

  // Find all non-deleted attachments for these rows
  const attachments = await Attachment.find({
    rowId: { $in: objectIds },
    deletedAt: null,
  }).select('storageKey');

  // Soft-delete in DB
  await Attachment.updateMany(
    { rowId: { $in: objectIds }, deletedAt: null },
    { deletedAt: new Date() },
  );

  // Remove physical files
  for (const att of attachments) {
    try {
      await storageDriver.delete(att.storageKey);
    } catch (err) {
      console.error('[attachmentService] Failed to delete physical file during row cleanup:', err);
    }
  }
}

/**
 * Soft-deletes all attachments for a sheet and removes physical files.
 * Used during sheet deletion — fire-and-forget.
 */
export async function deleteAttachmentsForSheet(sheetId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(sheetId)) return;

  const sheetObjId = new mongoose.Types.ObjectId(sheetId);

  // Find all non-deleted attachments for this sheet
  const attachments = await Attachment.find({
    sheetId: sheetObjId,
    deletedAt: null,
  }).select('storageKey');

  // Soft-delete in DB
  await Attachment.updateMany(
    { sheetId: sheetObjId, deletedAt: null },
    { deletedAt: new Date() },
  );

  // Remove physical files
  for (const att of attachments) {
    try {
      await storageDriver.delete(att.storageKey);
    } catch (err) {
      console.error('[attachmentService] Failed to delete physical file during sheet cleanup:', err);
    }
  }
}
