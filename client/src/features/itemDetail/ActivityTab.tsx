import { useEffect, useState, useCallback, useMemo } from 'react';
import { History } from 'lucide-react';
import { Button, Spinner, EmptyState, RelativeTime, Avatar, Pill } from '@/components/ui';
import { fetchRowActivity } from '@/services/commentService';
import type { ActivityEntry } from '@/types';
import { formatActivity, type FormattedActivity, type ActivityPart } from '../activity/formatActivity';

interface ActivityTabProps {
  sheetId: string;
  rowId: string;
  onTabChange?: (tab: string) => void;
}

// ─── Grouping Logic ────────────────────────────────────────────────────────

interface ActivityGroup {
  actorName: string;
  entries: Array<{ entry: ActivityEntry; formatted: FormattedActivity }>;
  firstCreatedAt: string;
}

/** Group consecutive entries by the same actor within 5 minutes. */
function groupEntries(entries: ActivityEntry[]): ActivityGroup[] {
  const groups: ActivityGroup[] = [];
  const FIVE_MINUTES_MS = 5 * 60 * 1000;

  for (const entry of entries) {
    const formatted = formatActivity(entry);
    const lastGroup = groups[groups.length - 1];

    if (
      lastGroup &&
      lastGroup.actorName === entry.actorName &&
      new Date(lastGroup.firstCreatedAt).getTime() - new Date(entry.createdAt).getTime() < FIVE_MINUTES_MS
    ) {
      // Add to existing group (entries are newest-first, so we prepend)
      lastGroup.entries.unshift({ entry, formatted });
    } else {
      // Start new group
      groups.push({
        actorName: entry.actorName,
        entries: [{ entry, formatted }],
        firstCreatedAt: entry.createdAt,
      });
    }
  }

  return groups;
}

// ─── Rich Text Rendering ────────────────────────────────────────────────────

function renderRichParts(parts: ActivityPart[], onCommentClick?: () => void, onAttachmentClick?: () => void): React.ReactNode {
  return parts.map((part, idx) => {
    switch (part.type) {
      case 'bold':
        return (
          <strong
            key={idx}
            className="font-semibold text-foreground"
            data-icod-id={`src_features_itemdetail_activitytab_tsx_e466_${idx}`}>
            {part.content}
          </strong>
        );
      case 'pill':
        return (
          <Pill
            key={idx}
            label={part.content}
            color={part.color || 'gray'}
            className="mx-0.5 inline-flex"
            data-icod-id={`src_features_itemdetail_activitytab_tsx_e70f_${idx}`} />
        );
      case 'muted':
        return (
          <span
            key={idx}
            className="text-muted-foreground italic"
            data-icod-id={`src_features_itemdetail_activitytab_tsx_3ea8_${idx}`}>
            {part.content}
          </span>
        );
      case 'text':
      default:
        // For comment entries, make "commented" clickable
        if (onCommentClick && part.content === 'commented') {
          return (
            <button
              key={idx}
              onClick={onCommentClick}
              className="text-foreground underline decoration-muted-foreground/40 hover:decoration-foreground cursor-pointer"
              data-icod-id={`src_features_itemdetail_activitytab_tsx_fa25_${idx}`}>
              {part.content}
            </button>
          );
        }
        // For attachment entries, make "attached" and "removed" clickable
        if (onAttachmentClick && (part.content === 'attached ' || part.content === 'removed ')) {
          return (
            <button
              key={idx}
              onClick={onAttachmentClick}
              className="text-foreground underline decoration-muted-foreground/40 hover:decoration-foreground cursor-pointer"
              data-icod-id={`src_features_itemdetail_activitytab_tsx_attach_${idx}`}>
              {part.content}
            </button>
          );
        }
        return (
          <span
            key={idx}
            data-icod-id={`src_features_itemdetail_activitytab_tsx_2614_${idx}`}>{part.content}</span>
        );
    }
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ActivityTab({ sheetId, rowId, onTabChange }: ActivityTabProps) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const loadActivity = useCallback(async (before?: string) => {
    setLoading(true);
    try {
      const result = await fetchRowActivity(sheetId, rowId, before);
      if (before) {
        setEntries((prev) => [...prev, ...result.entries]);
      } else {
        setEntries(result.entries);
      }
      setNextCursor(result.nextCursor);
    } catch (err) {
      console.error('Failed to load activity:', err);
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, [sheetId, rowId]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const handleLoadMore = () => {
    if (nextCursor) {
      loadActivity(nextCursor);
    }
  };

  const handleCommentClick = useCallback(() => {
    onTabChange?.('comments');
  }, [onTabChange]);

  const handleAttachmentClick = useCallback(() => {
    onTabChange?.('attachments');
  }, [onTabChange]);

  // Group entries for display
  const groups = useMemo(() => groupEntries(entries), [entries]);

  if (!initialLoaded && loading) {
    return (
      <div
        className="flex justify-center py-8"
        data-icod-id="src_features_itemdetail_activitytab_tsx_6b64">
        <Spinner size="md" data-icod-id="src_features_itemdetail_activitytab_tsx_71bc" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No activity yet"
        description="Activity will appear here as changes are made."
        data-icod-id="src_features_itemdetail_activitytab_tsx_6403" />
    );
  }

  return (
    <div
      className="flex flex-col gap-4"
      data-icod-id="src_features_itemdetail_activitytab_tsx_01da">
      {groups.map((group, groupIdx) => {
        const isSingleEntry = group.entries.length === 1;

        if (isSingleEntry) {
          const { entry, formatted } = group.entries[0];
          const Icon = formatted.icon;
          return (
            <div
              key={entry._id}
              className="flex gap-3 text-sm"
              data-icod-id={`src_features_itemdetail_activitytab_tsx_3e0d_${groupIdx}`}>
              <Avatar
                name={group.actorName}
                size="sm"
                className="shrink-0 mt-0.5"
                data-icod-id={`src_features_itemdetail_activitytab_tsx_894b_${groupIdx}`} />
              <div
                className="min-w-0 flex-1"
                data-icod-id={`src_features_itemdetail_activitytab_tsx_9a7e_${groupIdx}`}>
                <div
                  className="flex items-baseline gap-2"
                  data-icod-id={`src_features_itemdetail_activitytab_tsx_9d73_${groupIdx}`}>
                  <span
                    className="font-medium text-foreground"
                    data-icod-id={`src_features_itemdetail_activitytab_tsx_6c85_${groupIdx}`}>{group.actorName}</span>
                  <RelativeTime
                    date={entry.createdAt}
                    className="text-xs"
                    data-icod-id={`src_features_itemdetail_activitytab_tsx_19c4_${groupIdx}`} />
                </div>
                <div
                  className={`mt-0.5 ${formatted.isComment ? 'text-muted-foreground' : 'text-foreground'}`}
                  data-icod-id={`src_features_itemdetail_activitytab_tsx_d75d_${groupIdx}`}>
                  <Icon
                    className="mr-1.5 inline h-3 w-3 text-muted-foreground"
                    data-icod-id={`src_features_itemdetail_activitytab_tsx_a172_${groupIdx}`} />
                  {renderRichParts(
                    formatted.richParts,
                    formatted.isComment ? handleCommentClick : undefined,
                    formatted.isAttachment ? handleAttachmentClick : undefined,
                  )}
                </div>
              </div>
            </div>
          );
        }

        // Multiple entries grouped
        return (
          <div
            key={`group-${groupIdx}`}
            className="flex gap-3 text-sm"
            data-icod-id={`src_features_itemdetail_activitytab_tsx_2f05_${groupIdx}`}>
            <Avatar
              name={group.actorName}
              size="md"
              className="shrink-0 mt-0.5"
              data-icod-id={`src_features_itemdetail_activitytab_tsx_7d97_${groupIdx}`} />
            <div
              className="min-w-0 flex-1"
              data-icod-id={`src_features_itemdetail_activitytab_tsx_c1dc_${groupIdx}`}>
              <div
                className="flex items-baseline gap-2 mb-1"
                data-icod-id={`src_features_itemdetail_activitytab_tsx_7c16_${groupIdx}`}>
                <span
                  className="font-medium text-foreground"
                  data-icod-id={`src_features_itemdetail_activitytab_tsx_9b22_${groupIdx}`}>{group.actorName}</span>
                <RelativeTime
                  date={group.firstCreatedAt}
                  className="text-xs"
                  data-icod-id={`src_features_itemdetail_activitytab_tsx_0329_${groupIdx}`} />
              </div>
              <ul
                className="space-y-1"
                data-icod-id={`src_features_itemdetail_activitytab_tsx_cefe_${groupIdx}`}>
                {group.entries.map(({ entry, formatted }) => {
                  const Icon = formatted.icon;
                  return (
                    <li
                      key={entry._id}
                      className={`flex items-start gap-1.5 ${formatted.isComment ? 'text-muted-foreground' : 'text-foreground'}`}
                      data-icod-id={`src_features_itemdetail_activitytab_tsx_9bcb_${groupIdx}_${entry._id}`}>
                      <Icon
                        className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground"
                        data-icod-id={`src_features_itemdetail_activitytab_tsx_2539_${groupIdx}_${entry._id}`} />
                      <span
                        data-icod-id={`src_features_itemdetail_activitytab_tsx_0c16_${groupIdx}_${entry._id}`}>
                        {renderRichParts(
                          formatted.richParts,
                          formatted.isComment ? handleCommentClick : undefined,
                          formatted.isAttachment ? handleAttachmentClick : undefined,
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      })}
      {nextCursor && (
        <div
          className="pt-2"
          data-icod-id="src_features_itemdetail_activitytab_tsx_c369">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLoadMore}
            disabled={loading}
            data-icod-id="src_features_itemdetail_activitytab_tsx_a081">
            {loading ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
