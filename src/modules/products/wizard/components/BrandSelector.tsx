/**
 * BrandSelector — "Is your brand one of these?" search-to-pick, matching
 * the TikTok Shop/Tokopedia seller-center reference screenshots. Falls back
 * to a "Request a new brand" mini-form (brand_requests review queue) when a
 * seller's brand isn't in the Global Brand Master yet.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Combobox } from '@litostudio/ui-cms'
import { brandService } from '@/services/catalog.service'

interface BrandSelectorProps {
  id?: string
  value: string | null
  categoryId: string | null
  onChange: (brandId: string | null) => void
}

export function BrandSelector({ id, value, categoryId, onChange }: Readonly<BrandSelectorProps>) {
  const [search, setSearch] = useState('')
  const trimmedSearch = search.trim()
  const [requesting, setRequesting] = useState(false)
  const [requestName, setRequestName] = useState('')
  const [requestNotes, setRequestNotes] = useState('')
  const [requestStatus, setRequestStatus] = useState<'idle' | 'saving' | 'sent' | 'error'>('idle')

  const { data: brands, isFetching } = useQuery({
    queryKey: ['brand-search', trimmedSearch, categoryId],
    queryFn: () => brandService.search(trimmedSearch, categoryId),
  })

  const { data: selectedBrand } = useQuery({
    queryKey: ['brand', value],
    queryFn: () => brandService.getById(value!),
    enabled: !!value,
  })

  const options = (brands ?? []).map((brand) => ({
    value: brand.id,
    label: brand.name,
    ...(brand.logo_url ? { avatar: brand.logo_url } : {}),
  }))

  const mergedOptions = value && selectedBrand && !options.some((option) => option.value === value)
    ? [{ value: selectedBrand.id, label: selectedBrand.name, ...(selectedBrand.logo_url ? { avatar: selectedBrand.logo_url } : {}) }, ...options]
    : options

  async function submitRequest() {
    if (!requestName.trim()) return
    setRequestStatus('saving')
    try {
      await brandService.requestNew({ requested_name: requestName.trim(), requested_category_id: categoryId, notes: requestNotes.trim() || null })
      setRequestStatus('sent')
    } catch {
      setRequestStatus('error')
    }
  }

  return (
    <div className="space-y-2">
      <Combobox
        id={id}
        value={value}
        onChange={(brandId) => onChange(brandId || null)}
        options={mergedOptions}
        loading={isFetching}
        onSearchChange={setSearch}
        placeholder="Search brands…"
      />
      <button type="button" className="font-body text-[11px] text-[var(--text-muted)] hover:underline" onClick={() => setRequesting((r) => !r)}>
        Can't find your brand? Request it be added
      </button>

      {requesting && (
        <div className="cms-card p-3 space-y-2">
          {requestStatus === 'sent' ? (
            <p className="font-body text-xs text-[var(--s-pub-fg)]">Request submitted — a platform admin will review it.</p>
          ) : (
            <>
              <input
                type="text"
                className="cms-input w-full text-sm"
                placeholder="Brand name"
                value={requestName}
                onChange={(e) => setRequestName(e.target.value)}
              />
              <textarea
                className="cms-input w-full text-sm"
                placeholder="Notes (optional) — e.g. official website, distributor info"
                rows={2}
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
              />
              {requestStatus === 'error' && <p className="font-body text-[11px] text-[var(--s-danger)]">Failed to submit — try again.</p>}
              <button
                type="button"
                className="cms-btn cms-btn-primary cms-btn-sm"
                disabled={!requestName.trim() || requestStatus === 'saving'}
                onClick={submitRequest}
              >
                {requestStatus === 'saving' ? 'Submitting…' : 'Submit request'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
