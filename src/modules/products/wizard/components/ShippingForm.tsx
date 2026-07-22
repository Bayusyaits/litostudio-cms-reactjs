/** ShippingForm — physical-good shipping fields. Hidden entirely for digital products (no shipping step in checkout). */
interface ShippingFormValues {
  isDigital: boolean
  digitalFileUrl: string
  weightGrams: string
  lengthCm: string
  widthCm: string
  heightCm: string
  biteshipCategory: string
}

interface ShippingFormProps {
  values: ShippingFormValues
  onChange: <K extends keyof ShippingFormValues>(key: K, value: ShippingFormValues[K]) => void
}

export function ShippingForm({ values, onChange }: ShippingFormProps) {
  return (
    <div className="cms-card p-5 space-y-4">
      <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Shipping</h3>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={values.isDigital} onChange={(e) => onChange('isDigital', e.target.checked)} />
        <span className="font-body text-sm">Digital product (no shipping required)</span>
      </label>

      {values.isDigital ? (
        <div className="space-y-1.5">
          <label className="cms-label">Digital File URL</label>
          <input type="text" className="cms-input w-full" value={values.digitalFileUrl} onChange={(e) => onChange('digitalFileUrl', e.target.value)} placeholder="https://…" />
          <p className="font-body text-[10.5px] text-[var(--text-faint)]">Sent to the buyer by email after payment clears — never shown on the public product page.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="cms-label">Weight (grams)</label>
              <input type="number" className="cms-input w-full" value={values.weightGrams} onChange={(e) => onChange('weightGrams', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="cms-label">Biteship Category</label>
              <input type="text" className="cms-input w-full" value={values.biteshipCategory} onChange={(e) => onChange('biteshipCategory', e.target.value)} placeholder="e.g. fashion" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="cms-label">Length (cm)</label>
              <input type="number" className="cms-input w-full" value={values.lengthCm} onChange={(e) => onChange('lengthCm', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="cms-label">Width (cm)</label>
              <input type="number" className="cms-input w-full" value={values.widthCm} onChange={(e) => onChange('widthCm', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="cms-label">Height (cm)</label>
              <input type="number" className="cms-input w-full" value={values.heightCm} onChange={(e) => onChange('heightCm', e.target.value)} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
