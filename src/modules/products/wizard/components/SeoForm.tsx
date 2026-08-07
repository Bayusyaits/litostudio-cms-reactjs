/** SeoForm — per-locale meta title/description. Controlled by the parent
 * wizard's state and persisted via its own Save Draft/Publish flow (same
 * pattern as InventoryEditor) — no separate save button here. */
interface SeoFormProps {
  productId: string | null
  metaTitle: string
  onMetaTitleChange: (value: string) => void
  metaDescription: string
  onMetaDescriptionChange: (value: string) => void
}

export function SeoForm({ productId, metaTitle, onMetaTitleChange, metaDescription, onMetaDescriptionChange }: SeoFormProps) {
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
        <input type="text" className="cms-input w-full" maxLength={70} value={metaTitle} onChange={(e) => onMetaTitleChange(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <label className="cms-label">Meta Description</label>
        <textarea className="cms-input w-full" rows={3} maxLength={160} value={metaDescription} onChange={(e) => onMetaDescriptionChange(e.target.value)} />
      </div>
      <p className="font-body text-xs text-[var(--text-muted)]">
        SEO changes follow the main save flow via Save Draft / Publish.
      </p>
    </div>
  )
}
