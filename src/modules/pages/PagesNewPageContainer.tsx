/**
 * PagesNewPageContainer — template-aware page creation wizard.
 *
 * 1. Reads the active site's template manifest via useTemplateManifest()
 * 2. Lets the user pick a page type from the manifest's pages[] list
 * 3. Creates the page via pagesService.create()
 * 4. Navigates to /pages/:id/edit (block editor)
 */

import { useState, useId } from 'react'
import { useNavigate }       from 'react-router-dom'
import { useMutation }       from '@tanstack/react-query'
import { useTemplateManifest } from '@/hooks/useTemplateManifest'
import { useWebsiteStore }   from '@/stores/website.store'
import { pagesService }      from '@/services/pages.service'
import { FileText, ChevronLeft, Plus } from 'lucide-react'

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

export default function PagesNewPageContainer() {
  const navigate           = useNavigate()
  const { activeSite }     = useWebsiteStore()
  const { manifest, templateSlug } = useTemplateManifest()

  const labelId = useId()

  const [selectedSlug, setSelectedSlug] = useState<string>('')
  const [customSlug,   setCustomSlug]   = useState('')
  const [title,        setTitle]        = useState('')
  const [error,        setError]        = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: () => {
      if (!activeSite) throw new Error('No active site')
      const slug = selectedSlug || slugify(customSlug)
      if (!slug) throw new Error('Enter a page slug')
      return pagesService.create({
        site_id:  activeSite.id,
        slug,
        template: templateSlug ?? 'default',
        status:   'draft',
        translations: title
          ? [{ locale: 'id', title }]
          : undefined,
      })
    },
    onSuccess: (page) => {
      navigate(`/pages/${page.id}/edit`, { replace: true })
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to create page')
    },
  })

  const handleSelectPreset = (slug: string, label: string) => {
    setSelectedSlug(slug)
    setCustomSlug('')
    if (!title) setTitle(label)
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const slug = selectedSlug || slugify(customSlug)
    if (!slug) { setError('Choose a page type or enter a slug'); return }
    createMutation.mutate()
  }

  // Page options: manifest pages if available, else generic fallback
  const presets = manifest?.pages ?? [
    { slug: 'home',    label: 'Home' },
    { slug: 'about',   label: 'About' },
    { slug: 'contact', label: 'Contact' },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', maxWidth: 640 }}>
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate('/pages')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-body)', fontSize: 13,
          color: 'var(--text-muted)', marginBottom: 24,
          padding: 0,
        }}
      >
        <ChevronLeft size={14} />
        Back to pages
      </button>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 22,
          fontWeight: 600, color: 'var(--text-primary)',
        }}>
          New Page
        </h1>
        {manifest ? (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Creating a page for the <strong style={{ color: 'var(--text-primary)' }}>{manifest.name}</strong> template
          </p>
        ) : (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            No template selected — you can enter a custom slug below
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Page type picker */}
        <div>
          <p
            id={labelId}
            style={{
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: 'var(--text-muted)', marginBottom: 10,
            }}
          >
            {manifest ? 'Choose a page type' : 'Common page types'}
          </p>
          <div
            role="group"
            aria-labelledby={labelId}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}
          >
            {presets.map((p) => {
              const active = selectedSlug === p.slug
              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => handleSelectPreset(p.slug, p.label)}
                  aria-pressed={active}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    padding: '10px 14px', borderRadius: 10,
                    border: `2px solid ${active ? 'var(--lito-teal)' : 'var(--lito-border)'}`,
                    background: active ? 'rgba(26,74,90,0.06)' : 'var(--cms-card-bg)',
                    cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <FileText
                    size={16}
                    style={{ color: active ? 'var(--lito-teal)' : 'var(--text-muted)', marginBottom: 6 }}
                  />
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                    color: active ? 'var(--lito-teal)' : 'var(--text-primary)',
                  }}>
                    {p.label}
                  </span>
                  <code style={{
                    fontFamily: 'monospace', fontSize: 11,
                    color: 'var(--text-muted)', marginTop: 2,
                  }}>
                    /{p.slug}
                  </code>
                </button>
              )
            })}

            {/* Custom page option */}
            <button
              type="button"
              onClick={() => { setSelectedSlug(''); setError(null) }}
              aria-pressed={!selectedSlug}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                padding: '10px 14px', borderRadius: 10,
                border: `2px solid ${!selectedSlug ? 'var(--lito-gold)' : 'var(--lito-border)'}`,
                background: !selectedSlug ? 'rgba(212,168,83,0.06)' : 'var(--cms-card-bg)',
                cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <Plus
                size={16}
                style={{ color: !selectedSlug ? 'var(--lito-gold-deep)' : 'var(--text-muted)', marginBottom: 6 }}
              />
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                color: !selectedSlug ? 'var(--lito-gold-deep)' : 'var(--text-primary)',
              }}>
                Custom
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                any slug
              </span>
            </button>
          </div>
        </div>

        {/* Custom slug input — shown when no preset selected */}
        {!selectedSlug && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)',
            }}>
              Page Slug *
            </label>
            <input
              type="text"
              value={customSlug}
              onChange={(e) => { setCustomSlug(e.target.value); setError(null) }}
              placeholder="e.g. faq or our-team"
              autoFocus
              style={{
                fontFamily: 'var(--font-body)', fontSize: 13,
                padding: '8px 12px',
                background: 'var(--cms-card-bg)',
                border: '1px solid var(--lito-border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
            {customSlug && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>
                URL: <code style={{ fontFamily: 'monospace' }}>/{slugify(customSlug)}</code>
              </p>
            )}
          </div>
        )}

        {/* Page title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{
            fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)',
          }}>
            Page Title <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Our Services"
            style={{
              fontFamily: 'var(--font-body)', fontSize: 13,
              padding: '8px 12px',
              background: 'var(--cms-card-bg)',
              border: '1px solid var(--lito-border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--s-danger)' }}>
            {error}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="cms-btn cms-btn-primary"
          >
            {createMutation.isPending ? 'Creating…' : 'Create & Open Editor'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/pages')}
            className="cms-btn"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
