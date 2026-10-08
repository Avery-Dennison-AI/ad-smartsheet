import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { fetchGrid } from '@/store/slices/gridSlice';
import * as projectService from '@/services/projectService';
import type { StatusEntry, ItemTypeEntry, ProjectStatus, ProjectItemType, ProjectUsage } from '@/types';

interface UseProjectSettingsResult {
  loading: boolean;
  saving: boolean;
  error: string | null;
  statuses: StatusEntry[];
  itemTypes: ItemTypeEntry[];
  usage: ProjectUsage;
  originalStatuses: StatusEntry[];
  originalItemTypes: ItemTypeEntry[];
  setStatuses: React.Dispatch<React.SetStateAction<StatusEntry[]>>;
  setItemTypes: React.Dispatch<React.SetStateAction<ItemTypeEntry[]>>;
  save: () => Promise<boolean>;
}

/**
 * Hook that loads and manages project settings (statuses + item types),
 * exposes editable copies, and provides a save function.
 */
export default function useProjectSettings(
  open: boolean,
  sheetId: string,
  onClose: () => void,
): UseProjectSettingsResult {
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statuses, setStatuses] = useState<StatusEntry[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemTypeEntry[]>([]);
  const [usage, setUsage] = useState<ProjectUsage>({ statusUsage: {}, typeUsage: {} });

  const [originalStatuses, setOriginalStatuses] = useState<StatusEntry[]>([]);
  const [originalItemTypes, setOriginalItemTypes] = useState<ItemTypeEntry[]>([]);

  // Load data when dialog opens
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [sheetRes, usageData] = await Promise.all([
          import('@/services/sheetService').then((m) => m.getSheet(sheetId)),
          projectService.getProjectUsage(sheetId),
        ]);

        if (cancelled) return;

        const sheetData = sheetRes.data.data;
        const project = sheetData?.project;

        if (project) {
          const loadedStatuses: StatusEntry[] = (project.statuses || []).map((s: ProjectStatus) => ({
            id: s.id,
            name: s.name,
            color: s.color,
            category: s.category,
          }));
          const loadedTypes: ItemTypeEntry[] = (project.itemTypes || []).map((t: ProjectItemType) => ({
            id: t.id,
            name: t.name,
          }));

          setStatuses(loadedStatuses);
          setOriginalStatuses(loadedStatuses);
          setItemTypes(loadedTypes);
          setOriginalItemTypes(loadedTypes);
          setUsage(usageData);
        } else {
          setError('This is not a project sheet');
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load project settings';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [open, sheetId]);

  const save = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    setError(null);

    try {
      const statusesChanged = JSON.stringify(statuses) !== JSON.stringify(originalStatuses);
      const typesChanged = JSON.stringify(itemTypes) !== JSON.stringify(originalItemTypes);

      if (statusesChanged) {
        await projectService.updateStatuses(sheetId, { statuses });
      }

      if (typesChanged) {
        await projectService.updateItemTypes(sheetId, { itemTypes });
      }

      // Refresh grid to pick up column option changes
      await dispatch(fetchGrid(sheetId)).unwrap();
      onClose();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      setError(msg);
      return false;
    } finally {
      setSaving(false);
    }
  }, [dispatch, sheetId, statuses, itemTypes, originalStatuses, originalItemTypes, onClose]);

  return {
    loading,
    saving,
    error,
    statuses,
    itemTypes,
    usage,
    originalStatuses,
    originalItemTypes,
    setStatuses,
    setItemTypes,
    save,
  };
}
