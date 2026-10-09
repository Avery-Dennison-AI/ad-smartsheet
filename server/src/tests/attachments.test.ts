import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import ActivityLog from '../models/ActivityLog';
import Attachment from '../models/Attachment';
import { createUser, createWorkspace, createSheet, createRow } from './helpers/factories';
import * as attachmentService from '../services/attachmentService';
import * as rowService from '../services/rowService';
import * as gridService from '../services/gridService';
import type { ColumnDef } from '../models/Sheet';

// ─── Temporary storage directory for tests ──────────────────────────────────

let tmpDir: string;

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'attach-test-'));
  // Override UPLOADS_DIR via env so LocalDiskDriver uses our temp dir
  process.env.UPLOAD_DIR = tmpDir;
});

afterAll(async () => {
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }
});

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Wait for fire-and-forget activity recording to complete. */
async function waitForActivity(ms = 200): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Create a standard test environment with user (editor), workspace, and sheet. */
async function createTestEnv() {
  const user = await createUser();
  const workspace = await createWorkspace({
    owner: user._id,
    members: [{ user: user._id, role: 'admin' }],
  });
  const textColId = new mongoose.Types.ObjectId().toString();
  const primaryCol: ColumnDef = {
    id: textColId,
    name: 'Name',
    type: 'text',
    order: 0,
    isPrimary: true,
  };
  const sheet = await createSheet({
    workspaceId: workspace._id,
    createdBy: user._id,
    columns: [primaryCol],
  });
  return { user, workspace, sheet, primaryColId: textColId };
}

/**
 * Helper to create a fake file input buffer.
 * Uses real-ish byte signatures so signature verification passes.
 */
function makeFile(name: string, content: string | Buffer, mimetype: string) {
  const buf = typeof content === 'string' ? Buffer.from(content) : content;
  return {
    buffer: buf,
    originalname: name,
    mimetype,
    size: buf.length,
  };
}

// Real-ish file byte signatures for tests that go through verifySignature
const PDF_HEADER = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n');
const TEXT_CONTENT = Buffer.from('Hello, this is plain text.\n');

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Attachments', () => {
  // 1. Upload succeeds, file appears in list with uploader name, attachmentCount increases in grid
  it('upload succeeds, file appears in list with uploader name, attachmentCount increases in grid', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });
    const sheetId = sheet._id.toString();
    const rowId = row._id.toString();
    const userId = user._id.toString();

    const file = makeFile('report.pdf', PDF_HEADER, 'application/pdf');
    const attachments = await attachmentService.uploadAttachments(sheetId, rowId, userId, [file]);

    expect(attachments).toHaveLength(1);
    expect(attachments[0].originalName).toBe('report.pdf');
    expect(attachments[0].uploaderName).toBe(user.fullName);
    expect(attachments[0].contentType).toBe('application/pdf');

    // List returns the attachment
    const listed = await attachmentService.listAttachments(sheetId, rowId, userId);
    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe(attachments[0].id);

    // Grid shows attachmentCount
    const grid = await gridService.getGrid(sheetId, userId);
    const gridRow = grid.rows.find((r: any) => r.id === rowId);
    expect(gridRow?.attachmentCount).toBe(1);
  });

  // 2. Download by a non-member returns 403/404
  it('download by a non-member returns error', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });
    const sheetId = sheet._id.toString();
    const rowId = row._id.toString();
    const userId = user._id.toString();

    const file = makeFile('doc.txt', TEXT_CONTENT, 'text/plain');
    const [att] = await attachmentService.uploadAttachments(sheetId, rowId, userId, [file]);

    // Create another user who is not a member
    const outsider = await createUser();

    await expect(
      attachmentService.downloadAttachment(att.id, outsider._id.toString()),
    ).rejects.toThrow();
  });

  // 3. Blocked file type (.exe) is rejected — not in allowlist
  it('blocked file type .exe is rejected', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });

    const file = makeFile('malware.exe', 'MZ...', 'application/x-msdownload');

    await expect(
      attachmentService.uploadAttachments(
        sheet._id.toString(),
        row._id.toString(),
        user._id.toString(),
        [file],
      ),
    ).rejects.toThrow(/not allowed/i);
  });

  // 3b. Blocked MIME type text/javascript is rejected — .js not in allowlist
  it('blocked MIME type text/javascript is rejected', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });

    const file = makeFile('script.js', 'console.log("xss")', 'text/javascript');

    await expect(
      attachmentService.uploadAttachments(
        sheet._id.toString(),
        row._id.toString(),
        user._id.toString(),
        [file],
      ),
    ).rejects.toThrow(/not allowed/i);
  });

  // 4. Oversize file (> MAX_FILE_SIZE_MB) is rejected
  it('oversize file is rejected', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });

    // Create a file that exceeds the default 25 MB limit
    const bigContent = Buffer.alloc(26 * 1024 * 1024, 'x'); // 26 MB
    const file = {
      buffer: bigContent,
      originalname: 'huge.pdf',
      mimetype: 'application/pdf',
      size: bigContent.length,
    };

    await expect(
      attachmentService.uploadAttachments(
        sheet._id.toString(),
        row._id.toString(),
        user._id.toString(),
        [file],
      ),
    ).rejects.toThrow(/exceeds|limit/i);
  });

  // 5. Viewer can upload (403), viewer can list and download
  it('viewer cannot upload but can list and download', async () => {
    const admin = await createUser();
    const viewer = await createUser();
    const workspace = await createWorkspace({
      owner: admin._id,
      members: [
        { user: admin._id, role: 'admin' },
        { user: viewer._id, role: 'viewer' },
      ],
    });
    const sheet = await createSheet({
      workspaceId: workspace._id,
      createdBy: admin._id,
    });
    const row = await createRow(sheet._id.toString(), { order: 0 });
    const sheetId = sheet._id.toString();
    const rowId = row._id.toString();

    // Admin uploads
    const file = makeFile('shared.pdf', PDF_HEADER, 'application/pdf');
    const [att] = await attachmentService.uploadAttachments(sheetId, rowId, admin._id.toString(), [file]);

    // Viewer cannot upload
    const viewerFile = makeFile('nope.pdf', PDF_HEADER, 'application/pdf');
    await expect(
      attachmentService.uploadAttachments(sheetId, rowId, viewer._id.toString(), [viewerFile]),
    ).rejects.toThrow(/denied|access/i);

    // Viewer can list
    const listed = await attachmentService.listAttachments(sheetId, rowId, viewer._id.toString());
    expect(listed).toHaveLength(1);

    // Viewer can download
    const result = await attachmentService.downloadAttachment(att.id, viewer._id.toString());
    expect(result.originalName).toBe('shared.pdf');
  });

  // 6. Delete by uploader succeeds; delete by admin succeeds; delete by non-owner non-admin denied
  it('delete permissions: uploader OK, admin OK, non-owner non-admin denied', async () => {
    const admin = await createUser();
    const uploader = await createUser();
    const other = await createUser();
    const workspace = await createWorkspace({
      owner: admin._id,
      members: [
        { user: admin._id, role: 'admin' },
        { user: uploader._id, role: 'editor' },
        { user: other._id, role: 'editor' },
      ],
    });
    const sheet = await createSheet({
      workspaceId: workspace._id,
      createdBy: admin._id,
    });
    const row = await createRow(sheet._id.toString(), { order: 0 });
    const sheetId = sheet._id.toString();
    const rowId = row._id.toString();

    // Uploader creates two attachments
    const f1 = makeFile('a.txt', TEXT_CONTENT, 'text/plain');
    const f2 = makeFile('b.txt', TEXT_CONTENT, 'text/plain');
    const [att1, att2] = await attachmentService.uploadAttachments(sheetId, rowId, uploader._id.toString(), [f1, f2]);

    // Non-owner non-admin cannot delete
    await expect(
      attachmentService.deleteAttachment(att1.id, other._id.toString()),
    ).rejects.toThrow(/authorized|denied/i);

    // Uploader can delete
    await attachmentService.deleteAttachment(att1.id, uploader._id.toString());
    const listed = await attachmentService.listAttachments(sheetId, rowId, uploader._id.toString());
    expect(listed).toHaveLength(1);

    // Admin can delete the remaining one
    await attachmentService.deleteAttachment(att2.id, admin._id.toString());
    const listed2 = await attachmentService.listAttachments(sheetId, rowId, uploader._id.toString());
    expect(listed2).toHaveLength(0);
  });

  // 7. attachment.added activity log entry is created after upload
  it('attachment.added activity log entry is created after upload', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });
    const sheetId = sheet._id.toString();
    const rowId = row._id.toString();
    const userId = user._id.toString();

    const file = makeFile('log-test.txt', TEXT_CONTENT, 'text/plain');
    await attachmentService.uploadAttachments(sheetId, rowId, userId, [file]);

    await waitForActivity();

    const activities = await ActivityLog.find({
      sheetId: new mongoose.Types.ObjectId(sheetId),
      rowId: new mongoose.Types.ObjectId(rowId),
      action: 'attachment.added',
    });
    expect(activities).toHaveLength(1);
    expect(activities[0].details).toBeDefined();
    expect((activities[0].details as any).fileName).toBe('log-test.txt');
  });

  // 8. attachment.deleted activity log entry is created after delete
  it('attachment.deleted activity log entry is created after delete', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });
    const sheetId = sheet._id.toString();
    const rowId = row._id.toString();
    const userId = user._id.toString();

    const file = makeFile('del-test.txt', TEXT_CONTENT, 'text/plain');
    const [att] = await attachmentService.uploadAttachments(sheetId, rowId, userId, [file]);

    await attachmentService.deleteAttachment(att.id, userId);
    await waitForActivity();

    const activities = await ActivityLog.find({
      sheetId: new mongoose.Types.ObjectId(sheetId),
      rowId: new mongoose.Types.ObjectId(rowId),
      action: 'attachment.deleted',
    });
    expect(activities).toHaveLength(1);
    expect((activities[0].details as any).fileName).toBe('del-test.txt');
  });

  // 9. Deleting a row soft-deletes its attachments
  it('deleting a row soft-deletes its attachments', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });
    const sheetId = sheet._id.toString();
    const rowId = row._id.toString();
    const userId = user._id.toString();

    const file = makeFile('row-del.txt', TEXT_CONTENT, 'text/plain');
    await attachmentService.uploadAttachments(sheetId, rowId, userId, [file]);

    // Verify attachment exists
    let listed = await attachmentService.listAttachments(sheetId, rowId, userId);
    expect(listed).toHaveLength(1);

    // Delete the row
    await rowService.deleteRows(sheetId, userId, [rowId]);

    // Attachments should now be empty (soft-deleted)
    listed = await attachmentService.listAttachments(sheetId, rowId, userId);
    expect(listed).toHaveLength(0);

    // DB still has the record but with deletedAt set
    const dbAtt = await Attachment.find({ rowId: new mongoose.Types.ObjectId(rowId) });
    expect(dbAtt).toHaveLength(1);
    expect(dbAtt[0].deletedAt).not.toBeNull();
  });

  // 10. attachmentCount in grid response reflects only non-deleted attachments
  it('attachmentCount in grid reflects only non-deleted attachments', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });
    const sheetId = sheet._id.toString();
    const rowId = row._id.toString();
    const userId = user._id.toString();

    const f1 = makeFile('count1.txt', TEXT_CONTENT, 'text/plain');
    const f2 = makeFile('count2.txt', TEXT_CONTENT, 'text/plain');
    const [att1] = await attachmentService.uploadAttachments(sheetId, rowId, userId, [f1, f2]);

    // Count should be 2
    let grid = await gridService.getGrid(sheetId, userId);
    let gridRow = grid.rows.find((r: any) => r.id === rowId);
    expect(gridRow?.attachmentCount).toBe(2);

    // Delete one
    await attachmentService.deleteAttachment(att1.id, userId);

    // Count should be 1
    grid = await gridService.getGrid(sheetId, userId);
    gridRow = grid.rows.find((r: any) => r.id === rowId);
    expect(gridRow?.attachmentCount).toBe(1);
  });

  // ─── New hardened pipeline tests ──────────────────────────────────────────

  // 11. Stored contentType equals canonical detected type, not browser-supplied mime
  it('stored contentType equals canonical detected type, not browser-supplied mime', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });
    const sheetId = sheet._id.toString();
    const rowId = row._id.toString();
    const userId = user._id.toString();

    // Upload a valid PDF but with wrong browser MIME
    const file = makeFile('report.pdf', PDF_HEADER, 'application/octet-stream');
    const [att] = await attachmentService.uploadAttachments(sheetId, rowId, userId, [file]);

    // The stored contentType should be the canonical application/pdf, not the browser-supplied octet-stream
    expect(att.contentType).toBe('application/pdf');

    // Verify in DB directly
    const dbAtt = await Attachment.findById(att.id);
    expect(dbAtt!.contentType).toBe('application/pdf');
  });

  // 12. Temp files are cleaned up after successful upload (buffer path)
  it('temp files are cleaned up after successful upload', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });
    const sheetId = sheet._id.toString();
    const rowId = row._id.toString();
    const userId = user._id.toString();

    const stagingDir = path.join(os.tmpdir(), 'upload-staging');

    // List files before upload
    const beforeFiles = await fs.readdir(stagingDir).catch(() => []);

    const file = makeFile('cleanup-test.txt', TEXT_CONTENT, 'text/plain');
    await attachmentService.uploadAttachments(sheetId, rowId, userId, [file]);

    // Give a moment for async cleanup
    await new Promise((resolve) => setTimeout(resolve, 100));

    // List files after upload — should be same count (temp files removed)
    const afterFiles = await fs.readdir(stagingDir).catch(() => []);
    expect(afterFiles.length).toBe(beforeFiles.length);
  });

  // 13. Temp files are cleaned up after rejected upload (wrong content type)
  it('temp files are cleaned up after rejected upload', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });
    const sheetId = sheet._id.toString();
    const rowId = row._id.toString();
    const userId = user._id.toString();

    const stagingDir = path.join(os.tmpdir(), 'upload-staging');
    const beforeFiles = await fs.readdir(stagingDir).catch(() => []);

    // Try uploading a .exe file (rejected by allowlist)
    const file = makeFile('malware.exe', Buffer.from('MZ...'), 'application/x-msdownload');
    await expect(
      attachmentService.uploadAttachments(sheetId, rowId, userId, [file]),
    ).rejects.toThrow(/not allowed/i);

    // Give a moment for async cleanup
    await new Promise((resolve) => setTimeout(resolve, 100));

    const afterFiles = await fs.readdir(stagingDir).catch(() => []);
    expect(afterFiles.length).toBe(beforeFiles.length);
  });

  // 14. SVG extension is rejected (not in allowlist)
  it('SVG extension is rejected', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });

    const file = makeFile('icon.svg', '<svg></svg>', 'image/svg+xml');

    await expect(
      attachmentService.uploadAttachments(
        sheet._id.toString(),
        row._id.toString(),
        user._id.toString(),
        [file],
      ),
    ).rejects.toThrow(/not allowed/i);
  });
});
