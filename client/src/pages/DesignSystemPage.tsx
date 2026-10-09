import { useState, useRef } from 'react';
import { Search, Settings, Trash2, Copy, Plus, Home, Clock, Bold, Italic, Underline, Strikethrough, Eraser, AlignLeft, AlignCenter, AlignRight, ChevronDown, PaintBucket, Type, WrapText } from 'lucide-react';
import {
  Button,
  IconButton,
  Input,
  inputClass,
  Textarea,
  Select,
  Checkbox,
  Toggle,
  DropdownMenu,
  Modal,
  ConfirmDialog,
  useToast,
  Tooltip,
  Avatar,
  AvatarGroup,
  Badge,
  Tabs,
  Card,
  EmptyState,
  Skeleton,
  Spinner,
  Alert,
  SectionHeader,
  Breadcrumbs,
  PageHeader,
  DataTable,
  Pagination,
  CopyField,
  PasswordRequirements,
  PageContainer,
  WorkspaceIcon,
  ColorPicker,
  UserPicker,
  RoleMenu,
  FavoritesStar,
  RelativeTime,
  SheetIcon,
  DatePicker,
  CalendarDatePicker,
  Pill,
  SaveIndicator,
  ToggleButton,
  Toolbar,
  ToolbarGroup,
  ColorSwatchPicker,
  ResizeHandle,
  ColorSwatchGroup,
  AnimatedBrandBackground,
  PermissionMatrix,
  SelectableCard,
  ContactField,
  DateField,
} from '@/components/ui';
import type { BadgeVariant, DataTableColumn, UserOption } from '@/components/ui';
import type { WorkspaceMember } from '@/components/ui/ContactField';
import type { DropdownMenuItem } from '@/components/ui/DropdownMenu';
import type { RoleValue } from '@/components/ui/RoleMenu';
import SidebarNavItem from '@/components/layout/SidebarNavItem';
import SettingsLayout from '@/components/layout/SettingsLayout';
import type { SettingsNavGroup } from '@/components/layout/SettingsLayout';
import ColumnPropertiesModal from '@/features/sheets/grid/ColumnPropertiesModal';
import type { DropdownOption } from '@/types';
import { ACCENTS, ACCENT_META } from '@/utils/theme';
import type { Accent } from '@/utils/theme';
import { ORG_ROLE_MATRIX, WORKSPACE_SHEET_ROLE_MATRIX } from '@/utils/permissionsDefinition';
import { PROJECT_TEMPLATES } from '@/features/projects/projectTemplates';

/* ─── Section wrapper ─────────────────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10" data-icod-id="src_pages_designsystempage_tsx_a136">
      <SectionHeader title={title} data-icod-id="src_pages_designsystempage_tsx_8073" />
      {children}
    </section>
  );
}

/* ─── Color swatch ────────────────────────────────────────────────────────── */
function Swatch({ color, name, hex }: { color: string; name: string; hex: string }) {
  return (
    <div
      className="flex flex-col gap-1"
      data-icod-id="src_pages_designsystempage_tsx_729a">
      <div
        className="h-10 w-16 rounded-[var(--radius-sm)] border border-border"
        style={{ backgroundColor: color }}
        data-icod-id="src_pages_designsystempage_tsx_3734" />
      <span
        className="text-xs font-medium text-foreground"
        data-icod-id="src_pages_designsystempage_tsx_bbb4">{name}</span>
      <span
        className="text-2xs text-muted-foreground"
        data-icod-id="src_pages_designsystempage_tsx_0715">{hex}</span>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────────── */
export default function DesignSystemPage() {
  const { addToast } = useToast();

  // Local state for interactive demos
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTypeOpen, setConfirmTypeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tab1');
  const [toggleOn, setToggleOn] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);

  return (
    <div
      className="mx-auto max-w-5xl"
      data-icod-id="src_pages_designsystempage_tsx_5a53">
      <h1
        className="mb-8 text-xl font-bold text-foreground"
        data-icod-id="src_pages_designsystempage_tsx_a283">Design System</h1>
      {/* ─── 1. Color Tokens ─────────────────────────────────────────────── */}
      <Section title="Color Tokens" data-icod-id="src_pages_designsystempage_tsx_8506">
        <div className="space-y-6" data-icod-id="src_pages_designsystempage_tsx_f941">
          <div data-icod-id="src_pages_designsystempage_tsx_3823">
            <h3
              className="mb-2 text-sm font-medium text-muted-foreground"
              data-icod-id="src_pages_designsystempage_tsx_1fa6">Primary</h3>
            <div
              className="flex flex-wrap gap-4"
              data-icod-id="src_pages_designsystempage_tsx_50b4">
              <Swatch
                color="#0F766E"
                name="primary"
                hex="#0F766E"
                data-icod-id="src_pages_designsystempage_tsx_4f52" />
              <Swatch
                color="#115E59"
                name="primary-hover"
                hex="#115E59"
                data-icod-id="src_pages_designsystempage_tsx_95f8" />
              <Swatch
                color="#134E4A"
                name="primary-pressed"
                hex="#134E4A"
                data-icod-id="src_pages_designsystempage_tsx_fa66" />
              <Swatch
                color="#F0FDFA"
                name="primary-bg"
                hex="#F0FDFA"
                data-icod-id="src_pages_designsystempage_tsx_b593" />
              <Swatch
                color="#99F6E4"
                name="primary-border"
                hex="#99F6E4"
                data-icod-id="src_pages_designsystempage_tsx_2bb0" />
            </div>
          </div>
          <div data-icod-id="src_pages_designsystempage_tsx_439b">
            <h3
              className="mb-2 text-sm font-medium text-muted-foreground"
              data-icod-id="src_pages_designsystempage_tsx_a169">Neutrals</h3>
            <div
              className="flex flex-wrap gap-4"
              data-icod-id="src_pages_designsystempage_tsx_ceb5">
              <Swatch
                color="#F9FAFB"
                name="gray-50"
                hex="#F9FAFB"
                data-icod-id="src_pages_designsystempage_tsx_b2fa" />
              <Swatch
                color="#F3F4F6"
                name="gray-100"
                hex="#F3F4F6"
                data-icod-id="src_pages_designsystempage_tsx_ae9d" />
              <Swatch
                color="#E5E7EB"
                name="gray-200"
                hex="#E5E7EB"
                data-icod-id="src_pages_designsystempage_tsx_1b2d" />
              <Swatch
                color="#9CA3AF"
                name="gray-400"
                hex="#9CA3AF"
                data-icod-id="src_pages_designsystempage_tsx_8dff" />
              <Swatch
                color="#4B5563"
                name="gray-600"
                hex="#4B5563"
                data-icod-id="src_pages_designsystempage_tsx_1762" />
              <Swatch
                color="#111827"
                name="gray-900"
                hex="#111827"
                data-icod-id="src_pages_designsystempage_tsx_281f" />
            </div>
          </div>
          <div data-icod-id="src_pages_designsystempage_tsx_2752">
            <h3
              className="mb-2 text-sm font-medium text-muted-foreground"
              data-icod-id="src_pages_designsystempage_tsx_01ba">Semantic</h3>
            <div
              className="flex flex-wrap gap-4"
              data-icod-id="src_pages_designsystempage_tsx_3b60">
              <Swatch
                color="#16A34A"
                name="success"
                hex="#16A34A"
                data-icod-id="src_pages_designsystempage_tsx_0527" />
              <Swatch
                color="#D97706"
                name="warning"
                hex="#D97706"
                data-icod-id="src_pages_designsystempage_tsx_a260" />
              <Swatch
                color="#DC2626"
                name="danger"
                hex="#DC2626"
                data-icod-id="src_pages_designsystempage_tsx_b16c" />
              <Swatch
                color="#2563EB"
                name="info"
                hex="#2563EB"
                data-icod-id="src_pages_designsystempage_tsx_c112" />
            </div>
          </div>
          <div data-icod-id="src_pages_designsystempage_tsx_bc2a">
            <h3
              className="mb-2 text-sm font-medium text-muted-foreground"
              data-icod-id="src_pages_designsystempage_tsx_7407">Status</h3>
            <div
              className="flex flex-wrap gap-4"
              data-icod-id="src_pages_designsystempage_tsx_0579">
              <Swatch
                color="#DC2626"
                name="status-red"
                hex="#DC2626"
                data-icod-id="src_pages_designsystempage_tsx_b60e" />
              <Swatch
                color="#D97706"
                name="status-yellow"
                hex="#D97706"
                data-icod-id="src_pages_designsystempage_tsx_891d" />
              <Swatch
                color="#16A34A"
                name="status-green"
                hex="#16A34A"
                data-icod-id="src_pages_designsystempage_tsx_562c" />
              <Swatch
                color="#2563EB"
                name="status-blue"
                hex="#2563EB"
                data-icod-id="src_pages_designsystempage_tsx_9b62" />
              <Swatch
                color="#7C3AED"
                name="status-purple"
                hex="#7C3AED"
                data-icod-id="src_pages_designsystempage_tsx_purple_solid" />
              <Swatch
                color="#EDE9FE"
                name="status-purple-bg"
                hex="#EDE9FE"
                data-icod-id="src_pages_designsystempage_tsx_purple_light" />
              <Swatch
                color="#6B7280"
                name="status-gray"
                hex="#6B7280"
                data-icod-id="src_pages_designsystempage_tsx_d8e3" />
            </div>
          </div>
          <div data-icod-id="src_pages_designsystempage_tsx_a971">
            <h3
              className="mb-2 text-sm font-medium text-muted-foreground"
              data-icod-id="src_pages_designsystempage_tsx_a779">Selection</h3>
            <div
              className="flex flex-wrap gap-4"
              data-icod-id="src_pages_designsystempage_tsx_cb64">
              <Swatch
                color="#CCFBF1"
                name="selection-bg"
                hex="#CCFBF1"
                data-icod-id="src_pages_designsystempage_tsx_eb10" />
              <Swatch
                color="#0F766E"
                name="selection-border"
                hex="#0F766E"
                data-icod-id="src_pages_designsystempage_tsx_b26c" />
            </div>
          </div>
        </div>
      </Section>
      {/* ─── Animated Brand Background ───────────────────────────────────── */}
      <Section
        title="Animated Brand Background"
        data-icod-id="src_pages_designsystempage_tsx_70a9">
        <div
          className="rounded-xl overflow-hidden"
          style={{ height: 320 }}
          data-icod-id="src_pages_designsystempage_tsx_3aa0">
          <div
            className="relative w-full h-full"
            data-icod-id="src_pages_designsystempage_tsx_644b">
            <AnimatedBrandBackground data-icod-id="src_pages_designsystempage_tsx_2837" />
            <div
              className="relative z-10 flex items-center justify-center h-full"
              data-icod-id="src_pages_designsystempage_tsx_fe0c">
              <span
                className="text-white font-bold text-2xl"
                data-icod-id="src_pages_designsystempage_tsx_dd5f">AnimatedBrandBackground</span>
            </div>
          </div>
        </div>
        <p
          className="mt-3 text-sm text-muted-foreground"
          data-icod-id="src_pages_designsystempage_tsx_d9a1">
          Used as the hero background on the landing page and the left panel of the auth layout. Animates CSS transform/opacity only; respects prefers-reduced-motion.
        </p>
      </Section>
      {/* ─── Permission Matrix ───────────────────────────────────────────── */}
      <Section
        title="PermissionMatrix"
        data-icod-id="ds_permissionmatrix_section">
        <div className="space-y-6" data-icod-id="ds_permissionmatrix_wrap">
          <Card data-icod-id="ds_permissionmatrix_org_card">
            <PermissionMatrix
              rows={ORG_ROLE_MATRIX as unknown as import('@/components/ui/PermissionMatrix').PermissionRow[]}
              columns={['Admin', 'Member', 'Guest']}
              title="Organization roles"
              data-icod-id="ds_permissionmatrix_org" />
          </Card>
          <Card data-icod-id="ds_permissionmatrix_ws_card">
            <PermissionMatrix
              rows={WORKSPACE_SHEET_ROLE_MATRIX as unknown as import('@/components/ui/PermissionMatrix').PermissionRow[]}
              columns={['Owner', 'Admin', 'Editor', 'Viewer']}
              title="Workspace & sheet roles"
              data-icod-id="ds_permissionmatrix_ws" />
          </Card>
        </div>
      </Section>
      {/* ─── 2. Typography Scale ─────────────────────────────────────────── */}
      <Section
        title="Typography Scale"
        data-icod-id="src_pages_designsystempage_tsx_f9c3">
        <div
          className="flex flex-col gap-3"
          data-icod-id="src_pages_designsystempage_tsx_3a89">
          {[
            { size: 'var(--text-xs)', weight: 'var(--font-regular)', label: '12px / Regular' },
            { size: 'var(--text-sm)', weight: 'var(--font-regular)', label: '13px / Regular' },
            { size: 'var(--text-base)', weight: 'var(--font-regular)', label: '14px / Regular' },
            { size: 'var(--text-base)', weight: 'var(--font-medium)', label: '14px / Medium' },
            { size: 'var(--text-base)', weight: 'var(--font-semibold)', label: '14px / Semibold' },
            { size: 'var(--text-md)', weight: 'var(--font-regular)', label: '16px / Regular' },
            { size: 'var(--text-md)', weight: 'var(--font-semibold)', label: '16px / Semibold' },
            { size: 'var(--text-lg)', weight: 'var(--font-semibold)', label: '20px / Semibold' },
            { size: 'var(--text-xl)', weight: 'var(--font-semibold)', label: '24px / Semibold' },
          ].map((t) => (
            <div
              key={t.label}
              className="flex items-baseline gap-4"
              data-icod-id={`src_pages_designsystempage_tsx_ea67_${t.label}`}>
              <span
                className="w-36 shrink-0 text-xs text-muted-foreground"
                data-icod-id={`src_pages_designsystempage_tsx_89eb_${t.label}`}>{t.label}</span>
              <span
                className="text-foreground"
                style={{ fontSize: t.size, fontWeight: t.weight, lineHeight: 'var(--line-height-ui)' }}
                data-icod-id={`src_pages_designsystempage_tsx_9fac_${t.label}`}>
                The quick brown fox jumps over the lazy dog
              </span>
            </div>
          ))}
        </div>
      </Section>
      {/* ─── 3. Spacing Scale ────────────────────────────────────────────── */}
      <Section title="Spacing Scale" data-icod-id="src_pages_designsystempage_tsx_ce6e">
        <div
          className="flex flex-col gap-2"
          data-icod-id="src_pages_designsystempage_tsx_0700">
          {[
            { token: '--space-1', value: '4px' },
            { token: '--space-2', value: '8px' },
            { token: '--space-3', value: '12px' },
            { token: '--space-4', value: '16px' },
            { token: '--space-5', value: '20px' },
            { token: '--space-6', value: '24px' },
            { token: '--space-8', value: '32px' },
            { token: '--space-12', value: '48px' },
          ].map((s) => (
            <div
              key={s.token}
              className="flex items-center gap-4"
              data-icod-id={`src_pages_designsystempage_tsx_a5dd_${s.token}`}>
              <span
                className="w-28 shrink-0 text-xs text-muted-foreground"
                data-icod-id={`src_pages_designsystempage_tsx_86c2_${s.token}`}>{s.token} ({s.value})</span>
              <div
                className="h-4 rounded-sm bg-primary/30"
                style={{ width: s.value }}
                data-icod-id={`src_pages_designsystempage_tsx_5e35_${s.token}`} />
            </div>
          ))}
        </div>
      </Section>
      {/* ─── 4. Radius & Shadows ─────────────────────────────────────────── */}
      <Section
        title="Radius & Shadows"
        data-icod-id="src_pages_designsystempage_tsx_1452">
        <div
          className="flex flex-wrap gap-6"
          data-icod-id="src_pages_designsystempage_tsx_ac00">
          <div
            className="flex flex-col items-center gap-2"
            data-icod-id="src_pages_designsystempage_tsx_5030">
            <div
              className="h-16 w-16 border border-border bg-card"
              style={{ borderRadius: 'var(--radius-sm)' }}
              data-icod-id="src_pages_designsystempage_tsx_38d3" />
            <span
              className="text-xs text-muted-foreground"
              data-icod-id="src_pages_designsystempage_tsx_7e0c">radius-sm (4px)</span>
          </div>
          <div
            className="flex flex-col items-center gap-2"
            data-icod-id="src_pages_designsystempage_tsx_6c88">
            <div
              className="h-16 w-16 border border-border bg-card"
              style={{ borderRadius: 'var(--radius-md)' }}
              data-icod-id="src_pages_designsystempage_tsx_e456" />
            <span
              className="text-xs text-muted-foreground"
              data-icod-id="src_pages_designsystempage_tsx_2d4a">radius-md (6px)</span>
          </div>
          <div
            className="flex flex-col items-center gap-2"
            data-icod-id="src_pages_designsystempage_tsx_cb28">
            <div
              className="h-16 w-16 border border-border bg-card"
              style={{ borderRadius: 'var(--radius-lg)' }}
              data-icod-id="src_pages_designsystempage_tsx_8e63" />
            <span
              className="text-xs text-muted-foreground"
              data-icod-id="src_pages_designsystempage_tsx_688f">radius-lg (8px)</span>
          </div>
          <div
            className="flex flex-col items-center gap-2"
            data-icod-id="src_pages_designsystempage_tsx_b37d">
            <div
              className="h-16 w-24 rounded-[var(--radius-md)] bg-card"
              style={{ boxShadow: 'var(--shadow-sm)' }}
              data-icod-id="src_pages_designsystempage_tsx_874e" />
            <span
              className="text-xs text-muted-foreground"
              data-icod-id="src_pages_designsystempage_tsx_de36">shadow-sm</span>
          </div>
          <div
            className="flex flex-col items-center gap-2"
            data-icod-id="src_pages_designsystempage_tsx_d9bf">
            <div
              className="h-16 w-24 rounded-[var(--radius-md)] bg-card"
              style={{ boxShadow: 'var(--shadow-md)' }}
              data-icod-id="src_pages_designsystempage_tsx_ebdd" />
            <span
              className="text-xs text-muted-foreground"
              data-icod-id="src_pages_designsystempage_tsx_928f">shadow-md</span>
          </div>
        </div>
      </Section>
      {/* ─── 5. Grid Tokens ──────────────────────────────────────────────── */}
      <Section title="Grid Tokens" data-icod-id="src_pages_designsystempage_tsx_5bcf">
        <Card data-icod-id="src_pages_designsystempage_tsx_f32c">
          <table
            className="w-full text-left text-sm"
            data-icod-id="src_pages_designsystempage_tsx_0025">
            <thead data-icod-id="src_pages_designsystempage_tsx_10b3">
              <tr className="bg-muted" data-icod-id="src_pages_designsystempage_tsx_7ce2">
                <th
                  className="px-4 py-2 font-medium text-muted-foreground"
                  data-icod-id="src_pages_designsystempage_tsx_e8cb">Token</th>
                <th
                  className="px-4 py-2 font-medium text-muted-foreground"
                  data-icod-id="src_pages_designsystempage_tsx_a87c">Value</th>
              </tr>
            </thead>
            <tbody
              className="divide-y divide-border"
              data-icod-id="src_pages_designsystempage_tsx_8e37">
              {[
                ['--grid-row-height-compact', '32px'],
                ['--grid-row-height-comfortable', '40px'],
                ['--grid-cell-padding', '0 8px'],
                ['--grid-header-font-size', '12px'],
                ['--grid-header-font-weight', '500'],
                ['--grid-row-num-width', '52px'],
              ].map(([token, value]) => (
                <tr key={token} data-icod-id={`src_pages_designsystempage_tsx_b3ec_${token}`}>
                  <td
                    className="px-4 py-2 font-mono text-xs text-foreground"
                    data-icod-id={`src_pages_designsystempage_tsx_af43_${token}`}>{token}</td>
                  <td
                    className="px-4 py-2 text-muted-foreground"
                    data-icod-id={`src_pages_designsystempage_tsx_cd6f_${token}`}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>
      {/* ─── 6. Button ───────────────────────────────────────────────────── */}
      <Section title="Button" data-icod-id="src_pages_designsystempage_tsx_604d">
        <div className="space-y-4" data-icod-id="src_pages_designsystempage_tsx_45be">
          {(['primary', 'secondary', 'ghost', 'danger'] as const).map((variant) => (
            <div
              key={variant}
              className="flex items-center gap-3"
              data-icod-id={`src_pages_designsystempage_tsx_73b3_${variant}`}>
              <span
                className="w-20 shrink-0 text-xs text-muted-foreground"
                data-icod-id={`src_pages_designsystempage_tsx_18d7_${variant}`}>{variant}</span>
              <Button
                variant={variant}
                size="sm"
                data-icod-id={`src_pages_designsystempage_tsx_302e_${variant}`}>Small</Button>
              <Button
                variant={variant}
                size="md"
                data-icod-id={`src_pages_designsystempage_tsx_1413_${variant}`}>Medium</Button>
              <Button
                variant={variant}
                size="lg"
                data-icod-id={`src_pages_designsystempage_tsx_b4c0_${variant}`}>Large</Button>
              <Button
                variant={variant}
                size="md"
                loading
                data-icod-id={`src_pages_designsystempage_tsx_3950_${variant}`}>Loading</Button>
              <Button
                variant={variant}
                size="md"
                disabled
                data-icod-id={`src_pages_designsystempage_tsx_c0b5_${variant}`}>Disabled</Button>
              <Button
                variant={variant}
                size="md"
                leftIcon={<Plus
                  className="h-4 w-4"
                  data-icod-id={`src_pages_designsystempage_tsx_8b89_${variant}`} />}
                data-icod-id={`src_pages_designsystempage_tsx_6df7_${variant}`}>Icon</Button>
            </div>
          ))}
        </div>
      </Section>
      {/* ─── 7. IconButton ───────────────────────────────────────────────── */}
      <Section title="IconButton" data-icod-id="src_pages_designsystempage_tsx_f281">
        <div
          className="flex items-center gap-4"
          data-icod-id="src_pages_designsystempage_tsx_1ef4">
          <IconButton
            size="sm"
            tooltip="Small"
            data-icod-id="src_pages_designsystempage_tsx_be33"><Search className="h-4 w-4" data-icod-id="src_pages_designsystempage_tsx_2b4e" /></IconButton>
          <IconButton
            size="md"
            tooltip="Medium"
            data-icod-id="src_pages_designsystempage_tsx_16a4"><Settings className="h-4 w-4" data-icod-id="src_pages_designsystempage_tsx_426e" /></IconButton>
          <IconButton
            size="lg"
            tooltip="Large"
            data-icod-id="src_pages_designsystempage_tsx_d6cb"><Copy className="h-4 w-4" data-icod-id="src_pages_designsystempage_tsx_e506" /></IconButton>
          <IconButton
            size="md"
            tooltip="Disabled"
            disabled
            data-icod-id="src_pages_designsystempage_tsx_3df4"><Trash2 className="h-4 w-4" data-icod-id="src_pages_designsystempage_tsx_6c94" /></IconButton>
        </div>
      </Section>
      {/* ─── 8. Form Controls ────────────────────────────────────────────── */}
      <Section title="Form Controls" data-icod-id="src_pages_designsystempage_tsx_9263">
        <div
          className="grid max-w-md gap-6"
          data-icod-id="src_pages_designsystempage_tsx_12cc">
          <Input
            label="Default input"
            placeholder="Type something..."
            helperText="This is helper text."
            data-icod-id="src_pages_designsystempage_tsx_f1d2" />
          <Input
            label="Error input"
            error="This field is required."
            defaultValue="Bad value"
            data-icod-id="src_pages_designsystempage_tsx_c6a5" />
          <Input
            label="Disabled input"
            disabled
            defaultValue="Can't edit this"
            data-icod-id="src_pages_designsystempage_tsx_907c" />
          <Textarea
            label="Textarea"
            placeholder="Multi-line text..."
            helperText="Auto-resizable."
            data-icod-id="src_pages_designsystempage_tsx_9838" />
          <Select label="Select" data-icod-id="src_pages_designsystempage_tsx_0bcc">
            <option value="" data-icod-id="src_pages_designsystempage_tsx_195f">Choose an option...</option>
            <option value="a" data-icod-id="src_pages_designsystempage_tsx_97ba">Option A</option>
            <option value="b" data-icod-id="src_pages_designsystempage_tsx_c8a4">Option B</option>
            <option value="c" data-icod-id="src_pages_designsystempage_tsx_8ddf">Option C</option>
          </Select>
          <Checkbox
            label="Accept terms"
            checked={checkboxChecked}
            onChange={(e) => setCheckboxChecked(e.target.checked)}
            helperText="You must accept to continue."
            data-icod-id="src_pages_designsystempage_tsx_d4ee" />
          <Toggle
            label="Enable notifications"
            checked={toggleOn}
            onChange={(e) => setToggleOn(e.target.checked)}
            data-icod-id="src_pages_designsystempage_tsx_fd1e" />
          {/* UserPicker demo */}
          <div className="space-y-3 pt-2" data-icod-id="ds_userpicker_demo">
            <span className="text-sm font-medium text-foreground" data-icod-id="ds_userpicker_label">UserPicker</span>
            <UserPickerDemoIdle data-icod-id="ds_userpicker_idle" />
            <UserPickerDemoPopulated data-icod-id="ds_userpicker_populated" />
            <p className="text-xs text-muted-foreground" data-icod-id="ds_userpicker_note">
              The picker accepts an async <code
              className="rounded bg-muted px-1 text-2xs"
              data-icod-id="src_pages_designsystempage_tsx_763f">onSearch</code> prop. Results are fetched with a 300ms debounce when the query reaches 2+ characters.
            </p>
          </div>
        </div>
      </Section>
      {/* ─── 9. DropdownMenu ─────────────────────────────────────────────── */}
      <Section title="DropdownMenu" data-icod-id="src_pages_designsystempage_tsx_d5cc">
        <DropdownMenu
          trigger={<Button
            variant="secondary"
            size="md"
            data-icod-id="src_pages_designsystempage_tsx_7558">Open Menu</Button>}
          items={[
            { label: 'Edit', icon: <Plus className="h-4 w-4" data-icod-id="src_pages_designsystempage_tsx_a7d2" />, shortcut: 'Ctrl+E' },
            { label: 'Duplicate', icon: <Copy className="h-4 w-4" data-icod-id="src_pages_designsystempage_tsx_3e9d" />, shortcut: 'Ctrl+D' },
            { type: 'divider' },
            { label: 'Delete', icon: <Trash2 className="h-4 w-4" data-icod-id="src_pages_designsystempage_tsx_95d6" />, danger: true, shortcut: 'Del' },
          ]}
          data-icod-id="src_pages_designsystempage_tsx_4c1a" />
      </Section>
      {/* ─── 9b. Role Menu ────────────────────────────────────────────────── */}
      <Section title="Role Menu" data-icod-id="ds_rolemenu_section">
        <div className="flex items-start gap-6" data-icod-id="ds_rolemenu_row">
          <div className="flex flex-col gap-2" data-icod-id="ds_rolemenu_admin_wrap">
            <span className="text-xs text-muted-foreground" data-icod-id="ds_rolemenu_admin_label">Admin (with onRemove)</span>
            <RoleMenuDemoAdmin data-icod-id="ds_rolemenu_admin" />
          </div>
          <div className="flex flex-col gap-2" data-icod-id="ds_rolemenu_editor_wrap">
            <span className="text-xs text-muted-foreground" data-icod-id="ds_rolemenu_editor_label">Editor</span>
            <RoleMenuDemoEditor data-icod-id="ds_rolemenu_editor" />
          </div>
          <div className="flex flex-col gap-2" data-icod-id="ds_rolemenu_viewer_wrap">
            <span className="text-xs text-muted-foreground" data-icod-id="ds_rolemenu_viewer_label">Viewer (with onLeave)</span>
            <RoleMenuDemoViewer data-icod-id="ds_rolemenu_viewer" />
          </div>
        </div>
      </Section>
      {/* ─── 10. Modal & ConfirmDialog ───────────────────────────────────── */}
      <Section
        title="Modal & ConfirmDialog"
        data-icod-id="src_pages_designsystempage_tsx_ec20">
        <div className="flex gap-3" data-icod-id="src_pages_designsystempage_tsx_d0fc">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setModalOpen(true)}
            data-icod-id="src_pages_designsystempage_tsx_1f8b">Open Modal</Button>
          <Button
            variant="danger"
            size="md"
            onClick={() => setConfirmOpen(true)}
            data-icod-id="src_pages_designsystempage_tsx_4488">Open Confirm</Button>
          <Button
            variant="danger"
            size="md"
            onClick={() => setConfirmTypeOpen(true)}
            data-icod-id="ds_confirmdialog_typeconfirm_btn">Type-to-Confirm</Button>
        </div>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Example Modal"
          footer={<Button
            size="sm"
            onClick={() => setModalOpen(false)}
            data-icod-id="src_pages_designsystempage_tsx_da0b">Close</Button>}
          data-icod-id="src_pages_designsystempage_tsx_d659">
          <p
            className="text-muted-foreground"
            data-icod-id="src_pages_designsystempage_tsx_27b8">This is a modal dialog with focus trapping, Escape key close, and backdrop click.</p>
        </Modal>

        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Delete sheet?"
          description="This action cannot be undone. All data in this sheet will be permanently deleted."
          confirmLabel="Delete"
          onConfirm={() => addToast('info', 'Confirmed (no-op in design system)')}
          data-icod-id="src_pages_designsystempage_tsx_b141" />

        <ConfirmDialog
          open={confirmTypeOpen}
          onClose={() => setConfirmTypeOpen(false)}
          title="Delete workspace?"
          description="This will permanently delete the workspace and all its contents. This action cannot be undone."
          confirmText="My workspace"
          confirmInputLabel='Type "My workspace" to confirm'
          confirmLabel="Delete workspace"
          onConfirm={() => addToast('info', 'Type-to-confirm succeeded (no-op in design system)')}
          data-icod-id="ds_confirmdialog_typeconfirm_instance" />
      </Section>
      {/* ─── 11. Toast ───────────────────────────────────────────────────── */}
      <Section title="Toast" data-icod-id="src_pages_designsystempage_tsx_a0d8">
        <div className="flex gap-3" data-icod-id="src_pages_designsystempage_tsx_a35b">
          <Button
            variant="primary"
            size="md"
            onClick={() => addToast('success', 'Changes saved successfully!')}
            data-icod-id="src_pages_designsystempage_tsx_97e4">Success Toast</Button>
          <Button
            variant="danger"
            size="md"
            onClick={() => addToast('error', 'Failed to save changes.')}
            data-icod-id="src_pages_designsystempage_tsx_6289">Error Toast</Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => addToast('info', 'New version available.')}
            data-icod-id="src_pages_designsystempage_tsx_bec2">Info Toast</Button>
        </div>
      </Section>
      {/* ─── 12. Tooltip ─────────────────────────────────────────────────── */}
      <Section title="Tooltip" data-icod-id="src_pages_designsystempage_tsx_c942">
        <div
          className="flex items-center gap-6"
          data-icod-id="src_pages_designsystempage_tsx_5bfc">
          <Tooltip
            content="This is a tooltip"
            data-icod-id="src_pages_designsystempage_tsx_ee22">
            <span
              className="cursor-help border-b border-dashed border-muted-foreground text-sm text-muted-foreground"
              data-icod-id="src_pages_designsystempage_tsx_8705">Hover me</span>
          </Tooltip>
          <Tooltip
            content="Keyboard shortcut: Ctrl+S"
            data-icod-id="src_pages_designsystempage_tsx_16b8">
            <Button
              variant="secondary"
              size="sm"
              data-icod-id="src_pages_designsystempage_tsx_ea0c">Save</Button>
          </Tooltip>
        </div>
      </Section>
      {/* ─── 13. Avatar & AvatarGroup ────────────────────────────────────── */}
      <Section
        title="Avatar & AvatarGroup"
        data-icod-id="src_pages_designsystempage_tsx_0e2b">
        <div className="space-y-4" data-icod-id="src_pages_designsystempage_tsx_749b">
          <div
            className="flex items-center gap-4"
            data-icod-id="src_pages_designsystempage_tsx_bfee">
            <Avatar
              name="Alice Johnson"
              size="sm"
              data-icod-id="src_pages_designsystempage_tsx_ad2e" />
            <Avatar
              name="Bob Smith"
              size="md"
              data-icod-id="src_pages_designsystempage_tsx_e785" />
            <Avatar
              name="Charlie Brown"
              size="lg"
              data-icod-id="src_pages_designsystempage_tsx_1de8" />
            <Avatar
              name="Diana Prince"
              src="/assets/avatar-placeholder.png"
              size="md"
              data-icod-id="src_pages_designsystempage_tsx_88cf" />
          </div>
          <AvatarGroup
            items={[
              { name: 'Alice Johnson' },
              { name: 'Bob Smith' },
              { name: 'Charlie Brown' },
              { name: 'Diana Prince' },
              { name: 'Eve Torres' },
            ]}
            max={3}
            data-icod-id="src_pages_designsystempage_tsx_4e46" />
        </div>
      </Section>
      {/* ─── 14. Badge ───────────────────────────────────────────────────── */}
      <Section title="Badge" data-icod-id="src_pages_designsystempage_tsx_863e">
        <div className="space-y-3" data-icod-id="src_pages_designsystempage_tsx_f8d2">
          <div
            className="flex flex-wrap items-center gap-2"
            data-icod-id="src_pages_designsystempage_tsx_c50f">
            {(['neutral', 'success', 'warning', 'danger', 'info'] as BadgeVariant[]).map((v) => (
              <Badge
                key={v}
                variant={v}
                data-icod-id={`src_pages_designsystempage_tsx_3646_${v}`}>{v}</Badge>
            ))}
          </div>
          <div
            className="flex flex-wrap items-center gap-2"
            data-icod-id="src_pages_designsystempage_tsx_95df">
            {(['status-red', 'status-yellow', 'status-green', 'status-blue', 'status-gray'] as BadgeVariant[]).map((v) => (
              <Badge
                key={v}
                variant={v}
                data-icod-id={`src_pages_designsystempage_tsx_2863_${v}`}>{v.replace('status-', '')}</Badge>
            ))}
          </div>
          <div
            className="flex items-center gap-2"
            data-icod-id="src_pages_designsystempage_tsx_ea89">
            <Badge size="sm" data-icod-id="src_pages_designsystempage_tsx_c059">Small</Badge>
            <Badge size="md" data-icod-id="src_pages_designsystempage_tsx_9118">Medium</Badge>
          </div>
        </div>
      </Section>
      {/* ─── 15. Tabs ────────────────────────────────────────────────────── */}
      <Section title="Tabs" data-icod-id="src_pages_designsystempage_tsx_a667">
        <Tabs
          tabs={[
            { id: 'tab1', label: 'Overview' },
            { id: 'tab2', label: 'Details', icon: <Settings className="h-4 w-4" data-icod-id="src_pages_designsystempage_tsx_8d97" /> },
            { id: 'tab3', label: 'Activity' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          data-icod-id="src_pages_designsystempage_tsx_5225" />
        <div
          className="rounded-b-[var(--radius-lg)] border-x border-b border-border p-4 text-sm text-muted-foreground"
          data-icod-id="src_pages_designsystempage_tsx_712c">
          Active tab: {activeTab}
        </div>
      </Section>
      {/* ─── 16. Card ────────────────────────────────────────────────────── */}
      <Section title="Card" data-icod-id="src_pages_designsystempage_tsx_0584">
        <Card
          header="Card Header"
          footer={<span
            className="text-xs text-muted-foreground"
            data-icod-id="src_pages_designsystempage_tsx_57e9">Card footer content</span>}
          data-icod-id="src_pages_designsystempage_tsx_bac9">
          <div
            className="p-4 text-sm text-muted-foreground"
            data-icod-id="src_pages_designsystempage_tsx_3f19">
            Card body with content. Uses radius-lg, 1px gray-200 border, no shadow on flat surfaces.
          </div>
        </Card>
      </Section>
      {/* ─── 17. EmptyState ──────────────────────────────────────────────── */}
      <Section title="EmptyState" data-icod-id="src_pages_designsystempage_tsx_ce1f">
        <div className="space-y-4" data-icod-id="src_pages_designsystempage_tsx_9149">
          <Card data-icod-id="src_pages_designsystempage_tsx_a0e1">
            <EmptyState
              icon={Search}
              title="No results found"
              description="Try adjusting your search or filters."
              action={<Button
                variant="primary"
                size="sm"
                data-icod-id="src_pages_designsystempage_tsx_0e24">Clear filters</Button>}
              data-icod-id="src_pages_designsystempage_tsx_e0c1" />
          </Card>
          <div data-icod-id="src_pages_designsystempage_tsx_c458">
            <span
              className="mb-2 block text-xs text-muted-foreground"
              data-icod-id="ds_emptystate_compact_label">Compact variant</span>
            <Card data-icod-id="ds_emptystate_compact_card">
              <EmptyState
                compact
                icon={Clock}
                title="Sheets you open will appear here."
                data-icod-id="ds_emptystate_compact_instance" />
            </Card>
          </div>
        </div>
      </Section>
      {/* ─── 18. Skeleton Loaders ────────────────────────────────────────── */}
      <Section
        title="Skeleton Loaders"
        data-icod-id="src_pages_designsystempage_tsx_02f5">
        <div className="space-y-4" data-icod-id="src_pages_designsystempage_tsx_645a">
          <div data-icod-id="src_pages_designsystempage_tsx_3b97">
            <span
              className="mb-2 block text-xs text-muted-foreground"
              data-icod-id="src_pages_designsystempage_tsx_44ea">Line</span>
            <div
              className="flex flex-col gap-2"
              data-icod-id="src_pages_designsystempage_tsx_a301">
              <Skeleton
                variant="line"
                width="60%"
                data-icod-id="src_pages_designsystempage_tsx_80f2" />
              <Skeleton
                variant="line"
                width="100%"
                data-icod-id="src_pages_designsystempage_tsx_9aa0" />
              <Skeleton
                variant="line"
                width="80%"
                data-icod-id="src_pages_designsystempage_tsx_54b7" />
            </div>
          </div>
          <div data-icod-id="src_pages_designsystempage_tsx_febf">
            <span
              className="mb-2 block text-xs text-muted-foreground"
              data-icod-id="src_pages_designsystempage_tsx_7424">Card</span>
            <Skeleton variant="card" data-icod-id="src_pages_designsystempage_tsx_5a34" />
          </div>
          <div data-icod-id="src_pages_designsystempage_tsx_936b">
            <span
              className="mb-2 block text-xs text-muted-foreground"
              data-icod-id="src_pages_designsystempage_tsx_0178">Table Row</span>
            <Skeleton variant="tableRow" data-icod-id="src_pages_designsystempage_tsx_df62" />
            <Skeleton variant="tableRow" data-icod-id="src_pages_designsystempage_tsx_4284" />
          </div>
        </div>
      </Section>
      {/* ─── 19. Spinner ─────────────────────────────────────────────────── */}
      <Section title="Spinner" data-icod-id="src_pages_designsystempage_tsx_73ad">
        <div
          className="flex items-end gap-6"
          data-icod-id="src_pages_designsystempage_tsx_48bc">
          <div
            className="flex flex-col items-center gap-2"
            data-icod-id="src_pages_designsystempage_tsx_10d0">
            <Spinner size="sm" data-icod-id="src_pages_designsystempage_tsx_116d" />
            <span
              className="text-xs text-muted-foreground"
              data-icod-id="src_pages_designsystempage_tsx_a80e">sm</span>
          </div>
          <div
            className="flex flex-col items-center gap-2"
            data-icod-id="src_pages_designsystempage_tsx_8983">
            <Spinner size="md" data-icod-id="src_pages_designsystempage_tsx_0b8d" />
            <span
              className="text-xs text-muted-foreground"
              data-icod-id="src_pages_designsystempage_tsx_1503">md</span>
          </div>
          <div
            className="flex flex-col items-center gap-2"
            data-icod-id="src_pages_designsystempage_tsx_da93">
            <Spinner size="lg" data-icod-id="src_pages_designsystempage_tsx_4a76" />
            <span
              className="text-xs text-muted-foreground"
              data-icod-id="src_pages_designsystempage_tsx_1bad">lg</span>
          </div>
        </div>
      </Section>
      {/* ─── Alert variants ──────────────────────────────────────────────── */}
      <Section title="Alert" data-icod-id="src_pages_designsystempage_tsx_db70">
        <div
          className="flex flex-col gap-3"
          data-icod-id="src_pages_designsystempage_tsx_a056">
          <Alert variant="error" data-icod-id="src_pages_designsystempage_tsx_c80d">Something went wrong. Please try again.</Alert>
          <Alert variant="success" data-icod-id="src_pages_designsystempage_tsx_d1db">Changes saved successfully.</Alert>
          <Alert variant="warning" data-icod-id="src_pages_designsystempage_tsx_c12f">Your session expires in 5 minutes.</Alert>
          <Alert variant="info" data-icod-id="src_pages_designsystempage_tsx_cf54">New features are available in the latest update.</Alert>
        </div>
      </Section>
      {/* ─── Input — Left Icon & Sizes ───────────────────────────────────── */}
      <Section title="Input — Left Icon & Sizes" data-icod-id="src_pages_designsystempage_tsx_input_sizes">
        <div
          className="flex items-end gap-4"
          data-icod-id="src_pages_designsystempage_tsx_d651">
          <div className="w-64" data-icod-id="src_pages_designsystempage_tsx_3024">
            <Input
              leftIcon={<Search className="h-4 w-4" data-icod-id="src_pages_designsystempage_tsx_fd7d" />}
              placeholder="Search..."
              size="sm"
              data-icod-id="src_pages_designsystempage_tsx_4e61" />
          </div>
          <div className="w-64" data-icod-id="src_pages_designsystempage_tsx_01eb">
            <Input
              leftIcon={<Search className="h-4 w-4" data-icod-id="src_pages_designsystempage_tsx_85a3" />}
              placeholder="Search..."
              size="md"
              data-icod-id="src_pages_designsystempage_tsx_5ae0" />
          </div>
        </div>
      </Section>
      {/* ─── SidebarNavItem ──────────────────────────────────────────────── */}
      <Section title="SidebarNavItem" data-icod-id="src_pages_designsystempage_tsx_sidebar_nav">
        <div className="flex gap-6" data-icod-id="src_pages_designsystempage_tsx_9575">
          <div
            className="w-[240px] rounded-[var(--radius-lg)] border border-border bg-card p-2"
            data-icod-id="src_pages_designsystempage_tsx_a91f">
            <div
              className="flex flex-col gap-0.5"
              data-icod-id="src_pages_designsystempage_tsx_73cb">
              <SidebarNavItem
                icon={<Home className="h-5 w-5" data-icod-id="src_pages_designsystempage_tsx_a78a" />}
                label="Home"
                active
                data-icod-id="src_pages_designsystempage_tsx_8401" />
              <SidebarNavItem
                icon={<Clock className="h-5 w-5" data-icod-id="src_pages_designsystempage_tsx_9b42" />}
                label="Recents"
                data-icod-id="src_pages_designsystempage_tsx_2a53" />
            </div>
          </div>
          <div
            className="w-[56px] rounded-[var(--radius-lg)] border border-border bg-card p-2"
            data-icod-id="src_pages_designsystempage_tsx_3c2f">
            <div
              className="flex flex-col gap-0.5"
              data-icod-id="src_pages_designsystempage_tsx_06c3">
              <SidebarNavItem
                icon={<Home className="h-5 w-5" data-icod-id="src_pages_designsystempage_tsx_b5aa" />}
                label="Home"
                active
                collapsed
                data-icod-id="src_pages_designsystempage_tsx_a7a6" />
              <SidebarNavItem
                icon={<div
                  className="h-2 w-2 rounded-[var(--radius-sm)]"
                  style={{ backgroundColor: '#2563EB' }}
                  data-icod-id="src_pages_designsystempage_tsx_1423" />}
                label="Product Launch"
                collapsed
                colorDot="#2563EB"
                data-icod-id="src_pages_designsystempage_tsx_f006" />
            </div>
          </div>
        </div>
      </Section>
      {/* ─── Breadcrumbs ─────────────────────────────────────────────────── */}
      <Section title="Breadcrumbs" data-icod-id="src_pages_designsystempage_tsx_breadcrumbs">
        <Breadcrumbs
          items={[{ label: 'Workspace', to: '#' }, { label: 'My Sheet' }]}
          data-icod-id="src_pages_designsystempage_tsx_be52" />
      </Section>
      {/* ─── SelectableCard ──────────────────────────────────────────────── */}
      <Section title="SelectableCard" data-icod-id="ds_selectablecard_section">
        <div className="space-y-4" data-icod-id="ds_selectablecard_wrap">
          <p className="text-sm text-muted-foreground" data-icod-id="ds_selectablecard_desc">
            A radio-group card for selecting from a set of options. Keyboard accessible (Enter/Space).
          </p>
          <SelectableCardDemo data-icod-id="ds_selectablecard_demo" />
        </div>
      </Section>
      {/* ─── PageHeader ──────────────────────────────────────────────────── */}
      <Section title="PageHeader" data-icod-id="src_pages_designsystempage_tsx_pageheader">
        <div
          className="rounded-[var(--radius-lg)] border border-border bg-card p-4"
          data-icod-id="src_pages_designsystempage_tsx_c990">
          <PageHeader
            title="Page Title"
            description="Optional description text"
            actions={<Button size="sm" data-icod-id="src_pages_designsystempage_tsx_43de">Action</Button>}
            data-icod-id="src_pages_designsystempage_tsx_4c2c" />
        </div>
      </Section>
      {/* ─── SectionHeader ───────────────────────────────────────────────── */}
      <Section title="SectionHeader" data-icod-id="src_pages_designsystempage_tsx_sectionheader">
        <div
          className="rounded-[var(--radius-lg)] border border-border bg-card p-4"
          data-icod-id="src_pages_designsystempage_tsx_0ed2">
          <SectionHeader
            title="Section Title"
            actions={<Button
              variant="ghost"
              size="sm"
              data-icod-id="src_pages_designsystempage_tsx_5733">View all</Button>}
            data-icod-id="src_pages_designsystempage_tsx_6fc6" />
        </div>
      </Section>
      {/* ─── DataTable ────────────────────────────────────────────────────── */}
      <Section title="DataTable" data-icod-id="ds_datatable_section">
        <div className="space-y-6" data-icod-id="ds_datatable_wrap">
          {/* Sample table with 3 rows */}
          <div data-icod-id="ds_datatable_sample">
            <span
              className="mb-2 block text-xs text-muted-foreground"
              data-icod-id="ds_datatable_sample_label">With data (3 rows)</span>
            <Card className="overflow-hidden p-0" data-icod-id="ds_datatable_card">
              <DataTable
                columns={[
                  { key: 'name', header: 'Name', cell: (r: { name: string; role: string; status: string }) => <span
                    className="font-medium text-foreground"
                    data-icod-id="src_pages_designsystempage_tsx_04a8">{r.name}</span> },
                  { key: 'role', header: 'Role', cell: (r: { name: string; role: string; status: string }) => <Badge
                    variant={r.role === 'Admin' ? 'status-blue' : 'neutral'}
                    data-icod-id="src_pages_designsystempage_tsx_cf63">{r.role}</Badge> },
                  { key: 'status', header: 'Status', cell: (r: { name: string; role: string; status: string }) => <Badge
                    variant={r.status === 'Active' ? 'status-green' : 'status-gray'}
                    data-icod-id="src_pages_designsystempage_tsx_be8e">{r.status}</Badge> },
                ] as DataTableColumn<{ name: string; role: string; status: string }>[]}
                rows={[
                  { name: 'Alice Johnson', role: 'Admin', status: 'Active' },
                  { name: 'Bob Smith', role: 'Member', status: 'Active' },
                  { name: 'Charlie Brown', role: 'Member', status: 'Deactivated' },
                ]}
                rowKey={(r) => r.name}
                data-icod-id="ds_datatable_instance" />
            </Card>
          </div>
          {/* Loading state */}
          <div data-icod-id="ds_datatable_loading">
            <span
              className="mb-2 block text-xs text-muted-foreground"
              data-icod-id="ds_datatable_loading_label">Loading state</span>
            <Card className="overflow-hidden p-0" data-icod-id="ds_datatable_loading_card">
              <DataTable
                columns={[
                  { key: 'name', header: 'Name', cell: () => null },
                  { key: 'role', header: 'Role', cell: () => null },
                  { key: 'status', header: 'Status', cell: () => null },
                ]}
                rows={[]}
                rowKey={() => ''}
                loading
                data-icod-id="ds_datatable_loading_instance" />
            </Card>
          </div>
          {/* Empty state */}
          <div data-icod-id="ds_datatable_empty">
            <span
              className="mb-2 block text-xs text-muted-foreground"
              data-icod-id="ds_datatable_empty_label">Empty state</span>
            <Card className="overflow-hidden p-0" data-icod-id="ds_datatable_empty_card">
              <DataTable
                columns={[
                  { key: 'name', header: 'Name', cell: () => null },
                  { key: 'role', header: 'Role', cell: () => null },
                ]}
                rows={[]}
                rowKey={() => ''}
                emptyState={
                  <EmptyState
                    icon={Search}
                    title="No results"
                    description="Try adjusting your search."
                    data-icod-id="ds_datatable_empty_state" />
                }
                data-icod-id="ds_datatable_empty_instance" />
            </Card>
          </div>
        </div>
      </Section>
      {/* ─── Pagination ───────────────────────────────────────────────────── */}
      <Section title="Pagination" data-icod-id="ds_pagination_section">
        <Card className="p-4" data-icod-id="ds_pagination_card">
          <Pagination
            page={2}
            totalPages={5}
            total={47}
            pageSize={10}
            onPageChange={() => {}}
            data-icod-id="ds_pagination_instance" />
        </Card>
      </Section>
      {/* ─── CopyField ────────────────────────────────────────────────────── */}
      <Section title="CopyField" data-icod-id="ds_copyfield_section">
        <div className="max-w-md" data-icod-id="ds_copyfield_wrap">
          <CopyField
             value="https://app.neo.com/invite/abc123xyz"
            label="Invitation link"
            data-icod-id="ds_copyfield_instance" />
        </div>
      </Section>
      {/* ─── PasswordRequirements ─────────────────────────────────────────── */}
      <Section title="PasswordRequirements" data-icod-id="ds_pwreq_section">
        <div className="max-w-sm" data-icod-id="ds_pwreq_wrap">
          <PasswordRequirements
            password="Test1"
            data-icod-id="ds_pwreq_instance" />
        </div>
      </Section>
      {/* ─── PageContainer ────────────────────────────────────────────────── */}
      <Section title="PageContainer" data-icod-id="ds_pagecontainer_section">
        <div
          className="rounded-[var(--radius-lg)] border border-border bg-muted/50"
          data-icod-id="ds_pagecontainer_outer">
          <PageContainer data-icod-id="ds_pagecontainer_instance">
            <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-gray-400)] p-6 text-center text-sm text-[var(--color-gray-600)]" data-icod-id="ds_pagecontainer_content">
              Sample content inside PageContainer (max-w-6xl, px-6 py-6 / xl:px-8 xl:py-8)
            </div>
          </PageContainer>
        </div>
      </Section>
      {/* ─── WorkspaceIcon ────────────────────────────────────────────────── */}
      <Section title="WorkspaceIcon" data-icod-id="ds_workspaceicon_section">
        <div className="space-y-4" data-icod-id="ds_workspaceicon_wrap">
          <div data-icod-id="ds_workspaceicon_sm">
            <span
              className="mb-2 block text-xs text-muted-foreground"
              data-icod-id="ds_workspaceicon_sm_label">Small (20×20px — sidebar)</span>
            <div className="flex items-center gap-4" data-icod-id="ds_workspaceicon_sm_row">
              <WorkspaceIcon name="Product Launch" color="var(--status-blue)" size="sm" data-icod-id="ds_workspaceicon_sm_blue" />
              <WorkspaceIcon name="Q3 Planning" color="var(--status-green)" size="sm" data-icod-id="ds_workspaceicon_sm_green" />
              <WorkspaceIcon name="Design System" color="var(--status-yellow)" size="sm" data-icod-id="ds_workspaceicon_sm_yellow" />
            </div>
          </div>
          <div data-icod-id="ds_workspaceicon_md">
            <span
              className="mb-2 block text-xs text-muted-foreground"
              data-icod-id="ds_workspaceicon_md_label">Medium (32×32px — cards)</span>
            <div className="flex items-center gap-4" data-icod-id="ds_workspaceicon_md_row">
              <WorkspaceIcon name="Product Launch" color="var(--status-blue)" size="md" data-icod-id="ds_workspaceicon_md_blue" />
              <WorkspaceIcon name="Q3 Planning" color="var(--status-green)" size="md" data-icod-id="ds_workspaceicon_md_green" />
              <WorkspaceIcon name="Design System" color="var(--status-yellow)" size="md" data-icod-id="ds_workspaceicon_md_yellow" />
            </div>
          </div>
        </div>
      </Section>
      {/* ─── ColorPicker ──────────────────────────────────────────────────── */}
      <Section title="ColorPicker" data-icod-id="ds_colorpicker_section">
        <div className="space-y-4" data-icod-id="ds_colorpicker_wrap">
          <ColorPickerDemo data-icod-id="src_pages_designsystempage_tsx_a864" />
        </div>
      </Section>
      {/* ─── Shared Components ────────────────────────────────────────────── */}
      <Section title="Shared Components" data-icod-id="ds_shared_section">
        <div className="space-y-6" data-icod-id="ds_shared_wrap">
          {/* FavoritesStar */}
          <div data-icod-id="ds_shared_favorites">
            <span className="mb-2 block text-xs text-muted-foreground" data-icod-id="ds_shared_favorites_label">FavoritesStar — starred and unstarred states</span>
            <div className="flex items-center gap-4" data-icod-id="ds_shared_favorites_row">
              <FavoritesStar isFavorite={false} onToggle={() => {}} data-icod-id="ds_shared_fav_unstarred" />
              <FavoritesStar isFavorite={true} onToggle={() => {}} data-icod-id="ds_shared_fav_starred" />
              <FavoritesStar isFavorite={false} onToggle={() => {}} size="sm" data-icod-id="ds_shared_fav_sm_unstarred" />
              <FavoritesStar isFavorite={true} onToggle={() => {}} size="sm" data-icod-id="ds_shared_fav_sm_starred" />
            </div>
          </div>
          {/* RelativeTime */}
          <div data-icod-id="ds_shared_reltime">
            <span className="mb-2 block text-xs text-muted-foreground" data-icod-id="ds_shared_reltime_label">RelativeTime — sample past timestamp</span>
            <div className="flex items-center gap-4" data-icod-id="ds_shared_reltime_row">
              <RelativeTime date={new Date(Date.now() - 60_000).toISOString()} data-icod-id="ds_shared_reltime_1m" />
              <RelativeTime date={new Date(Date.now() - 3_600_000).toISOString()} data-icod-id="ds_shared_reltime_1h" />
              <RelativeTime date={new Date(Date.now() - 86_400_000).toISOString()} data-icod-id="ds_shared_reltime_1d" />
              <RelativeTime date={new Date(Date.now() - 604_800_000).toISOString()} data-icod-id="ds_shared_reltime_7d" />
            </div>
          </div>
          {/* SheetIcon */}
          <div data-icod-id="ds_shared_sheeticon">
            <span className="mb-2 block text-xs text-muted-foreground" data-icod-id="ds_shared_sheeticon_label">SheetIcon — default and custom sizes</span>
            <div className="flex items-center gap-4" data-icod-id="ds_shared_sheeticon_row">
              <SheetIcon data-icod-id="ds_shared_sheeticon_default" />
              <SheetIcon className="h-6 w-6" data-icod-id="ds_shared_sheeticon_lg" />
              <SheetIcon className="h-8 w-8" data-icod-id="ds_shared_sheeticon_xl" />
            </div>
          </div>
          {/* DatePicker */}
          <div data-icod-id="ds_shared_datepicker">
            <span className="mb-2 block text-xs text-muted-foreground" data-icod-id="ds_shared_datepicker_label">DatePicker — native date input styled with tokens</span>
            <div className="flex items-center gap-4" data-icod-id="ds_shared_datepicker_row">
              <DatePicker
                value=""
                onChange={() => {}}
                data-icod-id="src_pages_designsystempage_tsx_2b9a" />
              <DatePicker
                value="2025-01-15"
                onChange={() => {}}
                data-icod-id="src_pages_designsystempage_tsx_30af" />
              <DatePicker
                value="2025-06-01"
                onChange={() => {}}
                disabled
                data-icod-id="src_pages_designsystempage_tsx_3eca" />
            </div>
          </div>
          {/* CalendarDatePicker */}
          <div data-icod-id="ds_shared_calendardatepicker">
            <span className="mb-2 block text-xs text-muted-foreground" data-icod-id="ds_shared_calendardatepicker_label">CalendarDatePicker — floating calendar popover</span>
            <CalendarDatePickerDemo data-icod-id="ds_shared_calendardatepicker_instance" />
          </div>
          {/* ContactField */}
          <div data-icod-id="ds_contactfield_section">
            <span className="mb-2 block text-xs text-muted-foreground" data-icod-id="ds_contactfield_label">ContactField — searchable member picker with avatar display</span>
            <ContactFieldDemo data-icod-id="ds_contactfield_instance" />
          </div>
          {/* DateField */}
          <div data-icod-id="ds_datefield_section">
            <span className="mb-2 block text-xs text-muted-foreground" data-icod-id="ds_datefield_label">DateField — styled date trigger with calendar popover</span>
            <DateFieldDemo data-icod-id="ds_datefield_instance" />
          </div>
          {/* ColorSwatchPicker */}
          <div data-icod-id="ds_colorswatch_section">
            <span className="mb-2 block text-xs text-muted-foreground" data-icod-id="ds_colorswatch_label">ColorSwatchPicker — portal-rendered color palette popover for text/fill colors</span>
            <ColorSwatchPickerDemo data-icod-id="ds_colorswatch_instance" />
            {/* Palette token swatches */}
            <div className="mt-6" data-icod-id="ds_palette_tokens">
              <span className="mb-2 block text-xs text-muted-foreground" data-icod-id="ds_palette_tokens_label">Palette design tokens (var(--palette-*))</span>
              <PaletteTokenSwatches data-icod-id="ds_palette_tokens_instance" />
            </div>
          </div>
          {/* Pill */}
          <div data-icod-id="ds_shared_pill">
            <span className="mb-2 block text-xs text-muted-foreground" data-icod-id="ds_shared_pill_label">Pill — colored status labels</span>
            <div className="flex flex-wrap items-center gap-2" data-icod-id="ds_shared_pill_row">
              <Pill
                label="Not Started"
                color="gray"
                data-icod-id="src_pages_designsystempage_tsx_ef5e" />
              <Pill
                label="In Progress"
                color="blue"
                data-icod-id="src_pages_designsystempage_tsx_92e8" />
              <Pill
                label="Complete"
                color="green"
                data-icod-id="src_pages_designsystempage_tsx_0be2" />
              <Pill
                label="Blocked"
                color="red"
                data-icod-id="src_pages_designsystempage_tsx_e175" />
              <Pill
                label="Review"
                color="yellow"
                data-icod-id="src_pages_designsystempage_tsx_ac7d" />
              <Pill
                label="Feature"
                color="purple"
                data-icod-id="src_pages_designsystempage_tsx_aff5" />
            </div>
          </div>
          {/* SaveIndicator */}
          <div data-icod-id="ds_shared_saveindicator">
            <span className="mb-2 block text-xs text-muted-foreground" data-icod-id="ds_shared_si_label">SaveIndicator — saving, saved, and error states</span>
            <div className="flex items-center gap-6" data-icod-id="ds_shared_si_row">
              <SaveIndicator
                saving={true}
                error={null}
                data-icod-id="src_pages_designsystempage_tsx_fb3d" />
              <SaveIndicator
                saving={false}
                error={null}
                data-icod-id="src_pages_designsystempage_tsx_0604" />
              <SaveIndicator
                saving={false}
                error="Failed to save"
                data-icod-id="src_pages_designsystempage_tsx_c9da" />
            </div>
          </div>
        </div>
      </Section>
      {/* ─── Toolbar & ToggleButton ──────────────────────────────────────── */}
      <Section title="Toolbar & ToggleButton" data-icod-id="ds_toolbar_section">
        <div className="space-y-6" data-icod-id="ds_toolbar_wrap">
          {/* Active toolbar */}
          <div data-icod-id="ds_toolbar_active">
            <span className="mb-2 block text-xs text-muted-foreground" data-icod-id="ds_toolbar_active_label">Toolbar with font selects, toggle buttons, and clear action</span>
            <ToolbarDemo data-icod-id="ds_toolbar_active_instance" />
          </div>
          {/* Disabled toolbar */}
          <div data-icod-id="ds_toolbar_disabled">
            <span className="mb-2 block text-xs text-muted-foreground" data-icod-id="ds_toolbar_disabled_label">Disabled toolbar (viewer mode)</span>
            <Toolbar disabled data-icod-id="ds_toolbar_disabled_instance">
              <ToolbarGroup data-icod-id="src_pages_designsystempage_tsx_f48e">
                <ToggleButton
                  pressed={false}
                  onToggle={() => {}}
                  tooltip="Bold"
                  icon={<Bold className="h-4 w-4" data-icod-id="src_pages_designsystempage_tsx_c4c9" />}
                  size="sm"
                  data-icod-id="src_pages_designsystempage_tsx_999c" />
                <ToggleButton
                  pressed={true}
                  onToggle={() => {}}
                  tooltip="Italic"
                  icon={<Italic className="h-4 w-4" data-icod-id="src_pages_designsystempage_tsx_5340" />}
                  size="sm"
                  data-icod-id="src_pages_designsystempage_tsx_b2bb" />
              </ToolbarGroup>
              <ToolbarGroup data-icod-id="src_pages_designsystempage_tsx_0e1a">
                <IconButton
                  size="sm"
                  tooltip="Clear"
                  data-icod-id="src_pages_designsystempage_tsx_3628"><Eraser
                  className="h-3.5 w-3.5"
                  data-icod-id="src_pages_designsystempage_tsx_8a93" /></IconButton>
              </ToolbarGroup>
              <div className="flex-1" data-icod-id="src_pages_designsystempage_tsx_79d9" />
            </Toolbar>
          </div>
        </div>
      </Section>
      {/* ─── Grid Components ──────────────────────────────────────────────── */}
      <Section title="Grid Components" data-icod-id="ds_grid_components_section">
        <div className="space-y-6" data-icod-id="ds_grid_components_wrap">
          <p className="text-sm text-muted-foreground" data-icod-id="ds_grid_components_desc">
            These components are internal to the sheet grid feature. They are shown here for reference only.
          </p>
          {/* ColumnPropertiesModal demo */}
          <div data-icod-id="ds_grid_col_props_demo">
            <span className="mb-2 block text-xs text-muted-foreground" data-icod-id="ds_grid_col_props_label">ColumnPropertiesModal — unified column editor</span>
            <ColumnPropertiesModalDemo data-icod-id="ds_grid_col_props_instance" />
          </div>
        </div>
      </Section>
      {/* ─── ResizeHandle ────────────────────────────────────────────────────── */}
      <Section title="ResizeHandle" data-icod-id="ds_resizehandle_section">
        <div className="space-y-6" data-icod-id="ds_resizehandle_wrap">
          <p className="text-sm text-muted-foreground" data-icod-id="ds_resizehandle_desc">
            Drag handle used for column and row resizing in the sheet grid. Hover to see the teal highlight.
          </p>
          {/* Column resize demo */}
          <div data-icod-id="ds_resizehandle_column">
            <span className="mb-2 block text-xs text-muted-foreground" data-icod-id="ds_resizehandle_col_label">Column resize (vertical bar on right edge)</span>
            <div
              className="relative h-10 w-48 rounded-[var(--radius-sm)] border border-border bg-card"
              data-icod-id="ds_resizehandle_col_box">
              <span className="flex h-full items-center px-3 text-xs text-muted-foreground" data-icod-id="ds_resizehandle_col_text">Header cell</span>
              <ResizeHandle direction="column" onDragStart={() => {}} data-icod-id="ds_resizehandle_col_handle" />
            </div>
          </div>
          {/* Row resize demo */}
          <div data-icod-id="ds_resizehandle_row">
            <span className="mb-2 block text-xs text-muted-foreground" data-icod-id="ds_resizehandle_row_label">Row resize (horizontal bar on bottom edge)</span>
            <div
              className="relative flex h-10 w-48 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-card"
              data-icod-id="ds_resizehandle_row_box">
              <span className="text-xs text-muted-foreground" data-icod-id="ds_resizehandle_row_text">Row number</span>
              <ResizeHandle direction="row" onDragStart={() => {}} data-icod-id="ds_resizehandle_row_handle" />
            </div>
          </div>
          {/* Disabled state */}
          <div data-icod-id="ds_resizehandle_disabled">
            <span className="mb-2 block text-xs text-muted-foreground" data-icod-id="ds_resizehandle_dis_label">Disabled (viewer mode — no handle rendered)</span>
            <div
              className="relative h-10 w-48 rounded-[var(--radius-sm)] border border-border bg-card"
              data-icod-id="ds_resizehandle_dis_box">
              <span className="flex h-full items-center px-3 text-xs text-muted-foreground" data-icod-id="ds_resizehandle_dis_text">Viewer header</span>
              <ResizeHandle direction="column" onDragStart={() => {}} disabled data-icod-id="ds_resizehandle_dis_handle" />
            </div>
          </div>
        </div>
      </Section>
      {/* ─── Settings Components ───────────────────────────────────────────── */}
      <Section title="Settings Components" data-icod-id="ds_settings_components_section">
        <div className="space-y-6" data-icod-id="ds_settings_components_wrap">
          {/* ColorSwatchGroup demo */}
          <div data-icod-id="ds_colorswatchgroup_demo">
            <span className="mb-2 block text-xs text-muted-foreground" data-icod-id="ds_colorswatchgroup_label">ColorSwatchGroup — accent color selection swatches</span>
            <ColorSwatchGroupDemo data-icod-id="ds_colorswatchgroup_instance" />
          </div>
          {/* SettingsLayout structure demo */}
          <div data-icod-id="ds_settingslayout_demo">
            <span className="mb-2 block text-xs text-muted-foreground" data-icod-id="ds_settingslayout_label">SettingsLayout — two-panel settings shell (static demo)</span>
            <div
              className="h-64 overflow-hidden rounded-[var(--radius-lg)] border border-border"
              data-icod-id="ds_settingslayout_container">
              <SettingsLayout
                navGroups={[
                  { groupLabel: 'Preferences', items: [{ label: 'Appearance', route: '#' }] },
                  { groupLabel: 'Administration', items: [{ label: 'Users', route: '#' }] },
                ] as SettingsNavGroup[]}
                data-icod-id="ds_settingslayout_instance">
                <div className="text-sm text-muted-foreground" data-icod-id="ds_settingslayout_content">
                  Content area renders here.
                </div>
              </SettingsLayout>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

/* ─── ColorPicker interactive demo ──────────────────────────────────────── */
function ColorPickerDemo() {
  const [color, setColor] = useState('#0ea5e9');
  return (
    <div
      className="flex flex-col gap-3"
      data-icod-id="src_pages_designsystempage_tsx_340e">
      <span
        className="text-xs text-muted-foreground"
        data-icod-id="src_pages_designsystempage_tsx_3b4d">Interactive color picker for workspace branding</span>
      <ColorPicker
        value={color}
        onChange={setColor}
        data-icod-id="src_pages_designsystempage_tsx_a132" />
      <span
        className="text-xs text-muted-foreground"
        data-icod-id="src_pages_designsystempage_tsx_bfa2">Selected: {color}</span>
    </div>
  );
}

/* ─── UserPicker demo — idle state ────────────────────────────────────── */
function UserPickerDemoIdle() {
  const [value, setValue] = useState<UserOption | null>(null);
  const mockSearch = async (_q: string): Promise<UserOption[]> => [];
  return (
    <UserPicker
      value={value}
      onChange={setValue}
      onSearch={mockSearch}
      containerClassName="max-w-sm"
      data-icod-id="src_pages_designsystempage_tsx_7ef8" />
  );
}

/* ─── UserPicker demo — populated state ───────────────────────────────── */
const DEMO_USERS: UserOption[] = [
  { id: '1', fullName: 'Alice Johnson', email: 'alice@example.com' },
  { id: '2', fullName: 'Bob Smith', email: 'bob@example.com' },
  { id: '3', fullName: 'Charlie Brown', email: 'charlie@example.com' },
];

function UserPickerDemoPopulated() {
  const [value, setValue] = useState<UserOption | null>(DEMO_USERS[0]);
  const mockSearch = async (q: string): Promise<UserOption[]> =>
    DEMO_USERS.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q.toLowerCase()) ||
        u.email.toLowerCase().includes(q.toLowerCase()),
    );
  return (
    <UserPicker
      value={value}
      onChange={setValue}
      onSearch={mockSearch}
      containerClassName="max-w-sm"
      data-icod-id="src_pages_designsystempage_tsx_f168" />
  );
}

/* ─── RoleMenu demos ───────────────────────────────────────────────────── */
function RoleMenuDemoAdmin() {
  const [role, setRole] = useState<RoleValue>('admin');
  return (
    <RoleMenu
      value={role}
      onChange={setRole}
      onRemove={() => {}}
      data-icod-id="src_pages_designsystempage_tsx_5140" />
  );
}

function RoleMenuDemoEditor() {
  const [role, setRole] = useState<RoleValue>('editor');
  return (
    <RoleMenu
      value={role}
      onChange={setRole}
      data-icod-id="src_pages_designsystempage_tsx_c047" />
  );
}

function RoleMenuDemoViewer() {
  const [role, setRole] = useState<RoleValue>('viewer');
  return (
    <RoleMenu
      value={role}
      onChange={setRole}
      onLeave={() => {}}
      data-icod-id="src_pages_designsystempage_tsx_269c" />
  );
}

/* ─── ColumnPropertiesModal demo ──────────────────────────────────────── */
function ColumnPropertiesModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="flex flex-col gap-3"
      data-icod-id="src_pages_designsystempage_tsx_3903">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        data-icod-id="src_pages_designsystempage_tsx_1c3f">
        Open Column Properties Modal
      </Button>
      <ColumnPropertiesModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={(data: { name: string; type: string; options?: DropdownOption[] }) => {
          // no-op in design system demo
          console.log('Column properties saved:', data);
          setOpen(false);
        }}
        initialName="Status"
        initialType="dropdown"
        initialOptions={[
          { label: 'Not Started', color: 'gray' },
          { label: 'In Progress', color: 'blue' },
          { label: 'Complete', color: 'green' },
        ]}
        existingCellCount={12}
        data-icod-id="src_pages_designsystempage_tsx_8b4e" />
    </div>
  );
}

/* ─── Toolbar interactive demo ──────────────────────────────────────────── */
function ToolbarDemo() {
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(true);
  const [underline, setUnderline] = useState(false);
  const [strikethrough, setStrikethrough] = useState(false);
  const [fontFamily, setFontFamily] = useState('default');
  const [fontSize, setFontSize] = useState('');
  const [textColor, setTextColor] = useState<string | null>(null);
  const [fillColor, setFillColor] = useState<string | null>(null);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | null>(null);
  const [verticalAlign, setVerticalAlign] = useState<'top' | 'middle' | 'bottom' | null>(null);
  const [wrapText, setWrapText] = useState(false);
  const textColorBtnRef = useRef<HTMLButtonElement>(null);
  const fillColorBtnRef = useRef<HTMLButtonElement>(null);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [fillColorOpen, setFillColorOpen] = useState(false);

  return (
    <Toolbar data-icod-id="src_pages_designsystempage_tsx_4d1c">
      <ToolbarGroup data-icod-id="src_pages_designsystempage_tsx_4c6c">
        <select
          className={inputClass('h-7 text-xs py-0')}
          style={{ minWidth: '140px', width: '140px' }}
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          aria-label="Font family"
          data-icod-id="src_pages_designsystempage_tsx_adf6">
          <option value="default" data-icod-id="src_pages_designsystempage_tsx_77b8">Default</option>
          <option value="Arial" data-icod-id="src_pages_designsystempage_tsx_8ef3">Arial</option>
          <option value="Georgia" data-icod-id="src_pages_designsystempage_tsx_a133">Georgia</option>
          <option value="Courier New" data-icod-id="src_pages_designsystempage_tsx_8a90">Courier New</option>
        </select>
        <select
          className={inputClass('h-7 text-xs py-0')}
          style={{ minWidth: '72px', width: '72px' }}
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          aria-label="Font size"
          data-icod-id="src_pages_designsystempage_tsx_bbac">
          <option value="" data-icod-id="src_pages_designsystempage_tsx_3af0">Auto</option>
          <option value="10" data-icod-id="ds_toolbar_size_10">10</option>
          <option value="11" data-icod-id="ds_toolbar_size_11">11</option>
          <option value="12" data-icod-id="src_pages_designsystempage_tsx_63c3">12</option>
          <option value="13" data-icod-id="ds_toolbar_size_13">13</option>
          <option value="14" data-icod-id="src_pages_designsystempage_tsx_0aa3">14</option>
          <option value="16" data-icod-id="src_pages_designsystempage_tsx_0150">16</option>
          <option value="18" data-icod-id="ds_toolbar_size_18">18</option>
          <option value="20" data-icod-id="ds_toolbar_size_20">20</option>
        </select>
      </ToolbarGroup>
      <ToolbarGroup data-icod-id="src_pages_designsystempage_tsx_b98b">
        <ToggleButton
          pressed={bold}
          onToggle={() => setBold(!bold)}
          tooltip="Bold (Ctrl+B)"
          icon={<Bold className="h-4 w-4" data-icod-id="src_pages_designsystempage_tsx_30ab" />}
          size="sm"
          data-icod-id="src_pages_designsystempage_tsx_4df5" />
        <ToggleButton
          pressed={italic}
          onToggle={() => setItalic(!italic)}
          tooltip="Italic (Ctrl+I)"
          icon={<Italic className="h-4 w-4" data-icod-id="src_pages_designsystempage_tsx_bf0b" />}
          size="sm"
          data-icod-id="src_pages_designsystempage_tsx_d954" />
        <ToggleButton
          pressed={underline}
          onToggle={() => setUnderline(!underline)}
          tooltip="Underline (Ctrl+U)"
          icon={<Underline className="h-4 w-4" data-icod-id="src_pages_designsystempage_tsx_fd56" />}
          size="sm"
          data-icod-id="src_pages_designsystempage_tsx_f38a" />
        <ToggleButton
          pressed={strikethrough}
          onToggle={() => setStrikethrough(!strikethrough)}
          tooltip="Strikethrough"
          icon={<Strikethrough className="h-4 w-4" data-icod-id="src_pages_designsystempage_tsx_d98b" />}
          size="sm"
          data-icod-id="src_pages_designsystempage_tsx_f877" />
      </ToolbarGroup>
      {/* Group A: Text color & Fill color */}
      <ToolbarGroup data-icod-id="ds_toolbar_colors">
        <div className="relative" data-icod-id="ds_textcolor_wrap">
          <button
            ref={textColorBtnRef}
            type="button"
            className="inline-flex h-6 flex-col items-center justify-center rounded-[var(--radius-sm)] px-1 transition-colors hover:bg-muted"
            onClick={() => setTextColorOpen(!textColorOpen)}
            onMouseDown={(e) => e.preventDefault()}
            aria-label="Text color"
            title="Text color"
            data-icod-id="ds_textcolor_btn"
          >
            <span className="relative" data-icod-id="src_pages_designsystempage_tsx_ccd9">
              <Type
                className="h-3.5 w-3.5"
                data-icod-id="src_pages_designsystempage_tsx_fb86" />
              <span
                className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: textColor || '#CBD5E1' }}
                data-icod-id="ds_textcolor_bar"
              />
            </span>
          </button>
          {textColorOpen && (
            <ColorSwatchPicker
              anchorRef={textColorBtnRef}
              value={textColor}
              onChange={(hex) => setTextColor(hex)}
              onClose={() => setTextColorOpen(false)}
              data-icod-id="src_pages_designsystempage_tsx_418b" />
          )}
        </div>
        <div className="relative" data-icod-id="ds_fillcolor_wrap">
          <button
            ref={fillColorBtnRef}
            type="button"
            className="inline-flex h-6 flex-col items-center justify-center rounded-[var(--radius-sm)] px-1 transition-colors hover:bg-muted"
            onClick={() => setFillColorOpen(!fillColorOpen)}
            onMouseDown={(e) => e.preventDefault()}
            aria-label="Fill color"
            title="Fill color"
            data-icod-id="ds_fillcolor_btn"
          >
            <span className="relative" data-icod-id="src_pages_designsystempage_tsx_459c">
              <PaintBucket
                className="h-3.5 w-3.5"
                data-icod-id="src_pages_designsystempage_tsx_9edf" />
              <span
                className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: fillColor || '#CBD5E1' }}
                data-icod-id="ds_fillcolor_bar"
              />
            </span>
          </button>
          {fillColorOpen && (
            <ColorSwatchPicker
              anchorRef={fillColorBtnRef}
              value={fillColor}
              onChange={(hex) => setFillColor(hex)}
              onClose={() => setFillColorOpen(false)}
              data-icod-id="src_pages_designsystempage_tsx_c97f" />
          )}
        </div>
      </ToolbarGroup>
      {/* Group B: Horizontal alignment */}
      <ToolbarGroup data-icod-id="ds_toolbar_halign">
        <ToggleButton
          pressed={textAlign === 'left'}
          onToggle={() => setTextAlign(textAlign === 'left' ? null : 'left')}
          tooltip="Align Left"
          icon={<AlignLeft
            className="h-3.5 w-3.5"
            data-icod-id="src_pages_designsystempage_tsx_8847" />}
          size="sm"
          data-icod-id="ds_align_left" />
        <ToggleButton
          pressed={textAlign === 'center'}
          onToggle={() => setTextAlign(textAlign === 'center' ? null : 'center')}
          tooltip="Align Center"
          icon={<AlignCenter
            className="h-3.5 w-3.5"
            data-icod-id="src_pages_designsystempage_tsx_b286" />}
          size="sm"
          data-icod-id="ds_align_center" />
        <ToggleButton
          pressed={textAlign === 'right'}
          onToggle={() => setTextAlign(textAlign === 'right' ? null : 'right')}
          tooltip="Align Right"
          icon={<AlignRight
            className="h-3.5 w-3.5"
            data-icod-id="src_pages_designsystempage_tsx_8d7f" />}
          size="sm"
          data-icod-id="ds_align_right" />
      </ToolbarGroup>
      {/* Group C: Vertical alignment */}
      <ToolbarGroup data-icod-id="ds_toolbar_valign">
        <DropdownMenu
          skipRestoreFocus
          trigger={
            <button
              type="button"
              className="inline-flex h-6 items-center gap-0.5 rounded-[var(--radius-sm)] px-1 transition-colors hover:bg-muted"
              onMouseDown={(e) => e.preventDefault()}
              aria-label="Vertical alignment"
              title="Vertical alignment"
              data-icod-id="ds_valign_btn"
            >
              <AlignCenter
                className="h-3.5 w-3.5"
                data-icod-id="src_pages_designsystempage_tsx_2705" />
              <ChevronDown
                className="h-2.5 w-2.5 text-muted-foreground"
                data-icod-id="src_pages_designsystempage_tsx_098e" />
            </button>
          }
          items={[
            {
              label: 'Top',
              icon: <AlignTopIcon
                className="h-3.5 w-3.5"
                data-icod-id="src_pages_designsystempage_tsx_91f9" />,
              onClick: () => setVerticalAlign(verticalAlign === 'top' ? null : 'top'),
            },
            {
              label: 'Middle',
              icon: <AlignCenter
                className="h-3.5 w-3.5"
                data-icod-id="src_pages_designsystempage_tsx_77eb" />,
              onClick: () => setVerticalAlign(verticalAlign === 'middle' ? null : 'middle'),
            },
            {
              label: 'Bottom',
              icon: <AlignBottomIcon
                className="h-3.5 w-3.5"
                data-icod-id="src_pages_designsystempage_tsx_c565" />,
              onClick: () => setVerticalAlign(verticalAlign === 'bottom' ? null : 'bottom'),
            },
          ] as DropdownMenuItem[]}
          data-icod-id="src_pages_designsystempage_tsx_82db" />
      </ToolbarGroup>
      {/* Group D: Wrap text */}
      <ToolbarGroup data-icod-id="ds_toolbar_wraptext">
        <ToggleButton
          pressed={wrapText}
          onToggle={() => setWrapText(!wrapText)}
          tooltip="Wrap text"
          icon={<WrapText
            className="h-3.5 w-3.5"
            data-icod-id="src_pages_designsystempage_tsx_4152" />}
          size="sm"
          data-icod-id="ds_wraptext_btn" />
      </ToolbarGroup>
      <ToolbarGroup data-icod-id="src_pages_designsystempage_tsx_96d0">
        <IconButton
          size="sm"
          tooltip="Clear formatting"
          onClick={() => { setBold(false); setItalic(false); setUnderline(false); setStrikethrough(false); setFontFamily('default'); setFontSize(''); setTextColor(null); setFillColor(null); setTextAlign(null); setVerticalAlign(null); setWrapText(false); }}
          data-icod-id="src_pages_designsystempage_tsx_63be"><Eraser
          className="h-3.5 w-3.5"
          data-icod-id="src_pages_designsystempage_tsx_8803" /></IconButton>
      </ToolbarGroup>
      <div className="flex-1" data-icod-id="src_pages_designsystempage_tsx_3702" />
    </Toolbar>
  );
}

/* ─── CalendarDatePicker interactive demo ─────────────────────────────── */
function CalendarDatePickerDemo() {
  const [date, setDate] = useState<string | null>('2025-01-15');
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <div
      className="flex items-center gap-4"
      data-icod-id="src_pages_designsystempage_tsx_627b">
      <div
        ref={anchorRef}
        className="relative"
        data-icod-id="src_pages_designsystempage_tsx_7805">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpen(!open)}
          data-icod-id="src_pages_designsystempage_tsx_4971">
          {date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pick a date'}
        </Button>
        {open && (
          <CalendarDatePicker
            value={date}
            onChange={(val) => {
              setDate(val);
              setOpen(false);
            }}
            onClose={() => setOpen(false)}
            anchorRef={anchorRef}
            data-icod-id="src_pages_designsystempage_tsx_460a" />
        )}
      </div>
      <span
        className="text-xs text-muted-foreground"
        data-icod-id="src_pages_designsystempage_tsx_9310">Selected: {date ?? 'none'}</span>
    </div>
  );
}

/* ─── ContactField interactive demo ────────────────────────────────────── */
const DEMO_MEMBERS: WorkspaceMember[] = [
  { id: 'm1', fullName: 'Alice Johnson', email: 'alice@example.com' },
  { id: 'm2', fullName: 'Bob Smith', email: 'bob.smith@example.com' },
  { id: 'm3', fullName: 'Charlie Brown', email: 'charlie.brown@example.com' },
  { id: 'm4', fullName: 'Diana Prince', email: 'diana@example.com' },
];

function ContactFieldDemo() {
  const [selected, setSelected] = useState<string | null>('m1');
  return (
    <div className="space-y-3" data-icod-id="ds_contactfield_demo_wrap">
      <div className="max-w-sm" data-icod-id="ds_contactfield_demo_instance">
        <ContactField
          value={selected}
          workspaceMembers={DEMO_MEMBERS}
          onSelect={setSelected}
          placeholder="Assign to..."
          data-icod-id="src_pages_designsystempage_tsx_8717" />
      </div>
      <span className="text-xs text-muted-foreground" data-icod-id="ds_contactfield_demo_val">
        Selected: {selected ?? 'none'}
      </span>
    </div>
  );
}

/* ─── DateField interactive demo ────────────────────────────────────────── */
function DateFieldDemo() {
  const [date, setDate] = useState<string | null>('2025-01-15');
  return (
    <div className="space-y-3" data-icod-id="ds_datefield_demo_wrap">
      <div className="flex items-center gap-4" data-icod-id="ds_datefield_demo_row">
        <div className="max-w-[200px]" data-icod-id="ds_datefield_demo_with_value">
          <DateField
            value={date}
            onChange={setDate}
            data-icod-id="src_pages_designsystempage_tsx_9a39" />
        </div>
        <div className="max-w-[200px]" data-icod-id="ds_datefield_demo_empty">
          <DateField
            value={null}
            onChange={setDate}
            placeholder="Select due date"
            data-icod-id="src_pages_designsystempage_tsx_e6a3" />
        </div>
        <div className="max-w-[200px]" data-icod-id="ds_datefield_demo_disabled">
          <DateField
            value="2025-06-01"
            onChange={() => {}}
            disabled
            data-icod-id="src_pages_designsystempage_tsx_cdf9" />
        </div>
      </div>
      <span className="text-xs text-muted-foreground" data-icod-id="ds_datefield_demo_val">
        Selected: {date ?? 'none'}
      </span>
    </div>
  );
}

/* ─── Inline icons for vertical alignment (not in lucide-react) ─────────── */
function AlignTopIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      data-icod-id="src_pages_designsystempage_tsx_7e4b">
      <rect
        width="16"
        height="12"
        x="4"
        y="6"
        rx="2"
        data-icod-id="src_pages_designsystempage_tsx_a5b2" />
      <path d="M4 2v4" data-icod-id="src_pages_designsystempage_tsx_6a05" /><path d="M20 2v4" data-icod-id="src_pages_designsystempage_tsx_24c6" />
    </svg>
  );
}

function AlignBottomIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      data-icod-id="src_pages_designsystempage_tsx_0831">
      <rect
        width="16"
        height="12"
        x="4"
        y="6"
        rx="2"
        data-icod-id="src_pages_designsystempage_tsx_c7fa" />
      <path d="M4 22v-4" data-icod-id="src_pages_designsystempage_tsx_c6f3" /><path d="M20 22v-4" data-icod-id="src_pages_designsystempage_tsx_0f0d" />
    </svg>
  );
}

/* ─── ColorSwatchPicker interactive demo ──────────────────────────────── */
function ColorSwatchPickerDemo() {
  const [textColor, setTextColor] = useState<string | null>(null);
  const [fillColor, setFillColor] = useState<string | null>('#FEFCE8');
  const textBtnRef = useRef<HTMLButtonElement>(null);
  const fillBtnRef = useRef<HTMLButtonElement>(null);
  const [textOpen, setTextOpen] = useState(false);
  const [fillOpen, setFillOpen] = useState(false);

  return (
    <div className="flex items-center gap-6" data-icod-id="ds_colorswatch_demo">
      <div className="relative" data-icod-id="ds_csp_text_wrap">
        <button
          ref={textBtnRef}
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs hover:bg-muted"
          onClick={() => setTextOpen(!textOpen)}
          onMouseDown={(e) => e.preventDefault()}
          data-icod-id="ds_csp_text_btn"
        >
          <Type
            className="h-3.5 w-3.5"
            data-icod-id="src_pages_designsystempage_tsx_f700" />
          Text color
        </button>
        {textOpen && (
          <ColorSwatchPicker
            anchorRef={textBtnRef}
            value={textColor}
            onChange={(hex) => setTextColor(hex)}
            onClose={() => setTextOpen(false)}
            data-icod-id="src_pages_designsystempage_tsx_77a8" />
        )}
        <span className="mt-1 block text-[10px] text-muted-foreground" data-icod-id="ds_csp_text_val">
          {textColor ?? 'null (default)'}
        </span>
      </div>
      <div className="relative" data-icod-id="ds_csp_fill_wrap">
        <button
          ref={fillBtnRef}
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs hover:bg-muted"
          onClick={() => setFillOpen(!fillOpen)}
          onMouseDown={(e) => e.preventDefault()}
          data-icod-id="ds_csp_fill_btn"
        >
          <PaintBucket
            className="h-3.5 w-3.5"
            data-icod-id="src_pages_designsystempage_tsx_75a6" />
          Fill color
        </button>
        {fillOpen && (
          <ColorSwatchPicker
            anchorRef={fillBtnRef}
            value={fillColor}
            onChange={(hex) => setFillColor(hex)}
            onClose={() => setFillOpen(false)}
            data-icod-id="src_pages_designsystempage_tsx_26d8" />
        )}
        <span className="mt-1 block text-[10px] text-muted-foreground" data-icod-id="ds_csp_fill_val">
          {fillColor ?? 'null (default)'}
        </span>
      </div>
    </div>
  );
}

const PALETTE_TOKENS: Array<{ name: string; varName: string; hex: string }> = [
  // Neutrals
  { name: 'neutral-0', varName: '--palette-neutral-0', hex: '#FFFFFF' },
  { name: 'neutral-100', varName: '--palette-neutral-100', hex: '#F1F5F9' },
  { name: 'neutral-300', varName: '--palette-neutral-300', hex: '#CBD5E1' },
  { name: 'neutral-500', varName: '--palette-neutral-500', hex: '#64748B' },
  { name: 'neutral-800', varName: '--palette-neutral-800', hex: '#1E293B' },
  { name: 'neutral-900', varName: '--palette-neutral-900', hex: '#000000' },
  // Accents
  { name: 'red', varName: '--palette-red', hex: '#EF4444' },
  { name: 'orange', varName: '--palette-orange', hex: '#F97316' },
  { name: 'yellow', varName: '--palette-yellow', hex: '#EAB308' },
  { name: 'green', varName: '--palette-green', hex: '#22C55E' },
  { name: 'teal', varName: '--palette-teal', hex: '#14B8A6' },
  { name: 'blue', varName: '--palette-blue', hex: '#3B82F6' },
  { name: 'indigo', varName: '--palette-indigo', hex: '#6366F1' },
  { name: 'violet', varName: '--palette-violet', hex: '#8B5CF6' },
  { name: 'pink', varName: '--palette-pink', hex: '#EC4899' },
  // Tints
  { name: 'red-light', varName: '--palette-red-light', hex: '#FEF2F2' },
  { name: 'orange-light', varName: '--palette-orange-light', hex: '#FFF7ED' },
  { name: 'yellow-light', varName: '--palette-yellow-light', hex: '#FEFCE8' },
  { name: 'green-light', varName: '--palette-green-light', hex: '#F0FDF4' },
  { name: 'teal-light', varName: '--palette-teal-light', hex: '#F0FDFA' },
  { name: 'blue-light', varName: '--palette-blue-light', hex: '#EFF6FF' },
  { name: 'indigo-light', varName: '--palette-indigo-light', hex: '#EEF2FF' },
  { name: 'violet-light', varName: '--palette-violet-light', hex: '#F5F3FF' },
  { name: 'pink-light', varName: '--palette-pink-light', hex: '#FDF4FF' },
];

function PaletteTokenSwatches() {
  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-2 sm:grid-cols-4 md:grid-cols-6" data-icod-id="ds_palette_grid">
      {PALETTE_TOKENS.map((token) => (
        <div
          key={token.name}
          className="flex items-center gap-2"
          data-icod-id={`ds_palette_token_${token.name}`}>
          <div
            className="h-5 w-5 shrink-0 rounded-sm border border-border/60"
            style={{ backgroundColor: `var(${token.varName})` }}
            data-icod-id={`ds_palette_swatch_${token.name}`} />
          <div className="min-w-0" data-icod-id={`ds_palette_info_${token.name}`}>
            <div
              className="truncate text-[10px] font-medium text-foreground"
              data-icod-id={`ds_palette_name_${token.name}`}>{token.name}</div>
            <div
              className="truncate text-[10px] text-muted-foreground"
              data-icod-id={`ds_palette_hex_${token.name}`}>{token.hex}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── ColorSwatchGroup interactive demo ───────────────────────────────────── */
const COLOR_SWATCH_OPTIONS = ACCENTS.map((accent) => ({
  value: accent,
  label: ACCENT_META[accent].label,
  primaryColor: ACCENT_META[accent].color,
}));

function ColorSwatchGroupDemo() {
  const [selected, setSelected] = useState<string>('avery');
  return (
    <ColorSwatchGroup
      options={COLOR_SWATCH_OPTIONS}
      value={selected}
      onChange={setSelected}
      data-icod-id="ds_colorswatchgroup_demo_instance" />
  );
}

/* ─── SelectableCard interactive demo ──────────────────────────────────────── */
function SelectableCardDemo() {
  const [selected, setSelected] = useState<string>(PROJECT_TEMPLATES[0].id);
  return (
    <div
      className="grid grid-cols-2 gap-3"
      role="radiogroup"
      aria-label="Template selection demo"
      data-icod-id="ds_selectablecard_grid"
    >
      {PROJECT_TEMPLATES.map((t) => {
        const Icon = t.icon;
        return (
          <SelectableCard
            key={t.id}
            icon={<Icon
              className="h-4 w-4"
              data-icod-id={`src_pages_designsystempage_tsx_3404_${t.id}`} />}
            title={t.name}
            description={t.description}
            selected={selected === t.id}
            onSelect={() => setSelected(t.id)}
            name="demo-template"
            value={t.id}
            data-icod-id={`ds_selectablecard_${t.id}`}
          />
        );
      })}
    </div>
  );
}
