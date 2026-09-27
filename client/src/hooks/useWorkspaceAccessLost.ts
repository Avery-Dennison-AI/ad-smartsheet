import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { fetchWorkspaces } from '@/store/slices/workspaceSlice';
import { useToast } from '@/components/ui';

/**
 * Shared hook for handling workspace access-loss errors (403/404).
 * Returns stable callbacks:
 * - handleAccessLost: always redirects to /home after showing a toast.
 * - handleActionError: only redirects for 403/404; shows generic error otherwise.
 * - handleSheetAccessLost: redirects to the workspace if still a member, else /home.
 */
export function useWorkspaceAccessLost() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const isAccessError = useCallback((err: unknown): boolean => {
    const e = err as { status?: number; statusCode?: number };
    const status = e?.status || e?.statusCode;
    return status === 403 || status === 404;
  }, []);

  const handleAccessLost = useCallback((error?: unknown) => {
    addToast('error', 'You no longer have access to this workspace.');
    dispatch(fetchWorkspaces());
    navigate('/home', { replace: true });
  }, [addToast, dispatch, navigate]);

  const handleActionError = useCallback((error: unknown) => {
    if (isAccessError(error)) {
      handleAccessLost(error);
    } else {
      addToast('error', 'Something went wrong. Please try again.');
    }
  }, [isAccessError, handleAccessLost, addToast]);

  const handleSheetAccessLost = useCallback((workspaceId?: string) => {
    addToast('error', 'You no longer have access to this sheet.');
    dispatch(fetchWorkspaces());
    if (workspaceId) {
      navigate(`/workspaces/${workspaceId}`, { replace: true });
    } else {
      navigate('/home', { replace: true });
    }
  }, [addToast, dispatch, navigate]);

  return { handleAccessLost, handleActionError, handleSheetAccessLost, isAccessError };
}
