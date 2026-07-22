/**
 * CategorySelector — browses the Global Category Master tree level-by-level
 * (breadcrumb drill-down, no dedicated tree widget exists in this codebase
 * yet — see apps/cms-superadmin's CategoriesPage.tsx for the same
 * precedent) and lets the seller pick ANY level as the product's category
 * (a top-level pick is valid — not every product needs a leaf-level category).
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productCategoryService, type ProductCategory } from '@/services/catalog.service'

interface CategorySelectorProps {
  value: string | null
  onChange: (categoryId: string | null, category: ProductCategory | null) => void
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const [trail, setTrail] = useState<ProductCategory[]>([])
  const currentParentId = trail.length > 0 ? trail[trail.length - 1]!.id : null

  const { data, isLoading } = useQuery({
    queryKey: ['product-categories', currentParentId ?? 'root'],
    queryFn: () => productCategoryService.getList(currentParentId ?? 'null'),
  })
  const categories = data ?? []

  // If a category is already selected (editing an existing product) and we
  // haven't navigated anywhere yet, show its name via a direct lookup so the
  // field doesn't render blank before the user opens the browser.
  const { data: selectedCategory } = useQuery({
    queryKey: ['product-category', value],
    queryFn: () => productCategoryService.getById(value!),
    enabled: !!value,
  })

  const [browsing, setBrowsing] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="cms-input flex-1 flex items-center text-sm">
          {selectedCategory ? selectedCategory.name : <span className="text-[var(--text-faint)]">No category selected</span>}
        </div>
        <button type="button" className="cms-btn cms-btn-ghost cms-btn-sm" onClick={() => setBrowsing((b) => !b)}>
          {browsing ? 'Close' : 'Browse'}
        </button>
        {value && (
          <button type="button" className="cms-btn cms-btn-ghost cms-btn-sm" onClick={() => onChange(null, null)}>
            Clear
          </button>
        )}
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

          {isLoading && <p className="font-body text-xs text-[var(--text-muted)]">Loading…</p>}
          {!isLoading && categories.length === 0 && (
            <p className="font-body text-xs text-[var(--text-faint)]">No sub-categories here.</p>
          )}

          <div className="max-h-64 overflow-y-auto divide-y divide-[var(--lito-border)]">
            {categories.map((c) => (
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
                    onClick={() => { onChange(c.id, c); setBrowsing(false) }}
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
              onClick={() => { const parent = trail[trail.length - 1]!; onChange(parent.id, parent); setBrowsing(false) }}
            >
              Use "{trail[trail.length - 1]!.name}" itself
            </button>
          )}
        </div>
      )}
    </div>
  )
}
