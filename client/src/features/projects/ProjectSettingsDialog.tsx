import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal, Button, Input, Select, Tabs, SortableList, Spinner, Alert, ColorSwatchPicker } from '@/components/ui';
import { useAppDispatch } from '@/store/hooks';
import { fetchGrid } from '@/store/slices/gridSlice';
import * as projectService from '@/services/projectService';
import type { StatusEntry, ItemTypeEntry, ProjectStatus, ProjectItemType, ProjectUsage } from '@/types';

interface ProjectSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  sheetId: string;
}

type TabId = 'statuses' | 'types';

const CATEGORY_OPTIONS = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
] as const;

export default function ProjectSettingsDialog({
  open,
  onClose,
  sheetId,
}: ProjectSettingsDialogProps) {
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<TabId>('statuses');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local state for statuses and item types
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemTypeEntry[]>([]);
  const [usage, setUsage] = useState<ProjectUsage>({ statusUsage: {}, typeUsage: {} });

  // Track original values to detect changes
  const [originalStatuses, setOriginalStatuses] = useState<StatusEntry[]>([]);
  const [originalItemTypes, setItemType] = useState<ItemTypeEntry[]>([]);

  // Color picker state
  const [colorPickerAnchor, setColorPickerAnchor] = useState<{ ref: React.RefObject<HTMLElement | null>; index: number } | null>(null);

  // Removal confirmation state
  const [removeConfirm, setRemoveConfirm] = useState<{
    type: 'status' | 'type';
    id: string;
    name: string;
  } | null>(null);
  const [replacementId, setReplacementId] = useState('');

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
          setItemType(loadedTypes);
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

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    let valid = true;

    // Validate statuses
    const statusNames = new Set<string>();
    statuses.forEach((s, i) => {
      if (!s.name.trim()) {
        errors[`status-name-${i}`] = 'Name is required';
        valid = false;
      } else if (s.name.length > 40) {
        errors[`status-name-${i}`] = 'Max 40 characters';
        valid = false;
      }
      const lower = s.name.trim().toLowerCase();
      if (statusNames.has(lower)) {
        errors[`status-name-${i}`] = 'Duplicate name';
        valid = false;
      }
      statusNames.add(lower);
    });

    const hasTodo = statuses.some((s) => s.category === 'todo');
    const hasDone = statuses.some((s) => s.category === 'done');
    if (!hasTodo) {
      errors['status-category'] = 'At least one "To do" status required';
      valid = false;
    }
    if (!hasDone) {
      errors['status-category-done'] = 'At least one "Done" status required';
      valid = false;
    }

    // Validate item types
    const typeNames = new Set<string>();
    itemTypes.forEach((t, i) => {
      if (!t.name.trim()) {
        errors[`type-name-${i}`] = 'Name is required';
        valid = false;
      } else if (t.name.length > 40) {
        errors[`type-name-${i}`] = 'Max 40 characters';
        valid = false;
      }
      const lower = t.name.trim().toLowerCase();
      if (typeNames.has(lower)) {
        errors[`type-name-${i}`] = 'Duplicate name';
        valid = false;
      }
      typeNames.add(lower);
    });

    setValidationErrors(errors);
    return valid;
  }, [statuses, itemTypes]);

  // ── Save handler ────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    setError(null);

    try {
      // Determine replacements for removed statuses/types
      const oldStatusIds = new Set(originalStatuses.filter((s) => s.id).map((s) => s.id!));
      const newStatusIds = new Set(statuses.filter((s) => s.id).map((s) => s.id!));
      const statusReplacements: Record<string, string> = {};

      // For any removed status with usage, we already handled it via removeConfirm
      // so no additional replacements needed here

      const oldTypeIds = new Set(originalItemTypes.filter((t) => t.id).map((t) => t.id!));
      const newTypeIds = new Set(itemTypes.filter((t) => t.id).map((t) => t.id!));

      // Check if statuses changed
      const statusesChanged = JSON.stringify(statuses) !== JSON.stringify(originalStatuses);
      const typesChanged = JSON.stringify(itemTypes) !== JSON.stringify(originalItemTypes);

      if (statusesChanged) {
        await projectService.updateStatuses(sheetId, {
          statuses,
          replacements: Object.keys(statusReplacements).length > 0 ? statusReplacements : undefined,
        });
      }

      if (typesChanged) {
        await projectService.updateItemTypes(sheetId, {
          itemTypes,
        });
      }

      // Refresh grid to pick up column option changes
      await dispatch(fetchGrid(sheetId)).unwrap();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Status helpers ──────────────────────────────────────────────────────────

  const updateStatus = (index: number, patch: Partial<StatusEntry>) => {
    setStatuses((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addStatus = () => {
    setStatuses((prev) => [
      ...prev,
      { name: '', color: '#64748B', category: 'todo' },
    ]);
  };

  const requestRemoveStatus = (index: number) => {
    const status = statuses[index];
    const usageCount = status.id ? (usage.statusUsage[status.id] || 0) : 0;

    // Cannot remove last todo or last done
    const todoCount = statuses.filter((s) => s.category === 'todo').length;
    const doneCount = statuses.filter((s) => s.category === 'done').length;
    if (status.category === 'todo' && todoCount <= 1) return;
    if (status.category === 'done' && doneCount <= 1) return;

    if (usageCount > 0 && status.id) {
      setRemoveConfirm({ type: 'status', id: status.id, name: status.name });
      setReplacementId('');
    } else {
      setStatuses((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const confirmRemoveWithReplacement = () => {
    if (!removeConfirm || !replacementId) return;

    if (removeConfirm.type === 'status') {
      setStatuses((prev) => prev.filter((s) => s.id !== removeConfirm.id));
    } else {
      setItemTypes((prev) => prev.filter((t) => t.id !== removeConfirm.id));
    }
    setRemoveConfirm(null);
    setReplacementId('');
  };

  // ── Item type helpers ──────────────────────────────────────────────────────

  const updateItemType = (index: number, patch: Partial<ItemTypeEntry>) => {
    setItemTypes((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const addItemType = () => {
    setItemTypes((prev) => [...prev, { name: '' }]);
  };

  const requestRemoveItemType = (index: number) => {
    const itemType = itemTypes[index];
    const usageCount = itemType.id ? (usage.typeUsage[itemType.id] || 0) : 0;

    if (itemTypes.length <= 1) return;

    if (usageCount > 0 && itemType.id) {
      setRemoveConfirm({ type: 'type', id: itemType.id, name: itemType.name });
      setReplacementId('');
    } else {
      setItemTypes((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const tabs = [
    { id: 'statuses' as TabId, label: 'Statuses', badge: statuses.length },
    { id: 'types' as TabId, label: 'Item types', badge: itemTypes.length },
  ];

  const remainingStatuses = statuses.filter((s) => s.id !== removeConfirm?.id);
  const remainingTypes = itemTypes.filter((t) => t.id !== removeConfirm?.id);

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Project settings"
        size="lg"
        className="max-w-[680px]"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={onClose}
              data-icod-id="src_features_projects_projectsettingsdialog_tsx_2389">Cancel</Button>
            <Button
              onClick={handleSave}
              loading={saving}
              data-icod-id="src_features_projects_projectsettingsdialog_tsx_14ea">Save</Button>
          </>
        }
        data-icod-id="src_features_projects_projectsettingsdialog_tsx_13f4">
        {loading ? (
          <div
            className="flex items-center justify-center py-12"
            data-icod-id="src_features_projects_projectsettingsdialog_tsx_d3eb">
            <Spinner
              size="md"
              data-icod-id="src_features_projects_projectsettingsdialog_tsx_9210" />
          </div>
        ) : error ? (
          <Alert
            variant="error"
            data-icod-id="src_features_projects_projectsettingsdialog_tsx_6c0d">{error}</Alert>
        ) : (
          <div
            className="flex flex-col gap-4"
            data-icod-id="src_features_projects_projectsettingsdialog_tsx_9e56">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as TabId)}
              data-icod-id="src_features_projects_projectsettingsdialog_tsx_1fa6" />

            {/* Category-level validation errors */}
            {(validationErrors['status-category'] || validationErrors['status-category-done']) && activeTab === 'statuses' && (
              <Alert
                variant="error"
                data-icod-id="src_features_projects_projectsettingsdialog_tsx_0872">
                {validationErrors['status-category'] || validationErrors['status-category-done']}
              </Alert>
            )}

            {activeTab === 'statuses' && (
              <div
                className="flex flex-col gap-1"
                data-icod-id="src_features_projects_projectsettingsdialog_tsx_7fa9">
                <SortableList
                  items={statuses}
                  onReorder={setStatuses}
                  keyExtractor={(s) => s.id || `new-status-${s.name}`}
                  renderItem={(status, index, dragHandleProps) => {
                    const todoCount = statuses.filter((s) => s.category === 'todo').length;
                    const doneCount = statuses.filter((s) => s.category === 'done').length;
                    const canRemove = !(status.category === 'todo' && todoCount <= 1) && !(status.category === 'done' && doneCount <= 1) && statuses.length > 1;
                    const statusUsage = status.id ? (usage.statusUsage[status.id] || 0) : 0;

                    return (
                      <div
                        className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-card p-2"
                        data-icod-id="src_features_projects_projectsettingsdialog_tsx_2010">
                        <div
                          data-icod-id="src_features_projects_projectsettingsdialog_tsx_7353"
                          {...dragHandleProps}
                          aria-label="Drag to reorder">
                          <span
                            className={dragHandleProps.className}
                            data-icod-id="src_features_projects_projectsettingsdialog_tsx_56e9">
                            {/* GripVertical icon rendered inline */}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              data-icod-id="src_features_projects_projectsettingsdialog_tsx_9d99"><circle
                              cx="9"
                              cy="12"
                              r="1"
                              data-icod-id="src_features_projects_projectsettingsdialog_tsx_57bd" /><circle
                              cx="9"
                              cy="5"
                              r="1"
                              data-icod-id="src_features_projects_projectsettingsdialog_tsx_1cb3" /><circle
                              cx="9"
                              cy="19"
                              r="1"
                              data-icod-id="src_features_projects_projectsettingsdialog_tsx_fce2" /><circle
                              cx="15"
                              cy="12"
                              r="1"
                              data-icod-id="src_features_projects_projectsettingsdialog_tsx_5ff6" /><circle
                              cx="15"
                              cy="5"
                              r="1"
                              data-icod-id="src_features_projects_projectsettingsdialog_tsx_c140" /><circle
                              cx="15"
                              cy="19"
                              r="1"
                              data-icod-id="src_features_projects_projectsettingsdialog_tsx_c3ad" /></svg>
                          </span>
                        </div>
                        <Input
                          size="sm"
                          value={status.name}
                          onChange={(e) => updateStatus(index, { name: e.target.value })}
                          placeholder="Status name"
                          error={validationErrors[`status-name-${index}`]}
                          className="flex-1"
                          data-icod-id="src_features_projects_projectsettingsdialog_tsx_082f" />
                        <button
                          type="button"
                          ref={(el) => {
                            // Store ref for color picker anchor
                          }}
                          className="h-6 w-6 shrink-0 rounded-full border border-border transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          style={{ backgroundColor: status.color }}
                          aria-label={`Color: ${status.color}`}
                          onClick={(e) => {
                            const target = e.currentTarget as HTMLElement;
                            const refObj = { current: target };
                            setColorPickerAnchor({ ref: refObj, index });
                          }}
                          data-icod-id="src_features_projects_projectsettingsdialog_tsx_da58" />
                        <Select
                          size="sm"
                          value={status.category}
                          onChange={(e) => updateStatus(index, { category: e.target.value as StatusEntry['category'] })}
                          className="w-28"
                          data-icod-id="src_features_projects_projectsettingsdialog_tsx_127c">
                          {CATEGORY_OPTIONS.map((opt) => (
                            <option
                              key={opt.value}
                              value={opt.value}
                              data-icod-id={`src_features_projects_projectsettingsdialog_tsx_031c_${opt.value}`}>{opt.label}</option>
                          ))}
                        </Select>
                        {statusUsage > 0 && (
                          <span
                            className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                            data-icod-id="src_features_projects_projectsettingsdialog_tsx_ddbd">
                            {statusUsage}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!canRemove}
                          onClick={() => requestRemoveStatus(index)}
                          aria-label="Remove status"
                          className="!h-7 !w-7 shrink-0 !p-0"
                          data-icod-id="src_features_projects_projectsettingsdialog_tsx_bc35">
                          <Trash2
                            className="h-3.5 w-3.5"
                            data-icod-id="src_features_projects_projectsettingsdialog_tsx_300f" />
                        </Button>
                      </div>
                    );
                  }}
                  data-icod-id="src_features_projects_projectsettingsdialog_tsx_dae7" />

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={addStatus}
                  leftIcon={<Plus
                    className="h-3.5 w-3.5"
                    data-icod-id="src_features_projects_projectsettingsdialog_tsx_8898" />}
                  className="mt-2 self-start"
                  data-icod-id="src_features_projects_projectsettingsdialog_tsx_519a">
                  Add status
                </Button>
              </div>
            )}

            {activeTab === 'types' && (
              <div
                className="flex flex-col gap-1"
                data-icod-id="src_features_projects_projectsettingsdialog_tsx_748b">
                <SortableList
                  items={itemTypes}
                  onReorder={setItemTypes}
                  keyExtractor={(t) => t.id || `new-type-${t.name}`}
                  renderItem={(itemType, index, dragHandleProps) => {
                    const typeUsage = itemType.id ? (usage.typeUsage[itemType.id] || 0) : 0;
                    const canRemove = itemTypes.length > 1;

                    return (
                      <div
                        className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-card p-2"
                        data-icod-id="src_features_projects_projectsettingsdialog_tsx_2663">
                        <div
                          data-icod-id="src_features_projects_projectsettingsdialog_tsx_084c"
                          {...dragHandleProps}
                          aria-label="Drag to reorder">
                          <span
                            className={dragHandleProps.className}
                            data-icod-id="src_features_projects_projectsettingsdialog_tsx_ec7e">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              data-icod-id="src_features_projects_projectsettingsdialog_tsx_f441"><circle
                              cx="9"
                              cy="12"
                              r="1"
                              data-icod-id="src_features_projects_projectsettingsdialog_tsx_79a3" /><circle
                              cx="9"
                              cy="5"
                              r="1"
                              data-icod-id="src_features_projects_projectsettingsdialog_tsx_1344" /><circle
                              cx="9"
                              cy="19"
                              r="1"
                              data-icod-id="src_features_projects_projectsettingsdialog_tsx_5744" /><circle
                              cx="15"
                              cy="12"
                              r="1"
                              data-icod-id="src_features_projects_projectsettingsdialog_tsx_d44c" /><circle
                              cx="15"
                              cy="5"
                              r="1"
                              data-icod-id="src_features_projects_projectsettingsdialog_tsx_633b" /><circle
                              cx="15"
                              cy="19"
                              r="1"
                              data-icod-id="src_features_projects_projectsettingsdialog_tsx_d559" /></svg>
                          </span>
                        </div>
                        <Input
                          size="sm"
                          value={itemType.name}
                          onChange={(e) => updateItemType(index, { name: e.target.value })}
                          placeholder="Item type name"
                          error={validationErrors[`type-name-${index}`]}
                          className="flex-1"
                          data-icod-id="src_features_projects_projectsettingsdialog_tsx_bcae" />
                        {typeUsage > 0 && (
                          <span
                            className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                            data-icod-id="src_features_projects_projectsettingsdialog_tsx_d391">
                            {typeUsage}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!canRemove}
                          onClick={() => requestRemoveItemType(index)}
                          aria-label="Remove item type"
                          className="!h-7 !w-7 shrink-0 !p-0"
                          data-icod-id="src_features_projects_projectsettingsdialog_tsx_91b4">
                          <Trash2
                            className="h-3.5 w-3.5"
                            data-icod-id="src_features_projects_projectsettingsdialog_tsx_161f" />
                        </Button>
                      </div>
                    );
                  }}
                  data-icod-id="src_features_projects_projectsettingsdialog_tsx_d5d2" />

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={addItemType}
                  leftIcon={<Plus
                    className="h-3.5 w-3.5"
                    data-icod-id="src_features_projects_projectsettingsdialog_tsx_f55d" />}
                  className="mt-2 self-start"
                  data-icod-id="src_features_projects_projectsettingsdialog_tsx_8b42">
                  Add item type
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
      {/* Color swatch picker popover */}
      {colorPickerAnchor && (
        <ColorSwatchPicker
          anchorRef={colorPickerAnchor.ref}
          value={statuses[colorPickerAnchor.index]?.color ?? null}
          onChange={(hex) => {
            if (hex && colorPickerAnchor) {
              updateStatus(colorPickerAnchor.index, { color: hex });
            }
          }}
          onClose={() => setColorPickerAnchor(null)}
          data-icod-id="src_features_projects_projectsettingsdialog_tsx_2904" />
      )}
      {/* Remove confirmation dialog */}
      {removeConfirm && (
        <Modal
          open={!!removeConfirm}
          onClose={() => { setRemoveConfirm(null); setReplacementId(''); }}
          title={`Remove "${removeConfirm.name}"`}
          size="sm"
          footer={
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setRemoveConfirm(null); setReplacementId(''); }}
                data-icod-id="src_features_projects_projectsettingsdialog_tsx_50f3">Cancel</Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!replacementId}
                onClick={confirmRemoveWithReplacement}
                data-icod-id="src_features_projects_projectsettingsdialog_tsx_d12d">Remove</Button>
            </>
          }
          data-icod-id="src_features_projects_projectsettingsdialog_tsx_cae2">
          <p
            className="text-muted-foreground"
            data-icod-id="src_features_projects_projectsettingsdialog_tsx_275a">
            Items currently use this {removeConfirm.type}. Choose where to move them:
          </p>
          <div
            className="mt-3"
            data-icod-id="src_features_projects_projectsettingsdialog_tsx_2dc2">
            <Select
              label={`Move to another ${removeConfirm.type}`}
              value={replacementId}
              onChange={(e) => setReplacementId(e.target.value)}
              data-icod-id="src_features_projects_projectsettingsdialog_tsx_b396">
              <option
                value=""
                data-icod-id="src_features_projects_projectsettingsdialog_tsx_3014">Select...</option>
              {removeConfirm.type === 'status'
                ? remainingStatuses.map((s, __icodIdx0) => (<option
                key={s.id || s.name}
                value={s.id}
                data-icod-id={`src_features_projects_projectsettingsdialog_tsx_6bdd_${__icodIdx0}`}>{s.name}</option>))
                : remainingTypes.map((t, __icodIdx1) => (<option
                key={t.id || t.name}
                value={t.id}
                data-icod-id={`src_features_projects_projectsettingsdialog_tsx_c188_${__icodIdx1}`}>{t.name}</option>))
              }
            </Select>
          </div>
        </Modal>
      )}
    </>
  );
}
