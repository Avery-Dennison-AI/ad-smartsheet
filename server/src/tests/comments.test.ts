import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import ActivityLog from '../models/ActivityLog';
import Comment from '../models/Comment';
import { createUser, createWorkspace, createSheet, createRow, createProject } from './helpers/factories';
import * as commentService from '../services/commentService';
import * as rowService from '../services/rowService';
import * as sheetService from '../services/sheetService';
import * as projectService from '../services/projectService';
import * as gridService from '../services/gridService';
import * as projectSettingsService from '../services/projectSettingsService';
import type { ColumnDef } from '../models/Sheet';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Comments', () => {
  // 1. Create and list
  it('editor creates a comment on a row and listComments returns it with author name', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });

    const comment = await commentService.createComment(
      sheet._id.toString(),
      row._id.toString(),
      user._id.toString(),
      { body: 'Hello world' },
    );

    expect(comment.body).toBe('Hello world');
    expect(comment.authorName).toBe(user.fullName);
    expect(comment.parentId).toBeNull();
    expect(comment.deleted).toBe(false);

    const comments = await commentService.listComments(
      sheet._id.toString(),
      row._id.toString(),
      user._id.toString(),
    );
    expect(comments.length).toBe(1);
    expect(comments[0].body).toBe('Hello world');
    expect(comments[0].authorName).toBe(user.fullName);
  });

  // 2. Reply
  it('editor creates a reply to a top-level comment; listed under parent; reply-to-reply rejected', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });

    const parent = await commentService.createComment(
      sheet._id.toString(),
      row._id.toString(),
      user._id.toString(),
      { body: 'Parent comment' },
    );

    // Valid reply
    const reply = await commentService.createComment(
      sheet._id.toString(),
      row._id.toString(),
      user._id.toString(),
      { body: 'Reply to parent', parentId: parent.id },
    );
    expect(reply.parentId).toBe(parent.id);

    const comments = await commentService.listComments(
      sheet._id.toString(),
      row._id.toString(),
      user._id.toString(),
    );
    expect(comments.length).toBe(1);
    expect(comments[0].replies!.length).toBe(1);
    expect(comments[0].replies![0].body).toBe('Reply to parent');

    // Reply to reply should be rejected
    await expect(
      commentService.createComment(
        sheet._id.toString(),
        row._id.toString(),
        user._id.toString(),
        { body: 'Nested reply', parentId: reply.id },
      ),
    ).rejects.toThrow(/one level/i);
  });

  // 3. Edit (author)
  it('author can edit body; editedAt is set; another user gets 403', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });

    const comment = await commentService.createComment(
      sheet._id.toString(),
      row._id.toString(),
      user._id.toString(),
      { body: 'Original' },
    );

    // Author edits
    const edited = await commentService.editComment(comment.id, user._id.toString(), {
      body: 'Edited body',
    });
    expect(edited.body).toBe('Edited body');
    expect(edited.editedAt).toBeTruthy();

    // Another user tries to edit — should get 403
    const otherUser = await createUser();
    // Give them workspace access so they pass the permission check
    const Workspace = (await import('../models/Workspace')).default;
    await Workspace.findByIdAndUpdate(
      sheet.workspaceId,
      { $push: { members: { user: otherUser._id, role: 'editor' } } },
    );

    await expect(
      commentService.editComment(comment.id, otherUser._id.toString(), {
        body: 'Hacked',
      }),
    ).rejects.toThrow(/author/i);
  });

  // 4. Delete (author)
  it('author soft-deletes; comment no longer appears in list', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });

    const comment = await commentService.createComment(
      sheet._id.toString(),
      row._id.toString(),
      user._id.toString(),
      { body: 'To be deleted' },
    );

    await commentService.deleteComment(comment.id, user._id.toString(), sheet._id.toString());

    const comments = await commentService.listComments(
      sheet._id.toString(),
      row._id.toString(),
      user._id.toString(),
    );
    // Childless deleted comments are omitted
    expect(comments.length).toBe(0);
  });

  // 5. Delete (admin)
  it('sheet admin can delete another user\'s comment', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });

    // Another user creates a comment
    const otherUser = await createUser();
    const Workspace = (await import('../models/Workspace')).default;
    await Workspace.findByIdAndUpdate(
      sheet.workspaceId,
      { $push: { members: { user: otherUser._id, role: 'editor' } } },
    );

    const comment = await commentService.createComment(
      sheet._id.toString(),
      row._id.toString(),
      otherUser._id.toString(),
      { body: 'Other user comment' },
    );

    // Admin (user) deletes it
    await commentService.deleteComment(comment.id, user._id.toString(), sheet._id.toString());

    const comments = await commentService.listComments(
      sheet._id.toString(),
      row._id.toString(),
      user._id.toString(),
    );
    expect(comments.length).toBe(0);
  });

  // 6. Soft-delete with replies
  it('deleting a parent with replies keeps replies visible; deleted parent shows deleted:true', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });

    const parent = await commentService.createComment(
      sheet._id.toString(),
      row._id.toString(),
      user._id.toString(),
      { body: 'Parent' },
    );

    await commentService.createComment(
      sheet._id.toString(),
      row._id.toString(),
      user._id.toString(),
      { body: 'Child reply', parentId: parent.id },
    );

    // Delete the parent
    await commentService.deleteComment(parent.id, user._id.toString(), sheet._id.toString());

    const comments = await commentService.listComments(
      sheet._id.toString(),
      row._id.toString(),
      user._id.toString(),
    );
    expect(comments.length).toBe(1);
    expect(comments[0].deleted).toBe(true);
    expect(comments[0].body).toBe('');
    expect(comments[0].replies!.length).toBe(1);
    expect(comments[0].replies![0].body).toBe('Child reply');
  });

  // 7. Viewer cannot create
  it('viewer gets 403 on createComment', async () => {
    const { sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });
    const viewer = await createUser();

    const Workspace = (await import('../models/Workspace')).default;
    await Workspace.findByIdAndUpdate(
      sheet.workspaceId,
      { $push: { members: { user: viewer._id, role: 'viewer' } } },
    );

    await expect(
      commentService.createComment(
        sheet._id.toString(),
        row._id.toString(),
        viewer._id.toString(),
        { body: 'Should fail' },
      ),
    ).rejects.toThrow();
  });

  // 8. Viewer can list
  it('viewer gets 200 on listComments', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });
    const viewer = await createUser();

    const Workspace = (await import('../models/Workspace')).default;
    await Workspace.findByIdAndUpdate(
      sheet.workspaceId,
      { $push: { members: { user: viewer._id, role: 'viewer' } } },
    );

    // Create a comment as editor
    await commentService.createComment(
      sheet._id.toString(),
      row._id.toString(),
      user._id.toString(),
      { body: 'Visible to viewer' },
    );

    // Viewer lists
    const comments = await commentService.listComments(
      sheet._id.toString(),
      row._id.toString(),
      viewer._id.toString(),
    );
    expect(comments.length).toBe(1);
    expect(comments[0].body).toBe('Visible to viewer');
  });

  // 9. Mentions filtering
  it('mention of non-member is stripped; mention of member is kept', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });

    // Member who has access
    const member = await createUser();
    const Workspace = (await import('../models/Workspace')).default;
    await Workspace.findByIdAndUpdate(
      sheet.workspaceId,
      { $push: { members: { user: member._id, role: 'editor' } } },
    );

    // Non-member who has no access
    const outsider = await createUser();

    const body = `Hey @[Member](${member._id.toString()}) and @[Outsider](${outsider._id.toString()})`;
    const comment = await commentService.createComment(
      sheet._id.toString(),
      row._id.toString(),
      user._id.toString(),
      { body },
    );

    // Only the member should be in mentions
    expect(comment.mentions.length).toBe(1);
    expect(comment.mentions[0]._id).toBe(member._id.toString());
  });

  // 10. Comment counts in grid
  it('getGrid response includes commentCount on rows', async () => {
    const { user, sheet } = await createTestEnv();
    const row1 = await createRow(sheet._id.toString(), { order: 0 });
    const row2 = await createRow(sheet._id.toString(), { order: 1 });

    // Create 2 comments on row1
    await commentService.createComment(
      sheet._id.toString(),
      row1._id.toString(),
      user._id.toString(),
      { body: 'Comment 1' },
    );
    await commentService.createComment(
      sheet._id.toString(),
      row1._id.toString(),
      user._id.toString(),
      { body: 'Comment 2' },
    );

    const grid = await gridService.getGrid(sheet._id.toString(), user._id.toString());
    const formattedRow1 = grid.rows.find((r: any) => r.id === row1._id.toString());
    const formattedRow2 = grid.rows.find((r: any) => r.id === row2._id.toString());

    expect(formattedRow1?.commentCount).toBe(2);
    expect(formattedRow2?.commentCount).toBe(0);
  });

  // 11. Row deletion cleans comments
  it('after deleteRows, listComments for that row returns empty', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });

    await commentService.createComment(
      sheet._id.toString(),
      row._id.toString(),
      user._id.toString(),
      { body: 'Will be cleaned' },
    );

    // Delete the row
    await rowService.deleteRows(
      sheet._id.toString(),
      user._id.toString(),
      [row._id.toString()],
    );

    // Wait for fire-and-forget comment cleanup
    await waitForActivity();

    // Comments should now be soft-deleted
    const dbComments = await Comment.find({
      rowId: new mongoose.Types.ObjectId(row._id.toString()),
      deletedAt: null,
    });
    expect(dbComments.length).toBe(0);
  });

  // 12. Activity: comment.added
  it('creating a comment writes an ActivityLog entry with action comment.added', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });

    await commentService.createComment(
      sheet._id.toString(),
      row._id.toString(),
      user._id.toString(),
      { body: 'Activity test' },
    );
    await waitForActivity();

    const logs = await ActivityLog.find({ action: 'comment.added' });
    expect(logs.length).toBe(1);
    expect(logs[0].actorId.toString()).toBe(user._id.toString());
    expect(logs[0].sheetId.toString()).toBe(sheet._id.toString());
  });

  // 13. Activity: comment.edited
  it('editing writes comment.edited', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });

    const comment = await commentService.createComment(
      sheet._id.toString(),
      row._id.toString(),
      user._id.toString(),
      { body: 'Before edit' },
    );

    await commentService.editComment(comment.id, user._id.toString(), {
      body: 'After edit',
    });
    await waitForActivity();

    const logs = await ActivityLog.find({ action: 'comment.edited' });
    expect(logs.length).toBe(1);
    expect(logs[0].details).toMatchObject({ commentId: comment.id });
  });

  // 14. Activity: comment.deleted
  it('deleting writes comment.deleted', async () => {
    const { user, sheet } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), { order: 0 });

    const comment = await commentService.createComment(
      sheet._id.toString(),
      row._id.toString(),
      user._id.toString(),
      { body: 'To be deleted' },
    );

    await commentService.deleteComment(comment.id, user._id.toString(), sheet._id.toString());
    await waitForActivity();

    const logs = await ActivityLog.find({ action: 'comment.deleted' });
    expect(logs.length).toBe(1);
    expect(logs[0].details).toMatchObject({ commentId: comment.id });
  });

  // 15. Gap A: project creation records sheet.created
  it('calling createProject writes an ActivityLog sheet.created entry', async () => {
    const user = await createUser({ role: 'admin' });
    const workspace = await createWorkspace({
      owner: user._id,
      members: [{ user: user._id, role: 'admin' }],
    });

    await projectService.createProject(workspace._id.toString(), user._id.toString(), {
      name: 'Test Project',
      keyPrefix: 'TST',
      template: 'waterfall',
    });
    await waitForActivity();

    const logs = await ActivityLog.find({ action: 'sheet.created' });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    const projectLog = logs.find((l) => (l.details as any)?.name === 'Test Project');
    expect(projectLog).toBeTruthy();
    expect(projectLog!.actorId.toString()).toBe(user._id.toString());
  });

  // 16. Gap B: duplication records sheet.duplicated
  it('calling duplicateSheet writes sheet.duplicated on the new sheet', async () => {
    const { user, sheet } = await createTestEnv();

    await sheetService.duplicateSheet(sheet._id.toString(), user._id.toString());
    await waitForActivity();

    const logs = await ActivityLog.find({ action: 'sheet.duplicated' });
    expect(logs.length).toBe(1);
    expect(logs[0].details).toMatchObject({
      originalSheetId: sheet._id.toString(),
      originalName: sheet.name,
    });
    expect((logs[0].details as any).newName).toContain('Copy of');
  });

  // 17. Gap C: updateStatuses records project.statuses_changed; updateItemTypes records project.item_types_changed
  it('updateStatuses records project.statuses_changed with summary details', async () => {
    const admin = await createUser({ role: 'admin' });
    const workspace = await createWorkspace({
      owner: admin._id,
      members: [{ user: admin._id, role: 'admin' }],
    });
    const project = await createProject({
      workspaceId: workspace._id,
      createdBy: admin._id,
      members: [{ userId: admin._id, role: 'admin' }],
    });

    const oldStatuses = project.project!.statuses;

    // Rename first, keep second, remove third, add new
    const updatedStatuses = [
      { id: oldStatuses[0].id, name: 'Renamed Status', color: oldStatuses[0].color, category: oldStatuses[0].category },
      { ...oldStatuses[1] },
      { name: 'Brand New', color: 'purple', category: 'done' as const },
    ];

    // Provide replacement for removed status
    const removedId = oldStatuses[2].id;
    const replacements: Record<string, string> = {};
    if (updatedStatuses.length < oldStatuses.length) {
      replacements[removedId] = oldStatuses[1].id;
    }

    await projectSettingsService.updateStatuses(
      project._id.toString(),
      admin._id.toString(),
      { statuses: updatedStatuses, replacements },
    );
    await waitForActivity();

    const logs = await ActivityLog.find({ action: 'project.statuses_changed' });
    expect(logs.length).toBe(1);
    const details = logs[0].details as any;
    expect(details.added).toContain('Brand New');
    expect(details.renamed.some((r: any) => r.to === 'Renamed Status')).toBe(true);
    expect(details.removed.length).toBeGreaterThanOrEqual(1);
  });

  it('updateItemTypes records project.item_types_changed with summary details', async () => {
    const admin = await createUser({ role: 'admin' });
    const workspace = await createWorkspace({
      owner: admin._id,
      members: [{ user: admin._id, role: 'admin' }],
    });
    const project = await createProject({
      workspaceId: workspace._id,
      createdBy: admin._id,
      members: [{ userId: admin._id, role: 'admin' }],
    });

    const oldTypes = project.project!.itemTypes;

    // Rename first, add new
    const updatedTypes = [
      { id: oldTypes[0].id, name: 'Renamed Type' },
      { name: 'New Type' },
    ];

    // Provide replacement for any removed types
    const replacements: Record<string, string> = {};
    for (const t of oldTypes) {
      if (!updatedTypes.some((ut) => ut.id === t.id)) {
        replacements[t.id] = oldTypes[0].id;
      }
    }

    await projectSettingsService.updateItemTypes(
      project._id.toString(),
      admin._id.toString(),
      { itemTypes: updatedTypes, replacements },
    );
    await waitForActivity();

    const logs = await ActivityLog.find({ action: 'project.item_types_changed' });
    expect(logs.length).toBe(1);
    const details = logs[0].details as any;
    expect(details.added).toContain('New Type');
    expect(details.renamed.some((r: any) => r.to === 'Renamed Type')).toBe(true);
  });
});
