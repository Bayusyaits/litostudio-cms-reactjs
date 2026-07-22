// apps/cms/src/modules/shipping/ShippingOriginForm.tsx
// Add/edit form for a single site_shipping_origins row. The address region
// (province/regency/district/village/postal code) is set entirely via the
// single-field AddressAutocomplete search — no manual cascading selects —
// used by both the "Add origin" and "Edit origin" flows in
// ShippingOriginsPageView. Owns its own field state (self-contained; only
// the final payload/edit-id round-trips back up via onSubmit).

import { useState } from 'react'
import { FormField } from '@litostudio/ui-cms'
import { Switch } from '@/components/atoms/Switch'
import { AddressAutocomplete } from '@/components/molecules/AddressAutocomplete'
import type { WilayahSearchResult } from '@/services/wilayah.service'
import type { ShippingOrigin, ShippingOriginPayload } from '@/services/shipping-origins.service'

interface Props {
  initial?: ShippingOrigin | null
  onSubmit: (payload: ShippingOriginPayload) => void
  onCancel: () => void
  submitting: boolean
  error: string | null
}

export function ShippingOriginForm({ initial, onSubmit, onCancel, submitting, error }: Props) {
  const [label, setLabel]               = useState(initial?.label ?? '')
  const [addressLine, setAddressLine]   = useState(initial?.address_line ?? '')
  const [provinceId, setProvinceId]     = useState<number | null>(initial?.province?.id ?? null)
  const [provinceName, setProvinceName] = useState(initial?.province?.name ?? '')
  const [regencyId, setRegencyId]       = useState<number | null>(initial?.regency?.id ?? null)
  const [regencyName, setRegencyName]   = useState(initial?.regency?.name ?? '')
  const [districtId, setDistrictId]     = useState<number | null>(initial?.district?.id ?? null)
  const [districtName, setDistrictName] = useState(initial?.district?.name ?? '')
  const [villageId, setVillageId]       = useState<number | null>(initial?.village?.id ?? null)
  const [villageName, setVillageName]   = useState(initial?.village?.name ?? '')
  const [postalCode, setPostalCode]     = useState(initial?.postal_code ?? '')
  const [contactName, setContactName]   = useState(initial?.contact_name ?? '')
  const [contactPhone, setContactPhone] = useState(initial?.contact_phone ?? '')
  const [latitude, setLatitude]         = useState(initial?.latitude != null ? String(initial.latitude) : '')
  const [longitude, setLongitude]       = useState(initial?.longitude != null ? String(initial.longitude) : '')
  const [isDefault, setIsDefault]       = useState(initial?.is_default ?? false)

  // Search-only: one pick fills all 4 wilayah levels + postal code.
  function handleAddressAutocomplete(result: WilayahSearchResult) {
    setProvinceId(result.province_id)
    setProvinceName(result.province_name)
    setRegencyId(result.regency_id)
    setRegencyName(result.regency_name)
    setDistrictId(result.district_id)
    setDistrictName(result.district_name)
    setVillageId(result.village_id)
    setVillageName(result.village_name)
    setPostalCode(result.postal_code)
  }

  const canSubmit = label.trim() && addressLine.trim() && provinceId && regencyId && districtId && postalCode.trim().length >= 5

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !provinceId || !regencyId || !districtId) return
    onSubmit({
      label: label.trim(),
      address_line: addressLine.trim(),
      province_id: provinceId,
      regency_id: regencyId,
      district_id: districtId,
      village_id: villageId,
      postal_code: postalCode.trim(),
      contact_name: contactName.trim() || undefined,
      contact_phone: contactPhone.trim() || undefined,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      is_default: isDefault,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="cms-card p-5 space-y-4">
      <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">
        {initial ? 'Edit shipping origin' : 'Add shipping origin'}
      </h3>

      <FormField label="Label" required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Gudang Jakarta" maxLength={120} />

      <FormField label="Street address" required value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="Jl. Sudirman No. 1" maxLength={500} />

      <AddressAutocomplete onSelect={handleAddressAutocomplete} />

      {provinceId
        ? (
            <div className="rounded-lg border border-[var(--cms-border)] bg-[var(--cms-surface-alt)] px-3 py-2 space-y-0.5">
              <p className="font-body text-xs text-[var(--text-primary)]">
                {[villageName, districtName, regencyName, provinceName].filter(Boolean).join(', ')}
              </p>
              <p className="font-body text-xs text-[var(--text-muted)]">Postal code: {postalCode}</p>
            </div>
          )
        : (
            <p className="font-body text-xs text-[var(--text-muted)]">Search and select an address above to set the region.</p>
          )}

      <div className="grid grid-cols-2 gap-2">
        <FormField label="Contact name" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Warehouse PIC" />
        <FormField label="Contact phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+62…" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="cms-label">Coordinates <span className="font-normal text-[var(--text-faint)]">(required to book couriers via Biteship)</span></label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FormField label="Latitude" type="number" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="-6.208763" />
          <FormField label="Longitude" type="number" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="106.845599" />
        </div>
        <p className="font-body text-xs text-[var(--text-muted)]">Paste from a Google Maps pin (right-click a location → click the coordinates to copy).</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-body text-xs text-[var(--text-primary)]">Default origin for this site</span>
        <Switch checked={isDefault} onChange={setIsDefault} />
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg border border-[var(--cms-danger)] bg-[var(--cms-danger-bg)]" role="alert">
          <p className="font-body text-xs text-[var(--cms-danger)]">{error}</p>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="cms-btn cms-btn-ghost cms-btn-sm">Cancel</button>
        <button type="submit" disabled={!canSubmit || submitting} className="cms-btn cms-btn-primary cms-btn-sm">
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Add origin'}
        </button>
      </div>
    </form>
  )
}
