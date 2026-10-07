import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Card, Alert, Button, Skeleton, EmptyState } from '@/components/ui';
import Badge from '@/components/ui/Badge';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMyWork, selectMyWorkGroups, selectMyWorkStatus, selectMyWorkError } from '@/store/slices/myWorkSlice';
import MyWorkGroup from './MyWorkGroup';

export default function MyWorkSection() {
  const dispatch = useAppDispatch();
  const groups = useAppSelector(selectMyWorkGroups);
  const status = useAppSelector(selectMyWorkStatus);
  const error = useAppSelector(selectMyWorkError);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchMyWork());
    }
  }, [status, dispatch]);

  if (status === 'loading') {
    return (
      <Card className="p-6" data-icod-id="src_features_home_myworksection_tsx_loading">
        <div className="flex flex-col gap-4" data-icod-id="src_features_home_myworksection_tsx_load_inner">
          <Skeleton width="120px" data-icod-id="src_features_home_myworksection_tsx_15ad" />
          <Skeleton variant="tableRow" data-icod-id="src_features_home_myworksection_tsx_56d4" />
          <Skeleton variant="tableRow" data-icod-id="src_features_home_myworksection_tsx_510f" />
          <Skeleton variant="tableRow" data-icod-id="src_features_home_myworksection_tsx_55c1" />
        </div>
      </Card>
    );
  }

  if (status === 'failed') {
    return (
      <Card className="p-6" data-icod-id="src_features_home_myworksection_tsx_error">
        <Alert variant="error" data-icod-id="src_features_home_myworksection_tsx_4b84">
          <div className="flex items-center justify-between" data-icod-id="src_features_home_myworksection_tsx_edf8">
            <span data-icod-id="src_features_home_myworksection_tsx_7e95">{error || 'Failed to load your work'}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => dispatch(fetchMyWork())}
              data-icod-id="src_features_home_myworksection_tsx_b57f">
              Try again
            </Button>
          </div>
        </Alert>
      </Card>
    );
  }

  if (!groups) return null;

  const totalCount =
    groups.overdue.total +
    groups.dueToday.total +
    groups.dueThisWeek.total +
    groups.later.total +
    groups.noDueDate.total;

  if (totalCount === 0) {
    return (
      <Card className="p-6" data-icod-id="src_features_home_myworksection_tsx_empty">
        <EmptyState
          icon={CheckCircle2}
          title="You're all caught up"
          description="Tasks assigned to you in any sheet will appear here"
          data-icod-id="src_features_home_myworksection_tsx_76aa" />
      </Card>
    );
  }

  return (
    <Card className="p-6" data-icod-id="src_features_home_myworksection_tsx_content">
      <div className="mb-4 flex items-center gap-2" data-icod-id="src_features_home_myworksection_tsx_header">
        <h2 className="text-base font-semibold text-foreground" data-icod-id="src_features_home_myworksection_tsx_6691">
          My Work
        </h2>
        <Badge variant="neutral" size="sm" data-icod-id="src_features_home_myworksection_tsx_badge">
          {totalCount}
        </Badge>
      </div>
      <div className="flex flex-col" data-icod-id="src_features_home_myworksection_tsx_5752">
        <MyWorkGroup
          title="Overdue"
          items={groups.overdue.items}
          total={groups.overdue.total}
          defaultOpen
          titleClassName="text-destructive"
          data-icod-id="src_features_home_myworksection_tsx_0b6e" />
        <MyWorkGroup
          title="Due Today"
          items={groups.dueToday.items}
          total={groups.dueToday.total}
          defaultOpen
          data-icod-id="src_features_home_myworksection_tsx_c3df" />
        <MyWorkGroup
          title="Due This Week"
          items={groups.dueThisWeek.items}
          total={groups.dueThisWeek.total}
          defaultOpen
          data-icod-id="src_features_home_myworksection_tsx_e39f" />
        <MyWorkGroup
          title="Later"
          items={groups.later.items}
          total={groups.later.total}
          data-icod-id="src_features_home_myworksection_tsx_7a9a" />
        <MyWorkGroup
          title="No Due Date"
          items={groups.noDueDate.items}
          total={groups.noDueDate.total}
          data-icod-id="src_features_home_myworksection_tsx_738d" />
      </div>
    </Card>
  );
}
