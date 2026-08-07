/**
 * DynamicAttributeForm — Shopee/Tokopedia-style "attributes change based on
 * selected category" form. Renders whatever's effective for the product's
 * current category (tree-inherited server-side via
 * get_effective_category_attributes) and bulk-saves product_attribute_values.
 *
 * 2026-07-22 (user request): required-attribute validation, using this
 * codebase's actual form-validation standard — Zod (not Yup; grepped the
 * whole CMS app first, zero Yup usage anywhere in apps/cms/packages/ui-cms,
 * only apps/website uses Yup via @vee-validate/yup — a different app on a
 * different framework). Kept as a standalone `schema.safeParse()` call
 * rather than pulling in react-hook-form (the pattern PromotionFormPage.tsx
 * uses Zod with) — this component's existing plain-useState shape already
 * works and a full RHF rewrite wasn't asked for; Zod is equally valid used
 * standalone, and this is the lower-risk change.
 *
 * This is the CLIENT-side half of the validation — the button below still
 * only guards this card's own "Save Attributes" action. The AUTHORITATIVE
 * gate (blocking the whole product from being published with required
 * attributes missing, matching the existing price/weight_grams gate) lives
 * server-side in products.routes.ts's assertPublishReady — see that file's
 * comment for why the check has to live there too, not only here.
 */
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { productAttributesService, type ProductAttributeValue } from '@/services/catalog.service'

interface DynamicAttributeFormProps {
  productId: string | null
  categoryId: string | null
}

/** One Zod field per attribute — required attributes get a real presence
 *  check (message carries the attribute's own display name so field-level
 *  errors are legible without a lookup); optional attributes accept
 *  anything, including an unset default. `boolean` is never treated as
 *  "required" — an unchecked checkbox (`false`) is still a valid, complete
 *  answer, there's no meaningful "missing" state for it to catch. */
function buildAttributesSchema(attributes: ProductAttributeValue[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const a of attributes) {
    if (!a.is_required || a.data_type === 'boolean') {
      shape[a.attribute_id] = z.any().optional()
      continue
    }
    if (a.data_type === 'multiselect') {
      shape[a.attribute_id] = z.array(z.string()).min(1, `${a.name} is required`)
    } else {
      shape[a.attribute_id] = z.any().refine(
        (v) => v !== '' && v !== null && v !== undefined,
        `${a.name} is required`,
      )
    }
  }
  return z.object(shape)
}

export function DynamicAttributeForm({ productId, categoryId }: DynamicAttributeFormProps) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['product-attributes', productId],
    queryFn: () => productAttributesService.getForProduct(productId!),
    enabled: !!productId,
  })
  const attributes = data ?? []

  const [values, setValues] = useState<Record<string, unknown>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
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
    setFieldErrors((prev) => { const next = { ...prev }; delete next[attributeId]; return next })
    setSaved(false)
  }

  async function handleSave() {
    if (!productId) return
    setSaving(true)
    setError(null)
    setFieldErrors({})
    try {
      const result = buildAttributesSchema(attributes).safeParse(values)
      if (!result.success) {
        const nextFieldErrors: Record<string, string> = {}
        for (const issue of result.error.issues) {
          const key = String(issue.path[0])
          if (!nextFieldErrors[key]) nextFieldErrors[key] = issue.message
        }
        setFieldErrors(nextFieldErrors)
        throw new Error('Please fill in all required fields.')
      }

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
      <div className="space-y-1">
        <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Attributes</h3>
        <p className="font-body text-xs text-[var(--text-muted)]">
          These fields describe this specific product (material, fit, size, etc.) and are used as search filters on the storefront —
          filling them in accurately helps buyers find this product. Fields marked <span className="text-[var(--s-danger)]">*</span> are
          required for this category and must be filled in before the product can be published.
        </p>
      </div>
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
              <select
                className={`cms-input w-full ${fieldErrors[a.attribute_id] ? 'border-[var(--s-danger)]' : ''}`}
                value={(values[a.attribute_id] as string) ?? ''}
                onChange={(e) => setValue(a.attribute_id, e.target.value)}
              >
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
              <input
                type="number"
                className={`cms-input w-full ${fieldErrors[a.attribute_id] ? 'border-[var(--s-danger)]' : ''}`}
                value={(values[a.attribute_id] as string) ?? ''}
                onChange={(e) => setValue(a.attribute_id, e.target.value === '' ? '' : Number(e.target.value))}
              />
            )}

            {a.data_type === 'date' && (
              <input
                type="date"
                className={`cms-input w-full ${fieldErrors[a.attribute_id] ? 'border-[var(--s-danger)]' : ''}`}
                value={(values[a.attribute_id] as string) ?? ''}
                onChange={(e) => setValue(a.attribute_id, e.target.value)}
              />
            )}

            {a.data_type === 'text' && (
              <input
                type="text"
                className={`cms-input w-full ${fieldErrors[a.attribute_id] ? 'border-[var(--s-danger)]' : ''}`}
                value={(values[a.attribute_id] as string) ?? ''}
                onChange={(e) => setValue(a.attribute_id, e.target.value)}
              />
            )}

            {fieldErrors[a.attribute_id] && <p className="font-body text-[10.5px] text-[var(--s-danger)]">{fieldErrors[a.attribute_id]}</p>}
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
