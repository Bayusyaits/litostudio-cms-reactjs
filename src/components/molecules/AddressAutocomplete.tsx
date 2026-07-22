// apps/cms/src/components/molecules/AddressAutocomplete.tsx
// "Type a village, district, or postal code, get the full
// province/regency/district/village/postal-code chain back, pick one,
// everything auto-fills" — the ONLY way to set a shipping origin's address
// region (manual province/regency/district/village selects were removed).
// Only villages with a resolvable postal code are searchable (~72%
// coverage — see migrations/20260721220000_wilayah_postal_code_search.sql).
import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Combobox, type ComboboxOption } from '@litostudio/ui-cms'
import { wilayahService, type WilayahSearchResult } from '@/services/wilayah.service'

interface Props {
  onSelect: (result: WilayahSearchResult) => void
}

export function AddressAutocomplete({ onSelect }: Props) {
  const [search, setSearch] = useState('')
  // Combobox only gives back the selected option's `value` string — keep
  // the last search results around so onChange can look up the full
  // WilayahSearchResult (province/regency/district ids etc.) by village_id.
  const resultsRef = useRef<WilayahSearchResult[]>([])

  const query = useQuery({
    queryKey: ['wilayah-search', search],
    queryFn: () => wilayahService.search(search),
    enabled: search.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  })
  resultsRef.current = query.data ?? []

  const options: ComboboxOption[] = resultsRef.current.map((r) => ({
    value: String(r.village_id),
    label: `${r.village_name}, ${r.district_name} — ${r.postal_code}`,
    description: `${r.regency_name}, ${r.province_name}`,
  }))

  return (
    <div className="space-y-1.5">
      <label className="cms-label">Quick address search <span className="font-normal text-[var(--text-faint)]">(village, district, or postal code)</span></label>
      <Combobox
        value={null}
        onChange={(value) => {
          const result = resultsRef.current.find((r) => String(r.village_id) === value)
          if (result) onSelect(result)
          setSearch('')
        }}
        onSearchChange={setSearch}
        loading={query.isFetching}
        options={options}
        placeholder="e.g. Cipulir, Kebayoran Lama, or 12230"
      />
    </div>
  )
}
