/**
 * SkuGenerator — "Generate SKU" button, TASK-PRODUCT-EDITOR.md: "Seller
 * should not manually create SKU." Calls the backend generator
 * (CATEGORY-BRAND-PRODUCT-VARIANT-SEQUENCE format) and fills the SKU input.
 * The result is still a plain editable text field — this only pre-fills it.
 */
import { useState } from 'react'
import { Button } from '@litostudio/ui-cms'
import { skuGeneratorService } from '@/services/catalog.service'

interface SkuGeneratorProps {
  categoryId: string | null
  brandId: string | null
  productName: string
  variantOptions?: Record<string, string> | null
  onGenerated: (sku: string) => void
}

export function SkuGenerator({ categoryId, brandId, productName, variantOptions, onGenerated }: SkuGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    if (!productName.trim()) {
      setError('Enter a product name first')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const sku = await skuGeneratorService.generate({
        category_id: categoryId,
        brand_id: brandId,
        product_name: productName,
        variant_options: variantOptions,
      })
      onGenerated(sku)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate SKU')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button skin="cms" type="button" variant="secondary" size="sm" loading={loading} onClick={handleGenerate}>
        Generate SKU
      </Button>
      {error && <span className="font-body text-[11px] text-[var(--s-danger)]">{error}</span>}
    </div>
  )
}
