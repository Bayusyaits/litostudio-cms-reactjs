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
    free:       'rgba(34,197,94,0.15)',
    pro:        'rgba(212,168,83,0.15)',
    enterprise: 'rgba(139,92,246,0.15)',
  }
  const text: Record<string, string> = {
    free:       '#22c55e',
    pro:        '#D4A853',
    enterprise: '#8b5cf6',
  }
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      background: colors[tier] ?? 'rgba(255,255,255,0.07)',
      color: text[tier] ?? 'var(--text-secondary)',
      fontFamily: 'var(--font-body)',
    }}>
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
    <div style={{
      background: 'var(--cms-card-bg)',
      border: `1px solid ${enabled ? 'rgba(212,168,83,0.25)' : 'var(--lito-border)'}`,
      borderRadius: 8,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      transition: 'border-color 200ms',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Icon */}
        <div style={{
          width: 40, height: 40, flexShrink: 0,
          borderRadius: 8,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--lito-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          {addon.icon ?? <Puzzle size={18} style={{ opacity: 0.5 }} />}
        </div>

        {/* Name + tier */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 14, fontWeight: 600,
              color: 'var(--text-primary)',
            }}>
              {addon.name}
            </span>
            <TierBadge tier={addon.tier} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <Tag size={10} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <span style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
            }}>
              {CATEGORY_LABELS[addon.category] ?? addon.category}
            </span>
          </div>
        </div>

        {/* Toggle — only show if installed */}
        {installed && (
          <button
            type="button"
            onClick={onToggle}
            disabled={isToggling}
            title={enabled ? 'Disable add-on' : 'Enable add-on'}
            style={{
              background: 'none', border: 'none', padding: 4,
              cursor: isToggling ? 'not-allowed' : 'pointer',
              color: enabled ? '#D4A853' : 'var(--text-secondary)',
              flexShrink: 0, display: 'flex',
            }}
          >
            {enabled
              ? <ToggleRight size={22} />
              : <ToggleLeft size={22} />}
          </button>
        )}
      </div>

      {/* Description */}
      {addon.description && (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12, lineHeight: 1.6,
          color: 'var(--text-secondary)',
          margin: 0,
        }}>
          {addon.description}
        </p>
      )}

      {/* Footer actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        {!installed ? (
          <button
            type="button"
            onClick={onInstall}
            disabled={isInstalling}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid var(--lito-gold)',
              background: 'transparent',
              color: '#D4A853',
              fontFamily: 'var(--font-body)',
              fontSize: 12, fontWeight: 500,
              cursor: isInstalling ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: isInstalling ? 0.6 : 1,
              transition: 'background 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,83,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            {isInstalling && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />}
            Install
          </button>
        ) : (
          <>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: 'var(--font-body)',
              fontSize: 11, color: '#22c55e',
            }}>
              <Check size={12} />
              Installed
            </span>
            <button
              type="button"
              onClick={onConfigure}
              style={{
                marginLeft: 'auto',
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid var(--lito-border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                fontSize: 11, cursor: 'pointer',
                transition: 'border-color 150ms, color 150ms',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--text-secondary)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--lito-border)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
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

  // Build initial form state from current settings + defaults
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
      <div style={{ padding: 24 }}>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13, color: 'var(--text-secondary)',
          margin: 0, textAlign: 'center',
        }}>
          This add-on has no configurable settings.
        </p>
        <button type="button" onClick={onClose} style={{
          marginTop: 16, width: '100%',
          padding: '8px 0',
          border: '1px solid var(--lito-border)',
          borderRadius: 6,
          background: 'transparent',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-body)',
          fontSize: 13, cursor: 'pointer',
        }}>
          Close
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 6,
          color: '#ef4444',
          fontFamily: 'var(--font-body)', fontSize: 12,
        }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}
      {success && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px',
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 6,
          color: '#22c55e',
          fontFamily: 'var(--font-body)', fontSize: 12,
        }}>
          <Check size={14} />
          Settings saved.
        </div>
      )}

      {Object.entries(schema).map(([key, def]) => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12, fontWeight: 500,
            color: 'var(--text-primary)',
          }}>
            {def.label ?? key}
          </label>
          {def.description && (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11, color: 'var(--text-secondary)',
              margin: 0,
            }}>
              {def.description}
            </p>
          )}
          {def.type === 'boolean' ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={Boolean(values[key])}
                onChange={e => setValues(prev => ({ ...prev, [key]: e.target.checked }))}
              />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)' }}>
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
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--lito-border)',
                background: 'var(--cms-input-bg, rgba(255,255,255,0.04))',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          )}
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            flex: 1,
            padding: '8px 0',
            border: '1px solid var(--lito-border)',
            borderRadius: 6,
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
            fontSize: 13, cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => onSave(values)}
          style={{
            flex: 2,
            padding: '8px 0',
            border: 'none',
            borderRadius: 6,
            background: '#D4A853',
            color: '#1a1a1a',
            fontFamily: 'var(--font-body)',
            fontSize: 13, fontWeight: 600,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          {isSaving && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
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

  // Collect categories from catalog
  const categories = ['all', ...Array.from(new Set(mergedAddons.map(m => m.addon.category)))]

  const filtered = activeCategory === 'all'
    ? mergedAddons
    : mergedAddons.filter(m => m.addon.category === activeCategory)

  const installedCount = mergedAddons.filter(m => !!m.orgAddon).length

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '32px 40px' }}>
        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 22, fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
          }}>
            Add-Ons
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13, color: 'var(--text-secondary)',
            margin: '6px 0 0',
          }}>
            {installedCount} of {mergedAddons.length} add-ons installed
          </p>
        </div>

        {/* Category filter tabs */}
        <div style={{
          display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24,
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: activeCategory === cat ? '#D4A853' : 'var(--lito-border)',
                background: activeCategory === cat ? 'rgba(212,168,83,0.12)' : 'transparent',
                color: activeCategory === cat ? '#D4A853' : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                fontSize: 12, fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 150ms',
              }}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '80px 0',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)', fontSize: 13,
            gap: 10,
          }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', opacity: 0.6 }} />
            Loading add-ons…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            padding: '60px 0', textAlign: 'center',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)', fontSize: 13,
          }}>
            No add-ons in this category.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
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
        <div style={{
          width: 320,
          flexShrink: 0,
          borderLeft: '1px solid var(--lito-border)',
          background: 'var(--cms-card-bg)',
          overflowY: 'auto',
        }}>
          {/* Drawer header */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--lito-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 14, fontWeight: 600,
                color: 'var(--text-primary)',
              }}>
                {selectedOrgAddon.addons?.name}
              </div>
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11, color: 'var(--text-secondary)', marginTop: 2,
              }}>
                Settings
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectAddon(null)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', padding: 4,
                fontFamily: 'var(--font-body)', fontSize: 18, lineHeight: 1,
              }}
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
