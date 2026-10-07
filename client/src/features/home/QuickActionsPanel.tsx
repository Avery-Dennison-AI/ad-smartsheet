import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { selectOrgPolicy, fetchOrgPolicy } from '@/store/slices/orgPolicySlice';
import { CreateWorkspaceModal } from '@/features/workspaces';

export default function QuickActionsPanel() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const orgPolicy = useAppSelector(selectOrgPolicy);
  const [createWsOpen, setCreateWsOpen] = useState(false);

  useEffect(() => {
    if (!orgPolicy) {
      dispatch(fetchOrgPolicy());
    }
  }, [orgPolicy, dispatch]);

  const isAdmin = user?.role === 'admin';
  const canCreateWorkspaces = orgPolicy?.whoCanCreateWorkspaces !== 'admins' || isAdmin;

  return (
    <Card className="flex flex-col gap-3" data-icod-id="src_features_home_quickactionspanel_tsx_root">
      <h3
        className="text-sm font-semibold text-foreground"
        data-icod-id="src_features_home_quickactionspanel_tsx_5005">Quick Actions</h3>
      <Button
        variant="primary"
        size="sm"
        leftIcon={<Plus
          className="h-4 w-4"
          data-icod-id="src_features_home_quickactionspanel_tsx_e87d" />}
        onClick={() => navigate('/workspaces')}
        data-icod-id="src_features_home_quickactionspanel_tsx_new_sheet"
      >
        New sheet
      </Button>
      {canCreateWorkspaces && (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Plus
            className="h-4 w-4"
            data-icod-id="src_features_home_quickactionspanel_tsx_4966" />}
          onClick={() => setCreateWsOpen(true)}
          data-icod-id="src_features_home_quickactionspanel_tsx_new_workspace"
        >
          New workspace
        </Button>
      )}
      <CreateWorkspaceModal
        open={createWsOpen}
        onClose={() => setCreateWsOpen(false)}
        data-icod-id="src_features_home_quickactionspanel_tsx_e049" />
    </Card>
  );
}
