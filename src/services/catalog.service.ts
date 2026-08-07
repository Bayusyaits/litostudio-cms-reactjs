// Global Product Category / Attribute / Brand Master clients — product-
// editor rebuild, grill-me session 2026-07-22. These are GLOBAL reference
// tables (no site_id) — every org reads the same catalog; writes only exist
// on the superadmin side (apps/cms-superadmin). CMS is read-only here, plus
// the "request a new brand" submit flow and the product-scoped dynamic
// attribute values / no-variant inventory / SKU generator endpoints.
import { http } from '@litostudio/ui-cms'
import type { ApiResponse } from '@/types/api.types'

export interface ProductCategory {
  id: string
  parent_id: string | null
  name: string
  slug: string
  description: string | null
  icon: string | null
  image_url: string | null
  sku_code: string | null
  sort_order: number
  status: 'active' | 'inactive'
}

/** A search result — a category plus its full ancestor path, e.g. "Menswear
 *  & Underwear > Men's Tops > Shirts" (search_product_categories RPC,
 *  20260722200000). Distinct from ProductCategory (the tree-browse shape)
 *  since a search hit has no meaningful parent_id/slug/etc. to the caller —
 *  it only needs a label. */
export interface ProductCategorySearchResult {
  id: string
  name: string
  path: string
}

export const productCategoryService = {
  async getList(parentId?: string | null): Promise<ProductCategory[]> {
    const params = new URLSearchParams()
    if (parentId !== undefined) params.set('parent_id', parentId ?? 'null')
    const query = params.toString()
    const data = await http.get<{ success: boolean; data: ProductCategory[] }>(
      `/api/v1/cms/content/product-categories${query ? `?${query}` : ''}`,
    )
    return data.data ?? []
  },

  async getById(id: string): Promise<ProductCategory> {
    const data = await http.get<ApiResponse<ProductCategory>>(`/api/v1/cms/content/product-categories/${id}`)
    return data.data
  },

  /** Text search across the whole tree — mirrors brandService.search()'s
   *  shape/usage exactly, so CategorySelector.tsx can drive the same shared
   *  Combobox component BrandSelector.tsx already uses. */
  async search(q: string): Promise<ProductCategorySearchResult[]> {
    const params = new URLSearchParams({ q })
    const data = await http.get<{ success: boolean; data: ProductCategorySearchResult[] }>(
      `/api/v1/cms/content/product-categories?${params}`,
    )
    return data.data ?? []
  },
}

export interface EffectiveCategoryAttribute {
  attribute_id: string
  name: string
  slug: string
  data_type: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect'
  options: Array<{ value: string; label: string }>
  unit: string | null
  help_text: string | null
  is_required: boolean
  sort_order: number
}

export const categoryAttributeService = {
  async getEffective(categoryId: string): Promise<EffectiveCategoryAttribute[]> {
    const data = await http.get<ApiResponse<EffectiveCategoryAttribute[]>>(`/api/v1/cms/content/category-attributes/effective/${categoryId}`)
    return data.data ?? []
  },
}

export interface Brand {
  id: string
  name: string
  slug: string
  category_id: string | null
  logo_url: string | null
  country: string | null
  is_verified: boolean
}

export const brandService = {
  async search(q: string, categoryId?: string | null): Promise<Brand[]> {
    const params = new URLSearchParams({ limit: '100' })
    if (q) params.set('q', q)
    if (categoryId) params.set('category_id', categoryId)
    const data = await http.get<ApiResponse<Brand[]>>(`/api/v1/cms/content/brands?${params}`)
    return data.data ?? []
  },

  async getById(id: string): Promise<Brand> {
    const data = await http.get<ApiResponse<Brand>>(`/api/v1/cms/content/brands/${id}`)
    return data.data
  },

  async requestNew(payload: { requested_name: string; requested_category_id?: string | null; notes?: string | null }): Promise<void> {
    await http.post<ApiResponse<unknown>>('/api/v1/cms/content/brands/requests', payload)
  },
}

// ── Product-scoped dynamic attribute values ─────────────────────────────────
export interface ProductAttributeValue extends EffectiveCategoryAttribute {
  value: unknown
}

export const productAttributesService = {
  async getForProduct(productId: string): Promise<ProductAttributeValue[]> {
    const data = await http.get<ApiResponse<ProductAttributeValue[]>>(`/api/v1/cms/content/products/${productId}/attributes`)
    return data.data ?? []
  },

  async save(productId: string, values: Array<{ attribute_id: string; value: unknown }>): Promise<void> {
    await http.put<ApiResponse<unknown>>(`/api/v1/cms/content/products/${productId}/attributes`, { values })
  },
}

// ── Product-level (no-variant) inventory ────────────────────────────────────
export const productInventoryService = {
  async set(productId: string, quantity: number, trackStock: boolean): Promise<void> {
    await http.put<ApiResponse<unknown>>(`/api/v1/cms/content/products/${productId}/inventory`, { quantity, track_stock: trackStock })
  },
}

// ── SKU generator ────────────────────────────────────────────────────────────
export const skuGeneratorService = {
  async generate(params: { category_id?: string | null; brand_id?: string | null; product_name: string; variant_options?: Record<string, string> | null }): Promise<string> {
    const data = await http.post<ApiResponse<{ sku: string }>>('/api/v1/cms/content/products/generate-sku', params)
    return data.data.sku
  },
}
