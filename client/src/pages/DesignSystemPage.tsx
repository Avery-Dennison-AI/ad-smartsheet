import { useState } from 'react';
import { Search, Settings, Trash2, Copy, Plus, Home, Clock } from 'lucide-react';
import {
  Button,
  IconButton,
  Input,
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
} from '@/components/ui';
import type { BadgeVariant, DataTableColumn } from '@/components/ui';
import SidebarNavItem from '@/components/layout/SidebarNavItem';

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
                ['--grid-row-number-width', '48px'],
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
            value="https://app.gridflow.com/invite/abc123xyz"
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
