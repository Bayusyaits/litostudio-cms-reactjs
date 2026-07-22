/** PricingForm — base price, compare-at price, featured flag, and the
 * pre-order affordance from the TikTok Shop/Tokopedia reference screenshots.
 * Discounts/promotions are handled by the existing Promotions module — out
 * of scope here to avoid duplicating that system. */
interface PricingFormValues {
  price: string
  compareAtPrice: string
  currency: string
  isFeatured: boolean
  preOrder: boolean
  daysToShip: string
}

interface PricingFormProps {
  values: PricingFormValues
  onChange: <K extends keyof PricingFormValues>(key: K, value: PricingFormValues[K]) => void
}

export function PricingForm({ values, onChange }: PricingFormProps) {
  return (
    <div className="cms-card p-5 space-y-4">
      <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Pricing</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="cms-label">Price</label>
          <input type="number" className="cms-input w-full" value={values.price} onChange={(e) => onChange('price', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="cms-label">Compare-at Price</label>
          <input type="number" className="cms-input w-full" value={values.compareAtPrice} onChange={(e) => onChange('compareAtPrice', e.target.value)} placeholder="Optional — shown as a strikethrough" />
        </div>
      </div>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={values.isFeatured} onChange={(e) => onChange('isFeatured', e.target.checked)} />
        <span className="font-body text-sm">Featured product</span>
      </label>

      <div className="rounded-lg border border-[var(--lito-border)] p-3 space-y-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={values.preOrder} onChange={(e) => onChange('preOrder', e.target.checked)} />
          <span className="font-body text-sm">Pre-order</span>
        </label>
        {values.preOrder && (
          <div className="space-y-1.5 max-w-[160px]">
            <label className="cms-label">Days to ship</label>
            <input type="number" min={1} className="cms-input w-full" value={values.daysToShip} onChange={(e) => onChange('daysToShip', e.target.value)} />
          </div>
        )}
      </div>
    </div>
  )
}
