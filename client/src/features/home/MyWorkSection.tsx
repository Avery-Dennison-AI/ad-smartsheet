import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, Alert, Button, Skeleton, EmptyState } from '@/components/ui';
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
      <Card className="flex flex-col gap-4" data-icod-id="src_features_home_myworksection_tsx_loading">
        <div
          className="flex items-center justify-between px-1"
          data-icod-id="src_features_home_myworksection_tsx_ee75">
          <Skeleton width="120px" data-icod-id="src_features_home_myworksection_tsx_15ad" />
        </div>
        <Skeleton
          variant="tableRow"
          data-icod-id="src_features_home_myworksection_tsx_56d4" />
        <Skeleton
          variant="tableRow"
          data-icod-id="src_features_home_myworksection_tsx_510f" />
        <Skeleton
          variant="tableRow"
          data-icod-id="src_features_home_myworksection_tsx_55c1" />
      </Card>
    );
  }

  if (status === 'failed') {
    return (
      <Card data-icod-id="src_features_home_myworksection_tsx_error">
        <Alert variant="error" data-icod-id="src_features_home_myworksection_tsx_4b84">
          <div
            className="flex items-center justify-between"
            data-icod-id="src_features_home_myworksection_tsx_edf8">
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

  const hasAnyItems =
    groups.overdue.total +
    groups.dueToday.total +
    groups.dueThisWeek.total +
    groups.later.total +
    groups.noDueDate.total;

  if (hasAnyItems === 0) {
    return (
      <Card data-icod-id="src_features_home_myworksection_tsx_empty">
        <EmptyState
          compact
          icon={AlertCircle}
          title="No tasks assigned to you right now."
          data-icod-id="src_features_home_myworksection_tsx_76aa" />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col" data-icod-id="src_features_home_myworksection_tsx_content">
      <h2
        className="mb-3 text-base font-semibold text-foreground"
        data-icod-id="src_features_home_myworksection_tsx_6691">My Work</h2>
      <div
        className="flex flex-col"
        data-icod-id="src_features_home_myworksection_tsx_5752">
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
