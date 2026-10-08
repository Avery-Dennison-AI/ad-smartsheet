import { useEffect, useState, useCallback, useRef } from 'react';
import { MoreHorizontal, MessageSquare } from 'lucide-react';
import { Avatar, Button, Textarea, DropdownMenu, ConfirmDialog, Spinner, EmptyState, RelativeTime } from '@/components/ui';
import type { DropdownMenuItem } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadComments, addComment, editComment, removeComment, selectCommentsForRow } from '@/store/slices/commentsSlice';
import { selectGridMembers } from '@/store/slices/gridSlice';
import { cn } from '@/utils/cn';
import type { WorkspaceRole, FormattedComment } from '@/types';

interface CommentsTabProps {
  sheetId: string;
  rowId: string;
  userRole: WorkspaceRole;
}

/** Parse @[Name](userId) mentions and render as highlighted marks. */
function renderBodyWithMentions(body: string): React.ReactNode {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mentionRegex.exec(body)) !== null) {
    if (match.index > lastIndex) {
      parts.push(body.slice(lastIndex, match.index));
    }
    parts.push(
      <mark
        key={`mention-${match.index}`}
        className="bg-primary/10 text-primary rounded px-0.5"
        data-icod-id="src_features_itemdetail_commentstab_tsx_83d4">
        @{match[1]}
      </mark>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < body.length) {
    parts.push(body.slice(lastIndex));
  }

  return parts.length > 0 ? parts : body;
}

interface CommentItemProps {
  comment: FormattedComment;
  rowId: string;
  sheetId: string;
  userRole: WorkspaceRole;
  currentUserId?: string;
  depth?: number;
  onReply: (parentId: string) => void;
}

function CommentItem({
  comment,
  rowId,
  sheetId,
  userRole,
  currentUserId,
  depth = 0,
  onReply,
}: CommentItemProps) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isAuthor = currentUserId === comment.authorId;
  const canDelete = isAuthor || userRole === 'admin' || userRole === 'owner';
  const canEdit = isAuthor;
  const isDeleted = !!comment.deletedAt;

  const handleSaveEdit = () => {
    if (editBody.trim() && editBody !== comment.body) {
      dispatch(editComment({ commentId: comment._id, body: editBody.trim(), rowId }));
    }
    setEditing(false);
  };

  const handleDelete = () => {
    dispatch(removeComment({ commentId: comment._id, rowId }));
    setDeleteOpen(false);
  };

  const menuItems: DropdownMenuItem[] = [];
  menuItems.push({ label: 'Reply', onClick: () => onReply(comment._id) });
  if (canEdit && !isDeleted) {
    menuItems.push({ label: 'Edit', onClick: () => { setEditBody(comment.body); setEditing(true); } });
  }
  if (canDelete && !isDeleted) {
    menuItems.push({ label: 'Delete', danger: true, onClick: () => setDeleteOpen(true) });
  }

  if (isDeleted) {
    return (
      <div className={cn('py-2 italic text-muted-foreground', depth > 0 && 'ml-6 border-l-2 border-border pl-3')} data-icod-id={`src_features_itemdetail_commentstab_tsx_deleted_${comment._id}`}>
        This comment was deleted
      </div>
    );
  }

  return (
    <div className={cn('group py-3', depth > 0 && 'ml-6 border-l-2 border-border pl-3')} data-icod-id={`src_features_itemdetail_commentstab_tsx_item_${comment._id}`}>
      <div className="flex gap-2" data-icod-id={`src_features_itemdetail_commentstab_tsx_row_${comment._id}`}>
        <Avatar name={comment.authorName} size="sm" data-icod-id={`src_features_itemdetail_commentstab_tsx_avatar_${comment._id}`} />
        <div className="min-w-0 flex-1" data-icod-id={`src_features_itemdetail_commentstab_tsx_content_${comment._id}`}>
          <div className="flex items-center gap-2" data-icod-id={`src_features_itemdetail_commentstab_tsx_header_${comment._id}`}>
            <span className="text-sm font-medium text-foreground" data-icod-id={`src_features_itemdetail_commentstab_tsx_author_${comment._id}`}>{comment.authorName}</span>
            <RelativeTime date={comment.createdAt} data-icod-id={`src_features_itemdetail_commentstab_tsx_time_${comment._id}`} />
            {comment.editedAt && (
              <span className="text-xs text-muted-foreground" data-icod-id={`src_features_itemdetail_commentstab_tsx_edited_${comment._id}`}>(edited)</span>
            )}
            {menuItems.length > 0 && (
              <DropdownMenu
                trigger={<Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto opacity-0 group-hover:opacity-100"
                  data-icod-id="src_features_itemdetail_commentstab_tsx_a3c8"><MoreHorizontal
                  className="h-4 w-4"
                  data-icod-id="src_features_itemdetail_commentstab_tsx_a7e7" /></Button>}
                items={menuItems}
                skipRestoreFocus
                data-icod-id="src_features_itemdetail_commentstab_tsx_76d5" />
            )}
          </div>
          {editing ? (
            <div className="mt-2 flex flex-col gap-2" data-icod-id={`src_features_itemdetail_commentstab_tsx_edit_${comment._id}`}>
              <Textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={2}
                data-icod-id={`src_features_itemdetail_commentstab_tsx_editarea_${comment._id}`} />
              <div className="flex gap-2" data-icod-id={`src_features_itemdetail_commentstab_tsx_editbtns_${comment._id}`}>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  data-icod-id="src_features_itemdetail_commentstab_tsx_f940">Save</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                  data-icod-id="src_features_itemdetail_commentstab_tsx_69dc">Cancel</Button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm text-foreground whitespace-pre-wrap" data-icod-id={`src_features_itemdetail_commentstab_tsx_body_${comment._id}`}>
              {renderBodyWithMentions(comment.body)}
            </p>
          )}
        </div>
      </div>
      {/* Replies */}
      {(comment.replies ?? []).map((reply) => (
        <CommentItem
          key={reply._id}
          comment={reply}
          rowId={rowId}
          sheetId={sheetId}
          userRole={userRole}
          currentUserId={currentUserId}
          depth={depth + 1}
          onReply={onReply}
          data-icod-id={`src_features_itemdetail_commentstab_tsx_2208_${reply._id}`} />
      ))}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete comment"
        description="Are you sure you want to delete this comment?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        data-icod-id="src_features_itemdetail_commentstab_tsx_c14c" />
    </div>
  );
}

export default function CommentsTab({ sheetId, rowId, userRole }: CommentsTabProps) {
  const dispatch = useAppDispatch();
  const { comments, loading, error } = useAppSelector((state) => selectCommentsForRow(state, rowId));
  const members = useAppSelector(selectGridMembers);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load comments on mount
  useEffect(() => {
    dispatch(loadComments({ sheetId, rowId }));
  }, [dispatch, sheetId, rowId]);

  const handleSubmit = useCallback(() => {
    if (!body.trim()) return;
    dispatch(addComment({ sheetId, rowId, body: body.trim(), parentId: replyTo ?? undefined }));
    setBody('');
    setReplyTo(null);
  }, [dispatch, sheetId, rowId, body, replyTo]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleReply = (parentId: string) => {
    setReplyTo(parentId);
    textareaRef.current?.focus();
  };

  const canComment = userRole !== 'viewer';

  if (loading) {
    return (
      <div className="flex justify-center py-8" data-icod-id="src_features_itemdetail_commentstab_tsx_loading">
        <Spinner size="md" data-icod-id="src_features_itemdetail_commentstab_tsx_014a" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-sm text-destructive" data-icod-id="src_features_itemdetail_commentstab_tsx_error">{error}</div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-icod-id="src_features_itemdetail_commentstab_tsx_container">
      {/* Comment list */}
      {(comments ?? []).length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No comments yet"
          description="Be the first to comment on this item"
          data-icod-id="src_features_itemdetail_commentstab_tsx_899d" />
      ) : (
        <div className="flex flex-col" data-icod-id="src_features_itemdetail_commentstab_tsx_list">
          {(comments ?? []).map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              rowId={rowId}
              sheetId={sheetId}
              userRole={userRole}
              onReply={handleReply}
              data-icod-id={`src_features_itemdetail_commentstab_tsx_0cee_${comment._id}`} />
          ))}
        </div>
      )}
      {/* Composer */}
      {canComment && (
        <div className="border-t border-border pt-4" data-icod-id="src_features_itemdetail_commentstab_tsx_composer">
          {replyTo && (
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground" data-icod-id="src_features_itemdetail_commentstab_tsx_replyto">
              Replying to comment
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(null)}
                className="h-5 px-1 text-xs"
                data-icod-id="src_features_itemdetail_commentstab_tsx_15bc">×</Button>
            </div>
          )}
          <Textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment... (Ctrl+Enter to submit)"
            rows={2}
            className="min-h-[80px]"
            data-icod-id="src_features_itemdetail_commentstab_tsx_textarea" />
          <div className="mt-2 flex justify-end" data-icod-id="src_features_itemdetail_commentstab_tsx_submit_wrap">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!body.trim()}
              data-icod-id="src_features_itemdetail_commentstab_tsx_submit">
              Comment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
