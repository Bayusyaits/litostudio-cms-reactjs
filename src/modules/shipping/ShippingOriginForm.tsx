// apps/cms/src/modules/shipping/ShippingOriginForm.tsx
// Add/edit form for a single site_shipping_origins row — cascading
// province -> regency -> district -> village selects (wilayahService),
// used by both the "Add origin" and "Edit origin" flows in
// ShippingOriginsPageView. Owns its own field state + wilayah queries
// (self-contained reference-data lookups, not app state the page container
// needs to know about) — only the final payload/edit-id round-trips back up
// via onSubmit.

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FormField } from '@litostudio/ui-cms'
import { Switch } from '@/components/atoms/Switch'
import { wilayahService } from '@/services/wilayah.service'
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
  const [regencyId, setRegencyId]       = useState<number | null>(initial?.regency?.id ?? null)
  const [districtId, setDistrictId]     = useState<number | null>(initial?.district?.id ?? null)
  const [villageId, setVillageId]       = useState<number | null>(initial?.village?.id ?? null)
  const [postalCode, setPostalCode]     = useState(initial?.postal_code ?? '')
  const [contactName, setContactName]   = useState(initial?.contact_name ?? '')
  const [contactPhone, setContactPhone] = useState(initial?.contact_phone ?? '')
  const [latitude, setLatitude]         = useState(initial?.latitude != null ? String(initial.latitude) : '')
  const [longitude, setLongitude]       = useState(initial?.longitude != null ? String(initial.longitude) : '')
  const [isDefault, setIsDefault]       = useState(initial?.is_default ?? false)

  const { data: provinces }  = useQuery({ queryKey: ['wilayah-provinces'], queryFn: () => wilayahService.getProvinces(), staleTime: 60 * 60 * 1000 })
  const { data: regencies }  = useQuery({ queryKey: ['wilayah-regencies', provinceId], queryFn: () => wilayahService.getRegencies(provinceId!), enabled: !!provinceId, staleTime: 60 * 60 * 1000 })
  const { data: districts }  = useQuery({ queryKey: ['wilayah-districts', regencyId], queryFn: () => wilayahService.getDistricts(regencyId!), enabled: !!regencyId, staleTime: 60 * 60 * 1000 })
  const { data: villages }   = useQuery({ queryKey: ['wilayah-villages', districtId], queryFn: () => wilayahService.getVillages(districtId!), enabled: !!districtId, staleTime: 60 * 60 * 1000 })

  // Reset dependent selects when a parent level changes to something that no
  // longer matches (but NOT on first mount when hydrating from `initial` —
  // that's why this only fires on user-driven provinceId/regencyId/districtId
  // changes further down via the onChange handlers themselves, not an effect).

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

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <label className="cms-label">Province <span className="text-[var(--s-danger)] ml-0.5">*</span></label>
          <select
            className="cms-input w-full"
            value={provinceId ?? ''}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : null
              setProvinceId(v); setRegencyId(null); setDistrictId(null); setVillageId(null)
            }}
          >
            <option value="">— Select —</option>
            {(provinces ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="cms-label">Regency / City <span className="text-[var(--s-danger)] ml-0.5">*</span></label>
          <select
            className="cms-input w-full"
            value={regencyId ?? ''}
            disabled={!provinceId}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : null
              setRegencyId(v); setDistrictId(null); setVillageId(null)
            }}
          >
            <option value="">— Select —</option>
            {(regencies ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <label className="cms-label">District <span className="text-[var(--s-danger)] ml-0.5">*</span></label>
          <select
            className="cms-input w-full"
            value={districtId ?? ''}
            disabled={!regencyId}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : null
              setDistrictId(v); setVillageId(null)
            }}
          >
            <option value="">— Select —</option>
            {(districts ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="cms-label">Village <span className="font-normal text-[var(--text-faint)]">(optional)</span></label>
          <select
            className="cms-input w-full"
            value={villageId ?? ''}
            disabled={!districtId}
            onChange={(e) => setVillageId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">— None —</option>
            {(villages ?? []).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
      </div>

      <FormField label="Postal code" required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="12190" maxLength={10} />

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
