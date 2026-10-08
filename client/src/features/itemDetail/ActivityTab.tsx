import { useEffect, useState, useCallback } from 'react';
import { History } from 'lucide-react';
import { Button, Spinner, EmptyState, RelativeTime } from '@/components/ui';
import { fetchRowActivity } from '@/services/commentService';
import type { ActivityEntry } from '@/types';

interface ActivityTabProps {
  sheetId: string;
  rowId: string;
}

/** Format activity action into human-readable text. */
function formatActivityDescription(entry: ActivityEntry): string {
  const { action, details } = entry;

  switch (action) {
    case 'created':
      return 'created this item';
    case 'updated': {
      const field = details.field as string | undefined;
      const from = details.from as string | undefined;
      const to = details.to as string | undefined;
      if (field && from !== undefined && to !== undefined) {
        return `changed **${field}** from *${from || 'empty'}* to *${to || 'empty'}*`;
      }
      if (field && to !== undefined) {
        return `set **${field}** to *${to || 'empty'}*`;
      }
      return `updated ${field ?? 'this item'}`;
    }
    case 'deleted':
      return 'deleted content';
    case 'comment_added':
      return 'added a comment';
    default:
      return action.replace(/_/g, ' ');
  }
}

/** Render formatted description with markdown-like bold/italic. */
function renderDescription(text: string): React.ReactNode {
  // Parse **bold** and *italic* patterns
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const segment = match[0];
    if (segment.startsWith('**')) {
      parts.push(<strong
        key={`b-${match.index}`}
        data-icod-id="src_features_itemdetail_activitytab_tsx_b1ac">{segment.slice(2, -2)}</strong>);
    } else {
      parts.push(<em
        key={`i-${match.index}`}
        data-icod-id="src_features_itemdetail_activitytab_tsx_a81f">{segment.slice(1, -1)}</em>);
    }
    lastIndex = match.index + segment.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export default function ActivityTab({ sheetId, rowId }: ActivityTabProps) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const loadActivity = useCallback(async (before?: string) => {
    setLoading(true);
    try {
      const result = await fetchRowActivity(sheetId, rowId, before);
      if (before) {
        // Append to existing entries
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

  // Load on mount
  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const handleLoadMore = () => {
    if (nextCursor) {
      loadActivity(nextCursor);
    }
  };

  if (!initialLoaded && loading) {
    return (
      <div className="flex justify-center py-8" data-icod-id="src_features_itemdetail_activitytab_tsx_loading">
        <Spinner size="md" data-icod-id="src_features_itemdetail_activitytab_tsx_f3c7" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No activity yet"
        description="Activity will appear here as changes are made."
        data-icod-id="src_features_itemdetail_activitytab_tsx_eccd" />
    );
  }

  return (
    <div className="flex flex-col gap-3" data-icod-id="src_features_itemdetail_activitytab_tsx_container">
      {entries.map((entry) => (
        <div key={entry._id} className="flex gap-3 text-sm" data-icod-id={`src_features_itemdetail_activitytab_tsx_entry_${entry._id}`}>
          <div className="min-w-0 flex-1" data-icod-id={`src_features_itemdetail_activitytab_tsx_content_${entry._id}`}>
            <span className="font-medium text-foreground" data-icod-id={`src_features_itemdetail_activitytab_tsx_actor_${entry._id}`}>
              {entry.actorName}
            </span>{' '}
            <span className="text-foreground" data-icod-id={`src_features_itemdetail_activitytab_tsx_desc_${entry._id}`}>
              {renderDescription(formatActivityDescription(entry))}
            </span>
          </div>
          <RelativeTime date={entry.createdAt} data-icod-id={`src_features_itemdetail_activitytab_tsx_time_${entry._id}`} />
        </div>
      ))}

      {nextCursor && (
        <div className="pt-2" data-icod-id="src_features_itemdetail_activitytab_tsx_loadmore_wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLoadMore}
            disabled={loading}
            data-icod-id="src_features_itemdetail_activitytab_tsx_loadmore">
            {loading ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
