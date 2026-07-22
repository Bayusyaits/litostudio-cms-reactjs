/** SeoForm — per-locale meta title/description, saved via the same
 * product_translations upsert endpoint every other content module uses. */
import { useEffect, useState } from 'react'
import { productsService } from '@/services/content.service'

const LOCALE = 'id'

interface SeoFormProps {
  productId: string | null
  initialMetaTitle: string
  initialMetaDescription: string
}

export function SeoForm({ productId, initialMetaTitle, initialMetaDescription }: SeoFormProps) {
  const [metaTitle, setMetaTitle] = useState(initialMetaTitle)
  const [metaDescription, setMetaDescription] = useState(initialMetaDescription)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setMetaTitle(initialMetaTitle)
    setMetaDescription(initialMetaDescription)
  }, [initialMetaTitle, initialMetaDescription])

  async function handleSave() {
    if (!productId) return
    setSaving(true)
    setSaved(false)
    try {
      await productsService.upsertTranslation(productId, LOCALE, { meta_title: metaTitle, meta_description: metaDescription })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (!productId) {
    return (
      <div className="cms-card p-5">
        <p className="font-body text-xs text-[var(--text-muted)]">Save the product's basic info first, then set its SEO metadata here.</p>
      </div>
    )
  }

  return (
    <div className="cms-card p-5 space-y-3">
      <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">SEO</h3>
      <div className="space-y-1.5">
        <label className="cms-label">Meta Title</label>
        <input type="text" className="cms-input w-full" maxLength={70} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <label className="cms-label">Meta Description</label>
        <textarea className="cms-input w-full" rows={3} maxLength={160} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
      </div>
      {saved && <p className="font-body text-xs text-[var(--s-pub-fg)]">Saved</p>}
      <button type="button" className="cms-btn cms-btn-primary cms-btn-sm" disabled={saving} onClick={handleSave}>
        {saving ? 'Saving…' : 'Save SEO'}
      </button>
    </div>
  )
}
