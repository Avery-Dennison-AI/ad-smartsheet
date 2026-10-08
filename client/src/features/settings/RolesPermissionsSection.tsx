import { useState, useEffect, useCallback, type KeyboardEvent } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { Card, Button, Select, Input, Field, useToast, SaveIndicator, Badge, IconButton } from '@/components/ui';
import PermissionMatrix from '@/components/ui/PermissionMatrix';
import type { PermissionRow } from '@/components/ui/PermissionMatrix';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrgPolicy, saveOrgPolicy, selectOrgPolicy, selectOrgPolicySaving, selectOrgPolicyError } from '@/store/slices/orgPolicySlice';
import { ORG_ROLE_MATRIX, WORKSPACE_SHEET_ROLE_MATRIX } from '@/utils/permissionsDefinition';
import type { OrgPolicy } from '@/types';

const orgColumns = ['Admin', 'Member', 'Guest'];
const wsColumns = ['Owner', 'Admin', 'Editor', 'Viewer'];

/** Roles & Permissions settings section — admin only. */
export default function RolesPermissionsSection() {
  const dispatch = useAppDispatch();
  const policy = useAppSelector(selectOrgPolicy);
  const saving = useAppSelector(selectOrgPolicySaving);
  const saveError = useAppSelector(selectOrgPolicyError);
  const { addToast } = useToast();

  // Local form state (synced from store on load)
  const [form, setForm] = useState<OrgPolicy>({
    whoCanCreateWorkspaces: 'all',
    whoCanInviteGuests: 'admins',
    guestAccessExpiry: 'required',
    defaultGuestExpiryDays: 90,
    allowedGuestEmailDomains: [],
    maxGuestRole: 'editor',
  });
  const [domainInput, setDomainInput] = useState('');

  // Load policy on mount
  useEffect(() => {
    dispatch(fetchOrgPolicy());
  }, [dispatch]);

  // Sync local form when policy loads
  useEffect(() => {
    if (policy) {
      setForm(policy);
    }
  }, [policy]);

  function updateField<K extends keyof OrgPolicy>(key: K, value: OrgPolicy[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleAddDomain(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const domain = domainInput.trim().toLowerCase();
      if (domain && !form.allowedGuestEmailDomains.includes(domain)) {
        updateField('allowedGuestEmailDomains', [...form.allowedGuestEmailDomains, domain]);
      }
      setDomainInput('');
    }
  }

  function handleRemoveDomain(domain: string) {
    updateField(
      'allowedGuestEmailDomains',
      form.allowedGuestEmailDomains.filter((d) => d !== domain),
    );
  }

  const handleSave = useCallback(async () => {
    try {
      await dispatch(saveOrgPolicy(form)).unwrap();
      addToast('success', 'Organization policies saved successfully.');
    } catch (err) {
      addToast('error', typeof err === 'string' ? err : 'Failed to save policies.');
    }
  }, [dispatch, form, addToast]);

  return (
    <div className="flex flex-col gap-6" data-icod-id="roles_permissions_section">
      {/* ─── Part 1: Permissions Reference ──────────────────────────────── */}
      <Card className="p-5" data-icod-id="roles_perm_ref_card">
        <div className="mb-4 flex items-center gap-2" data-icod-id="roles_perm_ref_header">
          <ShieldCheck className="h-5 w-5 text-primary" data-icod-id="roles_perm_ref_icon" />
          <h2 className="text-lg font-semibold text-foreground" data-icod-id="roles_perm_ref_title">Permissions reference</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground" data-icod-id="roles_perm_ref_desc1">
          Organization roles control what users can do at the organization level. Workspace and sheet roles control access within individual workspaces and sheets.
        </p>

        <div className="space-y-6" data-icod-id="roles_perm_matrices">
          <PermissionMatrix
            rows={ORG_ROLE_MATRIX as unknown as PermissionRow[]}
            columns={orgColumns}
            title="Organization roles"
            data-icod-id="roles_org_matrix" />
          <PermissionMatrix
            rows={WORKSPACE_SHEET_ROLE_MATRIX as unknown as PermissionRow[]}
            columns={wsColumns}
            title="Workspace & sheet roles"
            data-icod-id="roles_ws_matrix" />
        </div>
      </Card>
      {/* ─── Part 2: Organization Policies ──────────────────────────────── */}
      <Card className="p-5" data-icod-id="roles_org_policy_card">
        <h2 className="mb-4 text-lg font-semibold text-foreground" data-icod-id="roles_org_policy_title">Organization policies</h2>

        <div className="flex flex-col gap-5 max-w-lg" data-icod-id="roles_org_policy_form">
          {/* Who can create workspaces */}
          <Field label="Who can create workspaces" data-icod-id="roles_field_create_ws">
            <Select
              value={form.whoCanCreateWorkspaces}
              onChange={(e) => updateField('whoCanCreateWorkspaces', e.target.value as 'all' | 'admins')}
              data-icod-id="roles_select_create_ws">
              <option value="all" data-icod-id="roles_opt_all_members">All members</option>
              <option value="admins" data-icod-id="roles_opt_admins_only">Admins only</option>
            </Select>
          </Field>

          {/* Who can invite guests */}
          <Field label="Who can invite guests" data-icod-id="roles_field_invite_guests">
            <Select
              value={form.whoCanInviteGuests}
              onChange={(e) => updateField('whoCanInviteGuests', e.target.value as 'admins' | 'admins_and_workspace_admins')}
              data-icod-id="roles_select_invite_guests">
              <option value="admins" data-icod-id="roles_opt_admins_invite">Admins only</option>
              <option value="admins_and_workspace_admins" data-icod-id="roles_opt_ws_admins_invite">Admins and workspace owners/admins</option>
            </Select>
          </Field>

          {/* Guest access expiry */}
          <Field label="Guest access expiry" data-icod-id="roles_field_expiry">
            <Select
              value={form.guestAccessExpiry}
              onChange={(e) => updateField('guestAccessExpiry', e.target.value as 'optional' | 'required')}
              data-icod-id="roles_select_expiry">
              <option value="optional" data-icod-id="roles_opt_optional">Optional</option>
              <option value="required" data-icod-id="roles_opt_required">Required</option>
            </Select>
          </Field>

          {/* Default expiry days */}
          <Field label="Default expiry (days)" hint="Pre-fills the invite dialog when guest access is required." data-icod-id="roles_field_expiry_days">
            <Input
              type="number"
              min={1}
              max={365}
              value={String(form.defaultGuestExpiryDays)}
              onChange={(e) => updateField('defaultGuestExpiryDays', Number(e.target.value))}
              data-icod-id="roles_input_expiry_days" />
          </Field>

          {/* Allowed guest email domains */}
          <Field label="Allowed guest email domains" hint="Leave empty to allow any domain. Press Enter to add." data-icod-id="roles_field_domains">
            <div className="flex flex-wrap gap-2 mb-2" data-icod-id="roles_domain_chips">
              {form.allowedGuestEmailDomains.map((domain) => (
                <Badge key={domain} variant="neutral" className="gap-1 pr-1" data-icod-id={`roles_domain_chip_${domain}`}>
                  {domain}
                  <IconButton
                    size="sm"
                    tooltip={`Remove ${domain}`}
                    onClick={() => handleRemoveDomain(domain)}
                    className="!h-4 !w-4 !p-0 ml-0.5"
                    data-icod-id={`roles_domain_remove_${domain}`}>
                    <X
                      className="h-3 w-3"
                      data-icod-id={`src_features_settings_rolespermissionssection_tsx_b05c_${domain}`} />
                  </IconButton>
                </Badge>
              ))}
            </div>
            <Input
              placeholder="example.com"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              onKeyDown={handleAddDomain}
              data-icod-id="roles_input_domain" />
          </Field>

          {/* Maximum guest role */}
          <Field label="Maximum guest role" data-icod-id="roles_field_max_guest">
            <Select
              value={form.maxGuestRole}
              onChange={(e) => updateField('maxGuestRole', e.target.value as 'editor' | 'viewer')}
              data-icod-id="roles_select_max_guest">
              <option value="editor" data-icod-id="roles_opt_editor">Editor</option>
              <option value="viewer" data-icod-id="roles_opt_viewer">Viewer</option>
            </Select>
          </Field>

          {/* Save button */}
          <div className="flex items-center gap-3 pt-2" data-icod-id="roles_save_row">
            <Button variant="primary" onClick={handleSave} loading={saving} data-icod-id="roles_save_btn">
              Save changes
            </Button>
            <SaveIndicator saving={saving} error={saveError} data-icod-id="roles_save_indicator" />
          </div>
        </div>
      </Card>
    </div>
  );
}
