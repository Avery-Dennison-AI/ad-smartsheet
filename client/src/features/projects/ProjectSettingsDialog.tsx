import { useState, useCallback } from 'react';
import { Modal, Button, Tabs, Spinner, Alert } from '@/components/ui';
import type { StatusEntry, ItemTypeEntry } from '@/types';
import useProjectSettings from './useProjectSettings';
import StatusesTab from './StatusesTab';
import ItemTypesTab from './ItemTypesTab';
import MoveItemsStep from './MoveItemsStep';

interface ProjectSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  sheetId: string;
}

type TabId = 'statuses' | 'types';

export default function ProjectSettingsDialog({
  open,
  onClose,
  sheetId,
}: ProjectSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>('statuses');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Removal confirmation state
  const [removeConfirm, setRemoveConfirm] = useState<{
    type: 'status' | 'type';
    id: string;
    name: string;
  } | null>(null);

  const {
    loading,
    saving,
    error,
    statuses,
    itemTypes,
    usage,
    setStatuses,
    setItemTypes,
    save,
  } = useProjectSettings(open, sheetId, onClose);

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
    await save();
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
    } else {
      setStatuses((prev) => prev.filter((_, i) => i !== index));
    }
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
    } else {
      setItemTypes((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // ── Move confirmation handler ──────────────────────────────────────────────

  const confirmRemoveWithReplacement = (replacementId: string) => {
    if (!removeConfirm || !replacementId) return;

    if (removeConfirm.type === 'status') {
      setStatuses((prev) => prev.filter((s) => s.id !== removeConfirm.id));
    } else {
      setItemTypes((prev) => prev.filter((t) => t.id !== removeConfirm.id));
    }
    setRemoveConfirm(null);
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
              <StatusesTab
                statuses={statuses}
                usage={usage}
                validationErrors={validationErrors}
                onUpdateStatus={updateStatus}
                onAddStatus={addStatus}
                onRequestRemoveStatus={requestRemoveStatus}
                onReorder={setStatuses}
                data-icod-id="src_features_projects_projectsettingsdialog_tsx_2510" />
            )}

            {activeTab === 'types' && (
              <ItemTypesTab
                itemTypes={itemTypes}
                usage={usage}
                validationErrors={validationErrors}
                onUpdateItemType={updateItemType}
                onAddItemType={addItemType}
                onRequestRemoveItemType={requestRemoveItemType}
                onReorder={setItemTypes}
                data-icod-id="src_features_projects_projectsettingsdialog_tsx_bcb2" />
            )}
          </div>
        )}
      </Modal>
      {/* Remove confirmation dialog */}
      {removeConfirm && (
        <MoveItemsStep
          open={!!removeConfirm}
          type={removeConfirm.type}
          itemName={removeConfirm.name}
          remainingStatuses={remainingStatuses}
          remainingTypes={remainingTypes}
          onConfirm={confirmRemoveWithReplacement}
          onCancel={() => setRemoveConfirm(null)}
          data-icod-id="src_features_projects_projectsettingsdialog_tsx_c9cd" />
      )}
    </>
  );
}
