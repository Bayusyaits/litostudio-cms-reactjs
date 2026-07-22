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
  value: string | null
  categoryId: string | null
  onChange: (brandId: string | null) => void
}

export function BrandSelector({ value, categoryId, onChange }: BrandSelectorProps) {
  const [search, setSearch] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [requestName, setRequestName] = useState('')
  const [requestNotes, setRequestNotes] = useState('')
  const [requestStatus, setRequestStatus] = useState<'idle' | 'saving' | 'sent' | 'error'>('idle')

  const { data, isFetching } = useQuery({
    queryKey: ['brand-search', search, categoryId],
    queryFn: () => brandService.search(search, categoryId),
  })
  const brands = data ?? []

  const options = brands.map((b) => ({ value: b.id, label: b.name, ...(b.logo_url ? { avatar: b.logo_url } : {}) }))

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
        value={value}
        onChange={onChange}
        options={options}
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
