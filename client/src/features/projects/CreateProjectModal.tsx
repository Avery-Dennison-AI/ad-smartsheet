import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Field, Input, Select, Alert, Tooltip, SelectableCard } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { selectWorkspaceList, fetchWorkspaces, selectWorkspaceStatus } from '@/store/slices/workspaceSlice';
import { createProject, clearCreateError } from '@/store/slices/projectsSlice';
import { PROJECT_TEMPLATES, type TemplateId } from './projectTemplates';
import type { Workspace } from '@/types';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId?: string;
}

/** Extracts uppercase initials from a name (max 6 chars). */
function suggestKeyPrefix(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return words.slice(0, 6).map((w) => w.charAt(0)).join('').toUpperCase();
}

/** Validates key prefix format: 2-6 uppercase letters. */
function isValidKeyPrefix(prefix: string): boolean {
  return /^[A-Z]{2,6}$/.test(prefix);
}

/** Check if user can create in at least one workspace (editor or above). */
function canCreateInAnyWorkspace(workspaces: Workspace[], userId: string | undefined): boolean {
  if (!userId) return false;
  return workspaces.some((ws) => {
    const member = ws.members.find((m) => m.id === userId);
    const role = member?.role;
    return role === 'editor' || role === 'admin' || role === 'owner';
  });
}

/** Get workspaces where user is editor or above. */
function getEditableWorkspaces(workspaces: Workspace[], userId: string | undefined): Workspace[] {
  if (!userId) return [];
  return workspaces.filter((ws) => {
    const member = ws.members.find((m) => m.id === userId);
    const role = member?.role;
    return role === 'editor' || role === 'admin' || role === 'owner';
  });
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function CreateProjectModal({ open, onClose, workspaceId }: CreateProjectModalProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const workspaces = useAppSelector(selectWorkspaceList);
  const workspaceStatus = useAppSelector(selectWorkspaceStatus);

  const [name, setName] = useState('');
  const [keyPrefix, setKeyPrefix] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch workspaces if not loaded
  useEffect(() => {
    if (open && workspaceStatus === 'idle' && workspaces.length === 0) {
      dispatch(fetchWorkspaces());
    }
  }, [open, workspaceStatus, workspaces.length, dispatch]);

  // Pre-select workspace when provided
  useEffect(() => {
    if (open && workspaceId) {
      setSelectedWorkspaceId(workspaceId);
    } else if (open && !workspaceId) {
      const editable = getEditableWorkspaces(workspaces, user?.id);
      if (editable.length > 0 && !selectedWorkspaceId) {
        setSelectedWorkspaceId(editable[0].id);
      }
    }
  }, [open, workspaceId, workspaces, user?.id, selectedWorkspaceId]);

  // Auto-suggest key prefix from name
  useEffect(() => {
    if (name.trim()) {
      const suggested = suggestKeyPrefix(name);
      // Only update if user hasn't manually edited the prefix yet
      // or if the current prefix matches a previous suggestion
      if (!keyPrefix || keyPrefix === suggestKeyPrefix(name.slice(0, -1)) || keyPrefix.length <= suggested.length) {
        setKeyPrefix(suggested);
      }
    } else {
      setKeyPrefix('');
    }
  }, [name]);

  const editableWorkspaces = getEditableWorkspaces(workspaces, user?.id);
  const canCreate = canCreateInAnyWorkspace(workspaces, user?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate name
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Project name is required.');
      return;
    }
    if (trimmedName.length > 100) {
      setError('Name must be at most 100 characters.');
      return;
    }

    // Validate key prefix
    if (!isValidKeyPrefix(keyPrefix)) {
      setError('Key prefix must be 2-6 uppercase letters.');
      return;
    }

    // Validate template
    if (!selectedTemplate) {
      setError('Please select a template.');
      return;
    }

    // Validate workspace
    if (!selectedWorkspaceId) {
      setError('Please select a workspace.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await dispatch(
        createProject({
          workspaceId: selectedWorkspaceId,
          name: trimmedName,
          keyPrefix,
          template: selectedTemplate,
        }),
      ).unwrap();

      handleClose();
      navigate(`/sheets/${result._id}`);
    } catch (err: unknown) {
      const errorPayload = err as { message?: string; status?: number };
      if (errorPayload?.status === 409) {
        setError('This key prefix is already used in this workspace.');
      } else {
        setError(errorPayload?.message || 'Failed to create project.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setKeyPrefix('');
    setSelectedTemplate(null);
    setSelectedWorkspaceId('');
    setError(null);
    dispatch(clearCreateError());
    onClose();
  };

  const handleKeyPrefixChange = (value: string) => {
    // Auto-uppercase and limit to 6 chars
    const upper = value.toUpperCase().slice(0, 6);
    setKeyPrefix(upper);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create new project"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClose}
            data-icod-id="src_features_projects_createprojectmodal_tsx_cancel"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
            loading={submitting}
            disabled={!canCreate || !name.trim() || !selectedTemplate || !selectedWorkspaceId}
            data-icod-id="src_features_projects_createprojectmodal_tsx_create"
          >
            Create
          </Button>
        </>
      }
      className="max-w-lg"
      data-icod-id="src_features_projects_createprojectmodal_tsx_modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4" data-icod-id="src_features_projects_createprojectmodal_tsx_form">
        {error && <Alert variant="error" data-icod-id="src_features_projects_createprojectmodal_tsx_error">{error}</Alert>}

        {!canCreate && (
          <Alert variant="warning" data-icod-id="src_features_projects_createprojectmodal_tsx_noperm">
            You need editor access in at least one workspace to create projects.
          </Alert>
        )}

        {/* Workspace selector */}
        <Field label="Workspace" htmlFor="project-workspace" required data-icod-id="src_features_projects_createprojectmodal_tsx_ws_field">
          <Select
            id="project-workspace"
            value={selectedWorkspaceId}
            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
            disabled={!canCreate}
            data-icod-id="src_features_projects_createprojectmodal_tsx_ws_select"
          >
            <option value="" data-icod-id="src_features_projects_createprojectmodal_tsx_d41f">Select a workspace</option>
            {editableWorkspaces.map((ws) => (
              <option
                key={ws.id}
                value={ws.id}
                data-icod-id={`src_features_projects_createprojectmodal_tsx_a4be_${ws.id}`}>{ws.name}</option>
            ))}
          </Select>
        </Field>

        {/* Project name */}
        <Field label="Project name" htmlFor="project-name" required data-icod-id="src_features_projects_createprojectmodal_tsx_name_field">
          <Input
            id="project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Project"
            maxLength={100}
            autoFocus
            data-icod-id="src_features_projects_createprojectmodal_tsx_name_input"
          />
        </Field>

        {/* Key prefix */}
        <Field
          label="Key prefix"
          htmlFor="project-key-prefix"
          required
          hint="2-6 uppercase letters (e.g., MA for My App)"
          data-icod-id="src_features_projects_createprojectmodal_tsx_prefix_field"
        >
          <Tooltip content="Used to prefix task keys (e.g., MA-123)" data-icod-id="src_features_projects_createprojectmodal_tsx_prefix_tooltip">
            <Input
              id="project-key-prefix"
              value={keyPrefix}
              onChange={(e) => handleKeyPrefixChange(e.target.value)}
              placeholder="MA"
              maxLength={6}
              className="uppercase"
              data-icod-id="src_features_projects_createprojectmodal_tsx_prefix_input"
            />
          </Tooltip>
        </Field>

        {/* Template selection */}
        <div className="space-y-2" data-icod-id="src_features_projects_createprojectmodal_tsx_template_section">
          <label className="text-sm font-medium text-foreground" data-icod-id="src_features_projects_createprojectmodal_tsx_template_label">
            Template <span
            className="text-destructive"
            data-icod-id="src_features_projects_createprojectmodal_tsx_1695">*</span>
          </label>
          <div
            className="grid grid-cols-2 gap-3"
            role="radiogroup"
            aria-label="Project template"
            data-icod-id="src_features_projects_createprojectmodal_tsx_template_grid"
          >
            {PROJECT_TEMPLATES.map((t) => {
              const Icon = t.icon;
              return (
                <SelectableCard
                  key={t.id}
                  icon={<Icon
                    className="h-4 w-4"
                    data-icod-id={`src_features_projects_createprojectmodal_tsx_17cc_${t.id}`} />}
                  title={t.name}
                  description={t.description}
                  selected={selectedTemplate === t.id}
                  onSelect={() => setSelectedTemplate(t.id)}
                  name="template"
                  value={t.id}
                  data-icod-id={`src_features_projects_createprojectmodal_tsx_dd69_${t.id}`}
                />
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
}
