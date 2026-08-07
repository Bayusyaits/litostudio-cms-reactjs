/**
 * CategorySelector — searchable-first (2026-07-22 user request: "semua
 * select option category, brand menggunakan select search" — same shared
 * `Combobox` BrandSelector.tsx already uses, for the same "type to find it"
 * UX on both). Backed by search_product_categories (migration
 * 20260722200000), which returns each match with its full ancestor path
 * ("Menswear & Underwear > Men's Tops > Shirts") since a bare category name
 * can exist under more than one parent.
 *
 * Kept the breadcrumb drill-down browser (this component's only mode
 * before this change) as a secondary "Browse" toggle rather than deleting
 * it — useful when a seller doesn't know/can't spell the exact category
 * name but does know roughly where it lives in the tree; search alone
 * can't serve that case.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Combobox } from '@litostudio/ui-cms'
import { productCategoryService, type ProductCategory } from '@/services/catalog.service'

interface CategorySelectorProps {
  id?: string
  value: string | null
  onChange: (categoryId: string | null) => void
}

export function CategorySelector({ id, value, onChange }: Readonly<CategorySelectorProps>) {
  const [search, setSearch] = useState('')
  const [browsing, setBrowsing] = useState(false)
  const trimmedSearch = search.trim()

  const { data: rootCategories, isFetching: loadingRootCategories } = useQuery({
    queryKey: ['product-categories-root'],
    queryFn: () => productCategoryService.getList('null'),
  })

  // ── Search mode (primary) ────────────────────────────────────────────────
  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ['product-category-search', search],
    queryFn: () => productCategoryService.search(trimmedSearch),
    enabled: trimmedSearch.length > 0,
  })

  // Resolve the currently-selected category by id too, and merge it into
  // the option list — otherwise the Combobox's own selected-label lookup
  // (`options.find(o => o.value === value)`) comes up empty the moment the
  // search text changes away from whatever produced that result, and an
  // already-set category would render blank instead of showing its name.
  const { data: selectedCategory } = useQuery({
    queryKey: ['product-category', value],
    queryFn: () => productCategoryService.getById(value!),
    enabled: !!value,
  })

  const defaultOptions = (rootCategories ?? []).map((category) => ({
    value: category.id,
    label: category.name,
    description: undefined,
  }))
  const searchOptions = (searchResults ?? []).map((category) => ({
    value: category.id,
    label: category.name,
    description: category.path,
  }))
  const baseOptions = trimmedSearch.length > 0 ? searchOptions : defaultOptions
  const options = value && selectedCategory && !baseOptions.some((option) => option.value === value)
    ? [{ value: selectedCategory.id, label: selectedCategory.name, description: undefined }, ...baseOptions]
    : baseOptions

  // ── Browse mode (secondary, tree drill-down) ─────────────────────────────
  const [trail, setTrail] = useState<ProductCategory[]>([])
  const currentParentId = trail.length > 0 ? trail[trail.length - 1]!.id : null

  const { data: browseData, isLoading: browseLoading } = useQuery({
    queryKey: ['product-categories', currentParentId ?? 'root'],
    queryFn: () => productCategoryService.getList(currentParentId ?? 'null'),
    enabled: browsing,
  })
  const browseCategories = browseData ?? []

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Combobox
            id={id}
            value={value}
            onChange={(nextId) => onChange(nextId || null)}
            options={options}
            loading={trimmedSearch.length > 0 ? searching : loadingRootCategories}
            onSearchChange={setSearch}
            placeholder="Search categories…"
          />
        </div>
        <button type="button" className="cms-btn cms-btn-ghost cms-btn-sm whitespace-nowrap" onClick={() => setBrowsing((b) => !b)}>
          {browsing ? 'Close' : 'Browse'}
        </button>
      </div>

      {browsing && (
        <div className="cms-card p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[12px] flex-wrap">
            <button type="button" className="cms-btn cms-btn-ghost cms-btn-sm" onClick={() => setTrail([])}>All categories</button>
            {trail.map((t, i) => (
              <span key={t.id} className="flex items-center gap-1.5">
                <span className="text-[var(--text-muted)]">/</span>
                <button type="button" className="cms-btn cms-btn-ghost cms-btn-sm" onClick={() => setTrail(trail.slice(0, i + 1))}>{t.name}</button>
              </span>
            ))}
          </div>

          {browseLoading && <p className="font-body text-xs text-[var(--text-muted)]">Loading…</p>}
          {!browseLoading && browseCategories.length === 0 && (
            <p className="font-body text-xs text-[var(--text-faint)]">No sub-categories here.</p>
          )}

          <div className="max-h-64 overflow-y-auto divide-y divide-[var(--lito-border)]">
            {browseCategories.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-1.5">
                <span className="font-body text-sm">{c.name}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="font-body text-[11px] text-[var(--text-muted)] hover:underline"
                    onClick={() => setTrail((prev) => [...prev, c])}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className="cms-btn cms-btn-primary cms-btn-sm"
                    onClick={() => { onChange(c.id); setBrowsing(false) }}
                  >
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>

          {trail.length > 0 && (
            <button
              type="button"
              className="font-body text-[11px] text-[var(--text-muted)] hover:underline"
              onClick={() => { const parent = trail[trail.length - 1]!; onChange(parent.id); setBrowsing(false) }}
            >
              Use "{trail[trail.length - 1]!.name}" itself
            </button>
          )}
        </div>
      )}
    </div>
  )
}
