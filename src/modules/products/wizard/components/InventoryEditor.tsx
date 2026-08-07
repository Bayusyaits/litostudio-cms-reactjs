/**
 * InventoryEditor — product-level stock for products with NO variant
 * matrix (services/packages don't track stock; simple physical products
 * do). Products WITH variants track stock per-variant instead, inside
 * VariantsCard — this component is the no-variant counterpart, backed by
 * the new PUT /:productId/inventory route (product_inventory, variant_id
 * IS NULL row).
 */
interface InventoryEditorProps {
  productId: string | null
  hasVariants: boolean
  sortOrder: string
  onSortOrderChange: (value: string) => void
  quantity: string
  onQuantityChange: (value: string) => void
  trackStock: boolean
  onTrackStockChange: (value: boolean) => void
  minStock: string
  onMinStockChange: (value: string) => void
}

export function InventoryEditor({
  productId,
  hasVariants,
  sortOrder,
  onSortOrderChange,
  quantity,
  onQuantityChange,
  trackStock,
  onTrackStockChange,
  minStock,
  onMinStockChange,
}: Readonly<InventoryEditorProps>) {
  if (!productId) {
    return (
      <div className="cms-card p-5">
        <p className="font-body text-xs text-[var(--text-muted)]">Save the product's basic info first, then set its stock here.</p>
      </div>
    )
  }

  return (
    <div className="cms-card p-5 space-y-4">
      <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Inventory</h3>
      {hasVariants && (
        <p className="font-body text-xs text-[var(--text-muted)]">
          This product has variants. Variant stock is managed in the Variants step. You can still set product-level fallback stock here.
        </p>
      )}
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={trackStock} onChange={(e) => onTrackStockChange(e.target.checked)} />
        <span className="font-body text-sm">Track stock for this product</span>
      </label>
      {trackStock && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 max-w-[760px]">
          <div className="space-y-1.5">
            <label className="cms-label" htmlFor="inventory-sort-order">Order <span className="text-[var(--s-danger)]">*</span></label>
            <input
              id="inventory-sort-order"
              type="number"
              min={0}
              className="cms-input w-full max-w-[260px]"
              value={sortOrder}
              onChange={(e) => onSortOrderChange(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <label className="cms-label" htmlFor="inventory-quantity">Quantity <span className="text-[var(--s-danger)]">*</span></label>
            <input
              id="inventory-quantity"
              type="number"
              min={0}
              className="cms-input w-full max-w-[260px]"
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="cms-label" htmlFor="inventory-min-stock">Minimum Stock</label>
            <input
              id="inventory-min-stock"
              type="number"
              min={0}
              className="cms-input w-full max-w-[260px]"
              value={minStock}
              onChange={(e) => onMinStockChange(e.target.value)}
              placeholder="e.g. 5"
            />
          </div>
        </div>
      )}
      <p className="font-body text-xs text-[var(--text-muted)]">
        Inventory changes follow the main save flow via Save Draft / Publish.
      </p>
    </div>
  )
}
