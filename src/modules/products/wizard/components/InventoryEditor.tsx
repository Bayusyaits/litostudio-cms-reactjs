/**
 * InventoryEditor — product-level stock for products with NO variant
 * matrix (services/packages don't track stock; simple physical products
 * do). Products WITH variants track stock per-variant instead, inside
 * VariantsCard — this component is the no-variant counterpart, backed by
 * the new PUT /:productId/inventory route (product_inventory, variant_id
 * IS NULL row).
 */
import { useEffect, useState } from 'react'
import { productInventoryService } from '@/services/catalog.service'
import type { Product } from '@/types/content.types'

interface InventoryEditorProps {
  productId: string | null
  product?: Product
  hasVariants: boolean
}

export function InventoryEditor({ productId, product, hasVariants }: InventoryEditorProps) {
  const productLevelInventory = product?.inventory?.find((i) => i.variant_id === null)
  const [quantity, setQuantity] = useState(String(productLevelInventory?.quantity ?? 0))
  const [trackStock, setTrackStock] = useState(productLevelInventory?.track_stock ?? true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (productLevelInventory) {
      setQuantity(String(productLevelInventory.quantity))
      setTrackStock(productLevelInventory.track_stock)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product])

  if (hasVariants) {
    return (
      <div className="cms-card p-5">
        <p className="font-body text-xs text-[var(--text-muted)]">This product has variants — stock is tracked per-variant in the Variants step instead.</p>
      </div>
    )
  }

  if (!productId) {
    return (
      <div className="cms-card p-5">
        <p className="font-body text-xs text-[var(--text-muted)]">Save the product's basic info first, then set its stock here.</p>
      </div>
    )
  }

  async function handleSave() {
    if (!productId) return
    setSaving(true)
    setSaved(false)
    try {
      await productInventoryService.set(productId, Number(quantity) || 0, trackStock)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="cms-card p-5 space-y-3">
      <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Inventory</h3>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={trackStock} onChange={(e) => setTrackStock(e.target.checked)} />
        <span className="font-body text-sm">Track stock for this product</span>
      </label>
      {trackStock && (
        <div className="space-y-1.5 max-w-[160px]">
          <label className="cms-label">Quantity</label>
          <input type="number" min={0} className="cms-input w-full" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
      )}
      {saved && <p className="font-body text-xs text-[var(--s-pub-fg)]">Saved</p>}
      <button type="button" className="cms-btn cms-btn-primary cms-btn-sm" disabled={saving} onClick={handleSave}>
        {saving ? 'Saving…' : 'Save Inventory'}
      </button>
    </div>
  )
}
