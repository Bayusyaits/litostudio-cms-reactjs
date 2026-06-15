// modules/settings/labels/LabelsPageView.tsx
import { useState } from 'react'
import { Languages, Plus, Upload, Download, Pencil, Trash2, Check, X, Lock } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { SearchInput } from '@/components/molecules/SearchInput'
import type { Label, LabelUpsertPayload } from '@/services/labels.service'

// ── GROUP_LABELS ──────────────────────────────────────────────────────────────
const ALL_GROUPS = [
  'general', 'navigation', 'forms', 'commerce', 'blog',
  'services', 'products', 'destinations', 'testimonials',
  'newsletter', 'seo', 'errors',
]

// ── Create modal ──────────────────────────────────────────────────────────────
interface CreateFormState {
  key: string
  value: string
  group_name: string
  description: string
}

function CreateModal({
  onClose,
  onCreate,
  creating,
  locale,
}: {
  onClose: () => void
  onCreate: (p: Omit<LabelUpsertPayload, 'organization_id' | 'locale'>) => void
  creating: boolean
  locale: string
}) {
  const [form, setForm] = useState<CreateFormState>({
    key: '', value: '', group_name: 'general', description: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.key || !form.value) return
    onCreate({
      key: form.key.trim(),
      value: form.value.trim(),
      group_name: form.group_name,
      description: form.description.trim() || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="cms-card w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
            New Label ({locale})
          </h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="cms-label">Key <span className="text-[var(--s-danger)]">*</span></label>
            <input
              className="cms-input mt-1 w-full"
              placeholder="e.g. read_more"
              value={form.key}
              onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
              required
            />
            <p className="font-body text-xs text-[var(--text-muted)] mt-1">
              Lowercase, underscores only. Used in code: <code>label('read_more')</code>
            </p>
          </div>

          <div>
            <label className="cms-label">Value <span className="text-[var(--s-danger)]">*</span></label>
            <input
              className="cms-input mt-1 w-full"
              placeholder="e.g. Read More"
              value={form.value}
              onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="cms-label">Group</label>
            <select
              className="cms-input mt-1 w-full"
              value={form.group_name}
              onChange={(e) => setForm((p) => ({ ...p, group_name: e.target.value }))}
            >
              {ALL_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="cms-label">Description</label>
            <input
              className="cms-input mt-1 w-full"
              placeholder="Optional hint for editors"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 pt-2 justify-end">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={creating || !form.key || !form.value}>
              {creating ? 'Saving…' : 'Create Label'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Bulk import modal ─────────────────────────────────────────────────────────
function BulkModal({
  onClose,
  bulkJson,
  onBulkJsonChange,
  onBulkImport,
  bulkImporting,
  bulkError,
}: {
  onClose: () => void
  bulkJson: string
  onBulkJsonChange: (v: string) => void
  onBulkImport: () => void
  bulkImporting: boolean
  bulkError: string | null
}) {
  const EXAMPLE = JSON.stringify([
    { key: 'book_appointment', value: 'Book Appointment', group_name: 'commerce' },
    { key: 'view_portfolio', value: 'View Portfolio', group_name: 'general' },
  ], null, 2)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="cms-card w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">Bulk Import Labels</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="font-body text-sm text-[var(--text-muted)]">
          Paste a JSON array of labels. Existing keys will be updated (upsert).
        </p>

        <details className="text-xs text-[var(--text-muted)]">
          <summary className="cursor-pointer mb-1">Show example format</summary>
          <pre className="bg-[var(--bg-muted)] p-3 rounded text-xs overflow-auto">{EXAMPLE}</pre>
        </details>

        <textarea
          className="cms-input w-full h-48 font-mono text-xs resize-none"
          placeholder="Paste JSON array here…"
          value={bulkJson}
          onChange={(e) => onBulkJsonChange(e.target.value)}
        />

        {bulkError && (
          <p className="font-body text-xs text-[var(--s-danger)]">{bulkError}</p>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={bulkImporting || !bulkJson.trim()} onClick={onBulkImport}>
            {bulkImporting ? 'Importing…' : 'Import'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────
interface Filter {
  locale: string
  group_name: string
  search: string
}

interface Props {
  labels: Label[]
  groups: string[]
  isLoading: boolean
  filter: Filter
  setFilter: (f: Partial<Filter>) => void
  // Inline edit
  editingId: string | null
  editingValue: string
  onStartEdit: (id: string, value: string) => void
  onCancelEdit: () => void
  onSaveEdit: (id: string) => void
  onEditingValueChange: (v: string) => void
  saving: boolean
  // Create modal
  showCreateModal: boolean
  onOpenCreate: () => void
  onCloseCreate: () => void
  onCreate: (p: Omit<LabelUpsertPayload, 'organization_id' | 'locale'>) => void
  creating: boolean
  // Delete
  onDelete: (id: string) => void
  // Bulk
  showBulkModal: boolean
  onOpenBulk: () => void
  onCloseBulk: () => void
  bulkJson: string
  onBulkJsonChange: (v: string) => void
  onBulkImport: () => void
  bulkImporting: boolean
  bulkError: string | null
  // Export
  onExport: () => void
  mutateError: string | null
}

export function LabelsPageView({
  labels, groups, isLoading, filter, setFilter,
  editingId, editingValue, onStartEdit, onCancelEdit, onSaveEdit, onEditingValueChange, saving,
  showCreateModal, onOpenCreate, onCloseCreate, onCreate, creating,
  onDelete,
  showBulkModal, onOpenBulk, onCloseBulk, bulkJson, onBulkJsonChange, onBulkImport,
  bulkImporting, bulkError,
  onExport, mutateError,
}: Props) {
  const LOCALES = ['id', 'en']

  // Group by group_name for display
  const grouped = labels.reduce<Record<string, Label[]>>((acc, l) => {
    ;(acc[l.group_name] ??= []).push(l)
    return acc
  }, {})

  const groupsToShow = filter.group_name
    ? [filter.group_name]
    : Object.keys(grouped).sort()

  return (
    <div className="p-6 space-y-5 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Languages className="w-6 h-6 text-[var(--lito-gold)]" />
            Labels
          </h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {labels.length} label{labels.length !== 1 ? 's' : ''} — editable UI text for your website
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={onExport}>
            <Download className="w-3.5 h-3.5 mr-1.5" />Export
          </Button>
          <Button variant="secondary" size="sm" onClick={onOpenBulk}>
            <Upload className="w-3.5 h-3.5 mr-1.5" />Bulk Import
          </Button>
          <Button size="sm" onClick={onOpenCreate}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />New Label
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput
          value={filter.search}
          onChange={(search) => setFilter({ search })}
          placeholder="Search by key or value…"
          className="w-60"
        />
        <select
          className="cms-input h-9 text-sm w-32"
          value={filter.locale}
          onChange={(e) => setFilter({ locale: e.target.value })}
        >
          {LOCALES.map((l) => (
            <option key={l} value={l}>{l.toUpperCase()}</option>
          ))}
        </select>
        <select
          className="cms-input h-9 text-sm w-40"
          value={filter.group_name}
          onChange={(e) => setFilter({ group_name: e.target.value })}
        >
          <option value="">All groups</option>
          {(groups.length ? groups : ALL_GROUPS).map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {mutateError && (
        <div className="cms-card border-[var(--s-danger)] p-3">
          <p className="font-body text-sm text-[var(--s-danger)]">{mutateError}</p>
        </div>
      )}

      {/* Labels grouped table */}
      {isLoading ? (
        <div className="cms-card p-8 text-center">
          <p className="font-body text-sm text-[var(--text-muted)]">Loading…</p>
        </div>
      ) : labels.length === 0 ? (
        <div className="cms-card p-8 text-center space-y-2">
          <Languages className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
          <p className="font-body text-sm font-medium text-[var(--text-primary)]">No labels found</p>
          <p className="font-body text-xs text-[var(--text-muted)]">
            Try changing your filters or run the migration to seed defaults.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupsToShow.map((group) => {
            const rows = grouped[group] ?? []
            if (!rows.length) return null
            return (
              <div key={group} className="cms-card overflow-hidden">
                <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-muted)]">
                  <span className="font-body text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    {group}
                  </span>
                  <span className="ml-2 font-body text-xs text-[var(--text-muted)]">
                    ({rows.length})
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left px-4 py-2 font-body text-xs font-medium text-[var(--text-muted)] w-48">Key</th>
                      <th className="text-left px-4 py-2 font-body text-xs font-medium text-[var(--text-muted)]">Value</th>
                      <th className="text-left px-4 py-2 font-body text-xs font-medium text-[var(--text-muted)] w-48 hidden md:table-cell">Description</th>
                      <th className="w-24 px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((label) => (
                      <tr
                        key={label.id}
                        className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors"
                      >
                        {/* Key */}
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1.5">
                            {label.is_system && (
                              <span title="System label — cannot be deleted">
                                <Lock className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                              </span>
                            )}
                            <code className="font-mono text-xs text-[var(--text-primary)]">
                              {label.key}
                            </code>
                          </div>
                        </td>

                        {/* Value — inline edit */}
                        <td className="px-4 py-2">
                          {editingId === label.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                className="cms-input text-sm flex-1"
                                value={editingValue}
                                autoFocus
                                onChange={(e) => onEditingValueChange(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') onSaveEdit(label.id)
                                  if (e.key === 'Escape') onCancelEdit()
                                }}
                              />
                              <button
                                onClick={() => onSaveEdit(label.id)}
                                disabled={saving}
                                className="text-[var(--s-success)] hover:opacity-80 disabled:opacity-50"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={onCancelEdit}
                                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-body text-sm text-[var(--text-primary)]">
                              {label.value}
                            </span>
                          )}
                        </td>

                        {/* Description */}
                        <td className="px-4 py-2 hidden md:table-cell">
                          <span className="font-body text-xs text-[var(--text-muted)]">
                            {label.description ?? '—'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-end gap-1">
                            {editingId !== label.id && (
                              <button
                                onClick={() => onStartEdit(label.id, label.value)}
                                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
                                title="Edit value"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!label.is_system && (
                              <button
                                onClick={() => {
                                  if (confirm(`Delete label "${label.key}"?`)) onDelete(label.id)
                                }}
                                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--s-danger)] hover:bg-[var(--border)] transition-colors"
                                title="Delete label"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateModal
          onClose={onCloseCreate}
          onCreate={onCreate}
          creating={creating}
          locale={filter.locale}
        />
      )}
      {showBulkModal && (
        <BulkModal
          onClose={onCloseBulk}
          bulkJson={bulkJson}
          onBulkJsonChange={onBulkJsonChange}
          onBulkImport={onBulkImport}
          bulkImporting={bulkImporting}
          bulkError={bulkError}
        />
      )}
    </div>
  )
}
