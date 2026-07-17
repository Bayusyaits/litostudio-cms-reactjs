/**
 * VariantsCard — Shopee-style Color x Size variant matrix editor.
 *
 * Phase 2 of execution-plan-variants-mass-upload-pdp-2026-07-16.md, built
 * from the grill session's locked decisions:
 *   - Max 2 axes (Color, Size) — matches the catalog's actual needs today.
 *   - Photos live on Color only, not Size (matches Shopee).
 *   - SKU auto-generated per combo, editable.
 *   - "Apply to all" unconditionally overwrites every row (fill-down
 *     semantics, not "only fill empty" — matches Shopee, matches every
 *     spreadsheet fill-down operation).
 *   - No backorder toggle exposed (binary in-stock/out-of-stock, matches
 *     Shopee) — the CMS never sends track_stock=false or an
 *     allow_backorder value; the backend leaves that field at its DB
 *     default regardless.
 *   - Disabled with an explicit "save the product first" prompt when the
 *     product doesn't exist yet (product_variants.product_id is a hard
 *     NOT NULL FK — there is nothing to attach a variant to before the
 *     first save) rather than a silent background auto-save.
 *
 * Follows the same reusable-card convention as PublishCard / SeoCard —
 * slotted into SimpleContentEditorPage's products case, not a new route.
 */

import { useEffect, useRef, useState } from 'react'
import {
  ImageUploader,
  draftMediaStore,
  productVariantsService,
  useToast,
} from '@litostudio/ui-cms'
import type { VariantSyncRow } from '@litostudio/ui-cms'
import { TagInput } from './TagInput'
import type { Product } from '@/types/content.types'

const MAX_AXES = 2

interface MatrixRow {
  color: string
  size: string
  sku: string
  price: string
  quantity: string
}

function rowKey(color: string, size: string): string {
  return `${color}::${size}`
}

function slugPart(s: string): string {
  return s.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '')
}

function autoSku(prefix: string, color: string, size: string, fallbackIndex: number): string {
  const parts = [prefix, slugPart(color), slugPart(size)].filter(Boolean)
  return parts.length > 0 ? parts.join('-') : `VAR-${fallbackIndex + 1}`
}

interface VariantsCardProps {
  productId: string | null
  disabled: boolean
  product?: Product
  /** SKU prefix seed, typically the product slug — keeps auto-generated SKUs human-readable. */
  skuPrefix?: string
  onSynced?: () => void
}

export function VariantsCard({ productId, disabled, product, skuPrefix = '', onSynced }: VariantsCardProps) {
  const toast = useToast()
  const [colors, setColors] = useState<string[]>([])
  const [sizes, setSizes]   = useState<string[]>([])
  const [rows, setRows]     = useState<MatrixRow[]>([])
  const [colorPhotos, setColorPhotos] = useState<Record<string, string | null>>({})
  const [bulkPrice, setBulkPrice] = useState('')
  const [bulkStock, setBulkStock] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // ── Hydrate once from the loaded product (existing variants/media/inventory) ──
  const hydrated = useRef(false)
  useEffect(() => {
    if (hydrated.current || !product?.variants?.length) return
    hydrated.current = true

    const activeVariants = product.variants.filter(v => v.status !== 'archived')
    const inventoryByVariant = new Map((product.inventory ?? []).map(i => [i.variant_id, i]))
    const mediaByVariant = new Map<string, string>()
    for (const m of product.media ?? []) {
      if (m.variant_id && !mediaByVariant.has(m.variant_id)) mediaByVariant.set(m.variant_id, m.url)
    }

    const seenColors = new Set<string>()
    const seenSizes  = new Set<string>()
    const nextRows: MatrixRow[] = []
    const nextPhotos: Record<string, string | null> = {}

    activeVariants.forEach((v, idx) => {
      const color = v.options?.color ?? ''
      const size  = v.options?.size ?? ''
      if (color) seenColors.add(color)
      if (size) seenSizes.add(size)
      const inv = inventoryByVariant.get(v.id)
      nextRows.push({
        color, size,
        sku: v.sku ?? autoSku(skuPrefix, color, size, idx),
        price: v.price != null ? String(v.price) : '',
        quantity: inv ? String(inv.quantity ?? 0) : '0',
      })
      if (color && mediaByVariant.has(v.id) && !(color in nextPhotos)) {
        nextPhotos[color] = mediaByVariant.get(v.id) ?? null
      }
    })

    setColors([...seenColors])
    setSizes([...seenSizes])
    setRows(nextRows)
    setColorPhotos(nextPhotos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product])

  // ── Regenerate the combo matrix whenever Color/Size axis values change ──
  // Merges with existing rows (keeps hand-edited price/stock/sku) rather
  // than wiping the table; a row whose color+size no longer appears in the
  // current axis lists is dropped here and — since Save sends the full
  // current row set to /variants/sync — gets archived server-side on next
  // save, never silently deleted.
  useEffect(() => {
    setRows(prev => {
      const prevByKey = new Map(prev.map(r => [rowKey(r.color, r.size), r]))
      const next: MatrixRow[] = []
      const colorAxis = colors.length > 0 ? colors : ['']
      const sizeAxis   = sizes.length > 0 ? sizes : ['']
      for (const color of colorAxis) {
        for (const size of sizeAxis) {
          if (!color && !size) continue
          const key = rowKey(color, size)
          const existing = prevByKey.get(key)
          next.push(existing ?? {
            color, size,
            sku: autoSku(skuPrefix, color, size, next.length),
            price: '', quantity: '0',
          })
        }
      }
      return next
    })
  }, [colors, sizes, skuPrefix])

  function updateRow(color: string, size: string, patch: Partial<MatrixRow>) {
    setRows(prev => prev.map(r => (r.color === color && r.size === size ? { ...r, ...patch } : r)))
  }

  function removeRow(color: string, size: string) {
    setRows(prev => prev.filter(r => !(r.color === color && r.size === size)))
  }

  function applyBulkPrice() {
    if (bulkPrice === '') return
    setRows(prev => prev.map(r => ({ ...r, price: bulkPrice })))
  }
  function applyBulkStock() {
    if (bulkStock === '') return
    setRows(prev => prev.map(r => ({ ...r, quantity: bulkStock })))
  }

  async function handleSave() {
    if (!productId || rows.length === 0) return
    setSaving(true)
    setSaveError(null)
    try {
      // 2-axis cap is also enforced server-side (product-variants.routes.ts)
      // — this is a fast client-side check so a mistake never round-trips.
      for (const r of rows) {
        const axisCount = [r.color, r.size].filter(Boolean).length
        if (axisCount > MAX_AXES) throw new Error(`Too many option axes on one row — maximum is ${MAX_AXES} (Color x Size).`)
        if (!r.sku.trim()) throw new Error('Every variant needs a SKU.')
      }

      const syncRows: VariantSyncRow[] = rows.map(r => ({
        sku: r.sku.trim(),
        name: [r.color, r.size].filter(Boolean).join(' / ') || 'Default',
        options: {
          ...(r.color ? { color: r.color } : {}),
          ...(r.size ? { size: r.size } : {}),
        },
        price: r.price !== '' ? Number(r.price) : null,
        quantity: r.quantity !== '' ? Number(r.quantity) : 0,
        track_stock: true,
      }))

      const result = await productVariantsService.sync(productId, syncRows)

      // Attach Color photos — resolve any deferred-upload blob: URLs to
      // real CDN URLs first (ImageUploader's upload mode never touches R2
      // until the parent explicitly resolves it), then attach the resolved
      // URL to every returned variant row sharing that color.
      const colorEntries = Object.entries(colorPhotos).filter(
        (entry): entry is [string, string] => !!entry[1],
      )
      if (colorEntries.length > 0) {
        const resolvedUrls = await draftMediaStore.resolveUrls(colorEntries.map(([, url]) => url))
        for (let i = 0; i < colorEntries.length; i++) {
          const color = colorEntries[i][0]
          const resolvedUrl = resolvedUrls[i]
          const variantIdsForColor = result.variants
            .filter(v => v.options?.color === color)
            .map(v => v.id)
          for (const variantId of variantIdsForColor) {
            await productVariantsService.attachMedia(productId, {
              variant_id: variantId,
              url: resolvedUrl,
              alt_text: color,
            })
          }
        }
      }

      toast.show({
        message: result.archived > 0
          ? `${result.synced} variant(s) saved, ${result.archived} archived`
          : `${result.synced} variant(s) saved`,
        variant: 'success',
      })
      onSynced?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save variants'
      setSaveError(message)
      toast.show({ message, variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (disabled) {
    return (
      <div className="cms-card p-5 space-y-2">
        <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Variants</h3>
        <p className="font-body text-xs text-[var(--text-muted)]">
          Save the product first, then add Color / Size variants here.
        </p>
      </div>
    )
  }

  return (
    <div className="cms-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Variants</h3>
        {rows.length > 0 && (
          <span className="font-body text-[11px] text-[var(--text-faint)]">{rows.length} combo(s)</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="cms-label">Colors</label>
          <TagInput value={colors} onChange={setColors} placeholder="Add color…" maxTags={20} />
        </div>
        <div className="space-y-1.5">
          <label className="cms-label">Sizes</label>
          <TagInput value={sizes} onChange={setSizes} placeholder="Add size…" maxTags={20} />
        </div>
      </div>

      {colors.length > 0 && (
        <div className="space-y-2">
          <label className="cms-label">Color Photos</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {colors.map(color => (
              <div key={color} className="space-y-1">
                <span className="font-body text-[11px] text-[var(--text-muted)]">{color}</span>
                <ImageUploader
                  value={colorPhotos[color] ?? null}
                  onChange={url => setColorPhotos(prev => ({ ...prev, [color]: url }))}
                  folder="products/variants"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-[var(--lito-border)] p-3">
            <div className="space-y-1">
              <label className="cms-label text-[11px]">Apply price to all</label>
              <input
                type="number"
                className="cms-input w-32 text-xs"
                value={bulkPrice}
                onChange={e => setBulkPrice(e.target.value)}
                placeholder="e.g. 150000"
              />
            </div>
            <button type="button" className="cms-btn cms-btn-ghost cms-btn-sm" onClick={applyBulkPrice}>
              Apply to All
            </button>
            <div className="space-y-1 ml-4">
              <label className="cms-label text-[11px]">Apply stock to all</label>
              <input
                type="number"
                className="cms-input w-24 text-xs"
                value={bulkStock}
                onChange={e => setBulkStock(e.target.value)}
                placeholder="e.g. 20"
              />
            </div>
            <button type="button" className="cms-btn cms-btn-ghost cms-btn-sm" onClick={applyBulkStock}>
              Apply to All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[var(--text-faint)] border-b border-[var(--lito-border)]">
                  {colors.length > 0 && <th className="py-1.5 pr-2 font-body font-medium">Color</th>}
                  {sizes.length > 0 && <th className="py-1.5 pr-2 font-body font-medium">Size</th>}
                  <th className="py-1.5 pr-2 font-body font-medium">SKU</th>
                  <th className="py-1.5 pr-2 font-body font-medium">Price</th>
                  <th className="py-1.5 pr-2 font-body font-medium">Stock</th>
                  <th className="py-1.5 font-body font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={rowKey(r.color, r.size)} className="border-b border-[var(--lito-border)] last:border-0">
                    {colors.length > 0 && <td className="py-1.5 pr-2 font-body">{r.color}</td>}
                    {sizes.length > 0 && <td className="py-1.5 pr-2 font-body">{r.size}</td>}
                    <td className="py-1.5 pr-2">
                      <input
                        type="text"
                        className="cms-input w-32 font-mono text-[11px]"
                        value={r.sku}
                        onChange={e => updateRow(r.color, r.size, { sku: e.target.value })}
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        type="number"
                        className="cms-input w-24 text-xs"
                        value={r.price}
                        onChange={e => updateRow(r.color, r.size, { price: e.target.value })}
                        placeholder="—"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        type="number"
                        className="cms-input w-20 text-xs"
                        value={r.quantity}
                        onChange={e => updateRow(r.color, r.size, { quantity: e.target.value })}
                      />
                    </td>
                    <td className="py-1.5">
                      <button
                        type="button"
                        onClick={() => removeRow(r.color, r.size)}
                        className="font-body text-[11px] text-[var(--s-danger)] hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {rows.length === 0 && colors.length === 0 && sizes.length === 0 && (
        <p className="font-body text-xs text-[var(--text-faint)]">
          Add at least one Color or Size above to build the variant matrix.
        </p>
      )}

      {saveError && (
        <div className="px-3 py-2 rounded-lg border border-[var(--cms-danger)] bg-[var(--cms-danger-bg)]" role="alert">
          <p className="font-body text-xs text-[var(--cms-danger)]">{saveError}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || rows.length === 0}
        className="cms-btn cms-btn-primary cms-btn-sm w-full justify-center disabled:opacity-50"
      >
        {saving ? 'Saving variants…' : 'Save Variants'}
      </button>
    </div>
  )
}
