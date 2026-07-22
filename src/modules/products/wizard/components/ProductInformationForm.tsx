/**
 * ProductInformationForm — name, SKU, description, type, tags.
 *
 * 2026-07-22: the visible "Slug" editor was replaced with a SKU field +
 * "Generate SKU" button (user request — same generator VariantsCard already
 * uses for per-variant SKUs, see sku-generator.ts). Slug still exists and
 * still auto-generates from the product name in the background
 * (ProductWizardPage.tsx's slugify() effect, unchanged) since it's
 * load-bearing for public product-page routing (NOT NULL + UNIQUE(site_id,
 * slug), consumed directly by apps/website's /products/:slug route) — it
 * was never removed from the DB or from what gets saved, only hidden from
 * this form since editors don't need to hand-edit it day to day.
 */
import { useState } from 'react'
import { TagInput } from '@/components/molecules/TagInput'
import { skuGeneratorService } from '@/services/catalog.service'
import type { ProductType } from '@/types/content.types'

const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: 'product', label: 'Physical / Digital Product' },
  { value: 'service', label: 'Service' },
  { value: 'package', label: 'Package' },
]

interface ProductInformationFormValues {
  name: string
  sku: string
  description: string
  productType: ProductType
  tags: string[]
}

interface ProductInformationFormProps {
  values: ProductInformationFormValues
  onChange: <K extends keyof ProductInformationFormValues>(key: K, value: ProductInformationFormValues[K]) => void
  categoryId?: string | null
  brandId?: string | null
}

export function ProductInformationForm({ values, onChange, categoryId, brandId }: ProductInformationFormProps) {
  const [generating, setGenerating] = useState(false)

  async function handleGenerateSku() {
    if (!values.name.trim() || generating) return
    setGenerating(true)
    try {
      const sku = await skuGeneratorService.generate({
        category_id: categoryId ?? null,
        brand_id: brandId ?? null,
        product_name: values.name,
      })
      onChange('sku', sku)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="cms-card p-5 space-y-4">
      <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Product Information</h3>

      <div className="space-y-1.5">
        <label className="cms-label">Product Name</label>
        <input type="text" className="cms-input w-full" value={values.name} onChange={(e) => onChange('name', e.target.value)} placeholder="e.g. Classic Cotton T-Shirt" />
      </div>

      <div className="space-y-1.5">
        <label className="cms-label">SKU</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="cms-input w-full font-mono text-[12px]"
            value={values.sku}
            onChange={(e) => onChange('sku', e.target.value)}
            placeholder="e.g. FS-NIKE-SHIRT-0001"
          />
          <button
            type="button"
            onClick={() => void handleGenerateSku()}
            disabled={generating || !values.name.trim()}
            className="cms-btn cms-btn-ghost cms-btn-sm whitespace-nowrap disabled:opacity-50"
            title={!values.name.trim() ? 'Enter a product name first' : 'Generate a unique SKU'}
          >
            {generating ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="cms-label">Description</label>
        <textarea className="cms-input w-full" rows={5} value={values.description} onChange={(e) => onChange('description', e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <label className="cms-label">Type</label>
        <select className="cms-input w-full" value={values.productType} onChange={(e) => onChange('productType', e.target.value as ProductType)}>
          {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="cms-label">Tags</label>
        <TagInput value={values.tags} onChange={(tags) => onChange('tags', tags)} placeholder="Add tag…" />
      </div>
    </div>
  )
}
