// apps/cms/src/modules/organizations/OrgFormModal.tsx
import { useState, useEffect, useRef } from 'react'
import { X, Building2 } from 'lucide-react'
import type { Organization } from '@/types/auth.types'

interface Props {
  org?: Organization | null  // null = create mode, set = edit mode
  onSave: (payload: { name: string; slug: string }) => Promise<void>
  onClose: () => void
}

/** Convert a name to a valid slug: lowercase, hyphens, no special chars */
function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48)
}

export function OrgFormModal({ org, onSave, onClose }: Props) {
  const isEdit = !!org
  const [name, setName] = useState(org?.name ?? '')
  const [slug, setSlug] = useState(org?.slug ?? '')
  const [slugManual, setSlugManual] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  // Auto-derive slug from name unless user has manually edited it
  useEffect(() => {
    if (!slugManual) setSlug(toSlug(name))
  }, [name, slugManual])

  // Focus name on open
  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 60)
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onSave({ name: name.trim(), slug: slug.trim() })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="org-modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'cmsPageIn 160ms ease-out both',
      }}
    >
      {/* Sheet */}
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--cms-card-bg)',
        border: '1px solid var(--lito-border)',
        borderRadius: 12,
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px',
          borderBottom: '1px solid var(--lito-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(212,168,83,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Building2 size={16} style={{ color: 'var(--lito-gold-deep)' }} />
            </div>
            <h2 id="org-modal-title" style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--text-primary)' }}>
              {isEdit ? 'Edit Organization' : 'Create Organization'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 4, display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 20px 0' }}>
          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <label className="cms-label" htmlFor="org-name">Organization name</label>
            <input
              ref={nameRef}
              id="org-name"
              type="text"
              className="cms-input"
              value={name}
              onChange={e => { setName(e.target.value); setSlugManual(false) }}
              placeholder="e.g. Lito Studio"
              required
              maxLength={80}
              style={{ height: 36 }}
            />
          </div>

          {/* Slug */}
          <div style={{ marginBottom: 20 }}>
            <label className="cms-label" htmlFor="org-slug">
              URL slug
              {isEdit && (
                <span style={{ marginLeft: 6, fontSize: 10, textTransform: 'none', fontWeight: 400, color: 'var(--text-faint)', letterSpacing: 0 }}>
                  (changing may break links)
                </span>
              )}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="org-slug"
                type="text"
                className="cms-input"
                value={slug}
                onChange={e => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setSlugManual(true) }}
                placeholder="e.g. lito-studio"
                required
                maxLength={48}
                pattern="[a-z0-9][a-z0-9-]*"
                title="Lowercase letters, numbers, and hyphens only"
                style={{ height: 36, paddingRight: 72 }}
              />
              <span style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 10, color: 'var(--text-faint)', pointerEvents: 'none',
              }}>
                {slug.length}/48
              </span>
            </div>
            <p style={{ marginTop: 4, fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-body)' }}>
              Lowercase letters, numbers, hyphens only. Used in URLs.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 16, padding: '8px 12px', borderRadius: 6,
              background: 'var(--cms-danger-bg)', color: 'var(--cms-danger)',
              fontSize: 12, fontFamily: 'var(--font-body)',
            }}>
              {error}
            </div>
          )}

          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 8,
            padding: '12px 0 18px',
            borderTop: '1px solid var(--lito-border)',
            marginTop: 4,
          }}>
            <button type="button" onClick={onClose} className="cms-btn cms-btn-ghost cms-btn-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !slug.trim()}
              className="cms-btn cms-btn-primary cms-btn-sm"
            >
              {saving ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save changes' : 'Create organization')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
