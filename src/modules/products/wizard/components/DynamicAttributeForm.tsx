/**
 * DynamicAttributeForm — Shopee/Tokopedia-style "attributes change based on
 * selected category" form. Renders whatever's effective for the product's
 * current category (tree-inherited server-side via
 * get_effective_category_attributes) and bulk-saves product_attribute_values.
 */
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productAttributesService } from '@/services/catalog.service'

interface DynamicAttributeFormProps {
  productId: string | null
  categoryId: string | null
}

export function DynamicAttributeForm({ productId, categoryId }: DynamicAttributeFormProps) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['product-attributes', productId],
    queryFn: () => productAttributesService.getForProduct(productId!),
    enabled: !!productId,
  })
  const attributes = data ?? []

  const [values, setValues] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const next: Record<string, unknown> = {}
    for (const a of attributes) next[a.attribute_id] = a.value ?? (a.data_type === 'multiselect' ? [] : a.data_type === 'boolean' ? false : '')
    setValues(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  function setValue(attributeId: string, value: unknown) {
    setValues((prev) => ({ ...prev, [attributeId]: value }))
    setSaved(false)
  }

  async function handleSave() {
    if (!productId) return
    setSaving(true)
    setError(null)
    try {
      const missing = attributes.filter((a) => a.is_required && (values[a.attribute_id] === '' || values[a.attribute_id] == null))
      if (missing.length > 0) throw new Error(`Required: ${missing.map((a) => a.name).join(', ')}`)

      await productAttributesService.save(productId, attributes.map((a) => ({ attribute_id: a.attribute_id, value: values[a.attribute_id] })))
      setSaved(true)
      void refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save attributes')
    } finally {
      setSaving(false)
    }
  }

  if (!productId) {
    return (
      <div className="cms-card p-5">
        <p className="font-body text-xs text-[var(--text-muted)]">Save the product's basic info first, then set its category-specific attributes here.</p>
      </div>
    )
  }
  if (!categoryId) {
    return (
      <div className="cms-card p-5">
        <p className="font-body text-xs text-[var(--text-muted)]">Pick a category first — its attribute fields will appear here.</p>
      </div>
    )
  }

  return (
    <div className="cms-card p-5 space-y-4">
      <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Attributes</h3>
      {isLoading && <p className="font-body text-xs text-[var(--text-muted)]">Loading…</p>}
      {!isLoading && attributes.length === 0 && (
        <p className="font-body text-xs text-[var(--text-faint)]">This category has no attributes configured.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {attributes.map((a) => (
          <div key={a.attribute_id} className="space-y-1.5">
            <label className="cms-label">
              {a.name}{a.is_required && <span className="text-[var(--s-danger)]"> *</span>}
              {a.unit && <span className="text-[var(--text-faint)]"> ({a.unit})</span>}
            </label>

            {a.data_type === 'select' && (
              <select className="cms-input w-full" value={(values[a.attribute_id] as string) ?? ''} onChange={(e) => setValue(a.attribute_id, e.target.value)}>
                <option value="">—</option>
                {a.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}

            {a.data_type === 'multiselect' && (
              <div className="flex flex-wrap gap-2">
                {a.options.map((o) => {
                  const current = (values[a.attribute_id] as string[]) ?? []
                  const checked = current.includes(o.value)
                  return (
                    <label key={o.value} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setValue(a.attribute_id, e.target.checked ? [...current, o.value] : current.filter((v) => v !== o.value))}
                      />
                      {o.label}
                    </label>
                  )
                })}
              </div>
            )}

            {a.data_type === 'boolean' && (
              <input type="checkbox" checked={!!values[a.attribute_id]} onChange={(e) => setValue(a.attribute_id, e.target.checked)} />
            )}

            {a.data_type === 'number' && (
              <input type="number" className="cms-input w-full" value={(values[a.attribute_id] as string) ?? ''} onChange={(e) => setValue(a.attribute_id, e.target.value === '' ? '' : Number(e.target.value))} />
            )}

            {a.data_type === 'date' && (
              <input type="date" className="cms-input w-full" value={(values[a.attribute_id] as string) ?? ''} onChange={(e) => setValue(a.attribute_id, e.target.value)} />
            )}

            {a.data_type === 'text' && (
              <input type="text" className="cms-input w-full" value={(values[a.attribute_id] as string) ?? ''} onChange={(e) => setValue(a.attribute_id, e.target.value)} />
            )}

            {a.help_text && <p className="font-body text-[10.5px] text-[var(--text-faint)]">{a.help_text}</p>}
          </div>
        ))}
      </div>

      {error && <p className="font-body text-xs text-[var(--s-danger)]">{error}</p>}
      {saved && !error && <p className="font-body text-xs text-[var(--s-pub-fg)]">Saved</p>}

      {attributes.length > 0 && (
        <button type="button" className="cms-btn cms-btn-primary cms-btn-sm" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save Attributes'}
        </button>
      )}
    </div>
  )
}
