import { useState } from 'react'
import {
  Puzzle, ToggleLeft, ToggleRight, Settings, ChevronRight,
  Check, AlertCircle, Loader2, Tag,
} from 'lucide-react'
import type { OrgAddon, Addon } from '@/services/addon.service'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MergedAddon {
  addon: Addon
  orgAddon: OrgAddon | null
}

interface AddonsPageViewProps {
  mergedAddons: MergedAddon[]
  isLoading: boolean
  selectedOrgAddon: OrgAddon | null
  onSelectAddon: (oa: OrgAddon | null) => void
  onInstall: (slug: string) => void
  onToggle: (orgAddonId: string, enabled: boolean) => void
  onSaveSettings: (orgAddonId: string, settings: Record<string, unknown>) => void
  isInstalling: boolean
  isToggling: boolean
  isSavingSettings: boolean
  settingsError: string | null
  settingsSuccess: boolean
}

// ─── Tier badge ───────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    core:       'rgba(148,163,184,0.15)',
    free:       'rgba(34,197,94,0.15)',
    pro:        'rgba(212,168,83,0.15)',
    enterprise: 'rgba(139,92,246,0.15)',
  }
  const text: Record<string, string> = {
    core:       '#94a3b8',
    free:       '#22c55e',
    pro:        '#D4A853',
    enterprise: '#8b5cf6',
  }
  return (
    <span
      className="inline-block px-2 py-[2px] rounded text-[10px] font-semibold uppercase tracking-[0.05em] font-body"
      style={{ background: colors[tier] ?? 'rgba(255,255,255,0.07)', color: text[tier] ?? 'var(--text-secondary)' }}
    >
      {tier}
    </span>
  )
}

// ─── Category label ───────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  marketing:   'Marketing',
  ecommerce:   'E-Commerce',
  content:     'Content',
  analytics:   'Analytics',
  customer:    'Customer',
  integration: 'Integration',
  ui:          'UI',
}

// ─── Addon Card ───────────────────────────────────────────────────────────────

interface AddonCardProps {
  item: MergedAddon
  onInstall: () => void
  onToggle: () => void
  onConfigure: () => void
  isInstalling: boolean
  isToggling: boolean
}

function AddonCard({ item, onInstall, onToggle, onConfigure, isInstalling, isToggling }: AddonCardProps) {
  const { addon, orgAddon } = item
  const installed = !!orgAddon
  const enabled = orgAddon?.enabled ?? false

  return (
    <div className={`bg-[var(--cms-card-bg)] rounded-lg p-5 flex flex-col gap-3 transition-[border-color] duration-200 border ${enabled ? 'border-[rgba(212,168,83,0.25)]' : 'border-[var(--lito-border)]'}`}>
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[var(--lito-border)] flex items-center justify-center text-xl">
          {addon.icon ?? <Puzzle size={18} className="opacity-50" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-[var(--font-heading)] text-sm font-semibold text-[var(--text-primary)]">
              {addon.name}
            </span>
            <TierBadge tier={addon.tier} />
          </div>
          <div className="flex items-center gap-1.5 mt-[3px]">
            <Tag size={10} className="text-[var(--text-secondary)] shrink-0" />
            <span className="text-[11px] text-[var(--text-secondary)] font-body">
              {CATEGORY_LABELS[addon.category] ?? addon.category}
            </span>
          </div>
        </div>

        {installed && (
          <button
            type="button"
            onClick={onToggle}
            disabled={isToggling}
            title={enabled ? 'Disable add-on' : 'Enable add-on'}
            className={`bg-transparent border-none p-1 flex shrink-0 ${isToggling ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ color: enabled ? '#D4A853' : 'var(--text-secondary)' }}
          >
            {enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
          </button>
        )}
      </div>

      {addon.description && (
        <p className="font-body text-xs leading-relaxed text-[var(--text-secondary)] m-0">
          {addon.description}
        </p>
      )}

      <div className="flex items-center gap-2 mt-1">
        {!installed ? (
          <button
            type="button"
            onClick={onInstall}
            disabled={isInstalling}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-[var(--lito-gold)] bg-transparent text-[#D4A853] font-body text-xs font-medium transition-[background] duration-150 hover:bg-[rgba(212,168,83,0.1)] ${isInstalling ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            {isInstalling && <Loader2 size={12} className="animate-spin" />}
            Install
          </button>
        ) : (
          <>
            <span className="flex items-center gap-1 font-body text-[11px] text-[#22c55e]">
              <Check size={12} />
              Installed
            </span>
            <button
              type="button"
              onClick={onConfigure}
              className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-md border border-[var(--lito-border)] bg-transparent text-[var(--text-secondary)] font-body text-[11px] cursor-pointer transition-[border-color,color] duration-150 hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <Settings size={11} />
              Configure
              <ChevronRight size={10} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

interface SettingsPanelProps {
  orgAddon: OrgAddon
  onClose: () => void
  onSave: (settings: Record<string, unknown>) => void
  isSaving: boolean
  error: string | null
  success: boolean
}

function SettingsPanel({ orgAddon, onClose, onSave, isSaving, error, success }: SettingsPanelProps) {
  const schema = orgAddon.addons?.settings_schema as Record<string, {
    type: string
    label?: string
    description?: string
    default?: unknown
  }> | null

  const initialValues: Record<string, unknown> = {}
  if (schema) {
    for (const [key, def] of Object.entries(schema)) {
      const existing = orgAddon.addon_settings?.find(s => s.key === key)
      initialValues[key] = existing?.value ?? def.default ?? ''
    }
  }

  const [values, setValues] = useState<Record<string, unknown>>(initialValues)

  if (!schema || Object.keys(schema).length === 0) {
    return (
      <div className="p-6">
        <p className="font-body text-[13px] text-[var(--text-secondary)] m-0 text-center">
          This add-on has no configurable settings.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2 border border-[var(--lito-border)] rounded-md bg-transparent text-[var(--text-secondary)] font-body text-[13px] cursor-pointer"
        >
          Close
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-6">
      {error && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-md text-[#ef4444] font-body text-xs">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] rounded-md text-[#22c55e] font-body text-xs">
          <Check size={14} />
          Settings saved.
        </div>
      )}

      {Object.entries(schema).map(([key, def]) => (
        <div key={key} className="flex flex-col gap-1.5">
          <label className="font-body text-xs font-medium text-[var(--text-primary)]">
            {def.label ?? key}
          </label>
          {def.description && (
            <p className="font-body text-[11px] text-[var(--text-secondary)] m-0">
              {def.description}
            </p>
          )}
          {def.type === 'boolean' ? (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(values[key])}
                onChange={e => setValues(prev => ({ ...prev, [key]: e.target.checked }))}
              />
              <span className="font-body text-xs text-[var(--text-secondary)]">
                {values[key] ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          ) : (
            <input
              type={def.type === 'number' ? 'number' : 'text'}
              value={String(values[key] ?? '')}
              onChange={e => setValues(prev => ({
                ...prev,
                [key]: def.type === 'number' ? Number(e.target.value) : e.target.value,
              }))}
              className="px-3 py-2 rounded-md border border-[var(--lito-border)] bg-[var(--cms-input-bg,rgba(255,255,255,0.04))] text-[var(--text-primary)] font-body text-[13px] outline-none w-full box-border"
            />
          )}
        </div>
      ))}

      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 border border-[var(--lito-border)] rounded-md bg-transparent text-[var(--text-secondary)] font-body text-[13px] cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => onSave(values)}
          className={`flex-[2] py-2 border-none rounded-md bg-[#D4A853] text-[#1a1a1a] font-body text-[13px] font-semibold flex items-center justify-center gap-1.5 ${isSaving ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
        >
          {isSaving && <Loader2 size={13} className="animate-spin" />}
          Save Settings
        </button>
      </div>
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function AddonsPageView({
  mergedAddons,
  isLoading,
  selectedOrgAddon,
  onSelectAddon,
  onInstall,
  onToggle,
  onSaveSettings,
  isInstalling,
  isToggling,
  isSavingSettings,
  settingsError,
  settingsSuccess,
}: AddonsPageViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const categories = ['all', ...Array.from(new Set(mergedAddons.map(m => m.addon.category)))]
  const filtered = activeCategory === 'all'
    ? mergedAddons
    : mergedAddons.filter(m => m.addon.category === activeCategory)
  const installedCount = mergedAddons.filter(m => !!m.orgAddon).length

  return (
    <div className="flex h-full min-h-0">
      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-y-auto px-10 py-8">
        <div className="mb-7">
          <h1 className="font-[var(--font-heading)] text-[22px] font-semibold text-[var(--text-primary)] m-0">
            Add-Ons
          </h1>
          <p className="font-body text-[13px] text-[var(--text-secondary)] mt-1.5 mb-0">
            {installedCount} of {mergedAddons.length} add-ons installed
          </p>
        </div>

        <div className="flex gap-1.5 flex-wrap mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-[5px] rounded-full border font-body text-xs font-medium cursor-pointer capitalize transition-all duration-150 ${
                activeCategory === cat
                  ? 'border-[#D4A853] bg-[rgba(212,168,83,0.12)] text-[#D4A853]'
                  : 'border-[var(--lito-border)] bg-transparent text-[var(--text-secondary)]'
              }`}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-[var(--text-secondary)] font-body text-[13px] gap-2.5">
            <Loader2 size={16} className="animate-spin opacity-60" />
            Loading add-ons…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-[60px] text-center text-[var(--text-secondary)] font-body text-[13px]">
            No add-ons in this category.
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {filtered.map(({ addon, orgAddon }) => (
              <AddonCard
                key={addon.id}
                item={{ addon, orgAddon }}
                onInstall={() => onInstall(addon.slug)}
                onToggle={() => orgAddon && onToggle(orgAddon.id, !orgAddon.enabled)}
                onConfigure={() => orgAddon && onSelectAddon(orgAddon)}
                isInstalling={isInstalling}
                isToggling={isToggling}
              />
            ))}
          </div>
        )}
      </div>

      {/* Settings drawer */}
      {selectedOrgAddon && (
        <div className="w-80 shrink-0 border-l border-[var(--lito-border)] bg-[var(--cms-card-bg)] overflow-y-auto">
          <div className="px-6 py-4 border-b border-[var(--lito-border)] flex items-center justify-between">
            <div>
              <div className="font-[var(--font-heading)] text-sm font-semibold text-[var(--text-primary)]">
                {selectedOrgAddon.addons?.name}
              </div>
              <div className="font-body text-[11px] text-[var(--text-secondary)] mt-0.5">
                Settings
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectAddon(null)}
              className="bg-transparent border-none cursor-pointer text-[var(--text-secondary)] p-1 font-body text-lg leading-none"
            >
              ×
            </button>
          </div>

          <SettingsPanel
            orgAddon={selectedOrgAddon}
            onClose={() => onSelectAddon(null)}
            onSave={(settings) => onSaveSettings(selectedOrgAddon.id, settings)}
            isSaving={isSavingSettings}
            error={settingsError}
            success={settingsSuccess}
          />
        </div>
      )}
    </div>
  )
}
