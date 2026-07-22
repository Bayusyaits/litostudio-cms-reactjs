/**
 * ProductWizardPage — replaces SimpleContentEditorPage for products
 * (product-editor rebuild, grill-me session 2026-07-22). Free navigation
 * between steps + draft-save-any-step: the product's core fields autosave
 * (same 2s-debounce pattern SimpleContentEditorPage already used), and each
 * child-resource step (variants, attributes, inventory, SEO) has its own
 * inline Save action — none of them require finishing the others first.
 *
 * Routes: /products/new (CREATE — only Information is usable until the
 * first save creates the row) and /products/:id/edit (EDIT — every step
 * unlocked).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useWebsiteStore, draftMediaStore } from '@litostudio/ui-cms'
import type { ContentStatus } from '@litostudio/ui-cms'

import { ContentEditorLayout } from '@/components/organisms/ContentEditorLayout'
import { PublishCard } from '@/components/molecules/PublishCard'
import { VariantsCard } from '@/components/molecules/VariantsCard'
import { productsService } from '@/services/content.service'
import type { Product, ProductType } from '@/types/content.types'

import { WizardShell } from './WizardShell'
import { ProductInformationForm } from './components/ProductInformationForm'
import { CategorySelector } from './components/CategorySelector'
import { BrandSelector } from './components/BrandSelector'
import { DynamicAttributeForm } from './components/DynamicAttributeForm'
import { ProductMediaUploader } from './components/ProductMediaUploader'
import { InventoryEditor } from './components/InventoryEditor'
import { PricingForm } from './components/PricingForm'
import { ShippingForm } from './components/ShippingForm'
import { SeoForm } from './components/SeoForm'

const STEPS = [
  { id: 'information', label: 'Information' },
  { id: 'category', label: 'Category & Brand' },
  { id: 'attributes', label: 'Attributes' },
  { id: 'media', label: 'Media' },
  { id: 'variants', label: 'Variants' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'seo', label: 'SEO' },
]

function slugify(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 100)
}

export default function ProductWizardPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeSite } = useWebsiteStore()
  const isNew = !id

  const { data: product } = useQuery<Product>({
    queryKey: ['products', activeSite?.id, id],
    queryFn: () => productsService.getById(id!),
    enabled: !isNew && !!id,
    staleTime: 0,
  })

  const [activeStep, setActiveStep] = useState('information')
  const [productId, setProductId] = useState<string | null>(id ?? null)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugLocked, setSlugLocked] = useState(false)
  const [sku, setSku] = useState('')
  const [description, setDescription] = useState('')
  const [productType, setProductType] = useState<ProductType>('product')
  const [tags, setTags] = useState<string[]>([])
  const [status, setStatus] = useState<ContentStatus>('draft')

  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [brandId, setBrandId] = useState<string | null>(null)

  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [images, setImages] = useState<string[]>([])

  const [price, setPrice] = useState('')
  const [compareAtPrice, setCompareAtPrice] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [preOrder, setPreOrder] = useState(false)
  const [daysToShip, setDaysToShip] = useState('')

  const [isDigital, setIsDigital] = useState(false)
  const [digitalFileUrl, setDigitalFileUrl] = useState('')
  const [weightGrams, setWeightGrams] = useState('')
  const [lengthCm, setLengthCm] = useState('')
  const [widthCm, setWidthCm] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [biteshipCategory, setBiteshipCategory] = useState('')

  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  // ── Hydrate from the loaded product (EDIT mode) ───────────────────────
  const hasHydrated = useRef(false)
  useEffect(() => {
    if (!product) return
    hasHydrated.current = true
    const t = product.translations?.[0]
    setName(t?.title ?? '')
    setSlug(product.slug)
    setSlugLocked(true)
    setSku(product.sku ?? '')
    setDescription(t?.excerpt ?? '')
    setProductType(product.product_type)
    setTags(product.tags ?? [])
    setStatus(product.status)
    setCategoryId(product.category_id ?? null)
    setBrandId(product.brand_id ?? null)
    setCoverImage(product.cover_image ?? null)
    setImages(product.images ?? [])
    setPrice(product.price != null ? String(product.price) : '')
    setCompareAtPrice(product.compare_at_price != null ? String(product.compare_at_price) : '')
    setIsFeatured(!!product.is_featured)
    setPreOrder(!!(product.extra?.pre_order))
    setDaysToShip(product.extra?.days_to_ship != null ? String(product.extra.days_to_ship) : '')
    setIsDigital(!!product.is_digital)
    setDigitalFileUrl(product.digital_file_url ?? '')
    setWeightGrams(product.weight_grams != null ? String(product.weight_grams) : '')
    setLengthCm(product.length_cm != null ? String(product.length_cm) : '')
    setWidthCm(product.width_cm != null ? String(product.width_cm) : '')
    setHeightCm(product.height_cm != null ? String(product.height_cm) : '')
    setBiteshipCategory(product.biteship_category ?? '')
    setMetaTitle(t?.meta_title ?? '')
    setMetaDescription(t?.meta_description ?? '')
  }, [product])

  useEffect(() => {
    if (isNew && !slugLocked && name) setSlug(slugify(name))
  }, [isNew, slugLocked, name])

  // ── Save (create or patch core product fields) ───────────────────────
  const doSave = useCallback(async (nextStatus?: ContentStatus) => {
    const effectiveStatus = nextStatus ?? status
    if (effectiveStatus === 'published') {
      const priceNum = price ? Number(price) : 0
      if (!priceNum || priceNum <= 0) {
        setSaveError('Set a price before publishing — a product with no price would show as free on the storefront.')
        return
      }
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      const resolvedCover = coverImage ? await draftMediaStore.resolveUrl(coverImage) : null
      const resolvedImages = images.length > 0 ? await draftMediaStore.resolveUrls(images) : []

      const payload = {
        // 2026-07-22 bug fix: this used to also send a top-level `name`
        // field — the `products` table has no `name` column at all (only
        // `product_translations.title`, sent below via `translation.title`).
        // Backend spreads everything except `translation` straight into the
        // Supabase insert/update, so Postgres/PostgREST rejected every
        // Add/Edit with "Could not find the 'name' column of 'products' in
        // the schema cache." Removed; `translation.title` already carries
        // the name correctly.
        slug,
        sku: sku.trim() || null,
        product_type: productType,
        status: nextStatus ?? status,
        tags,
        category_id: categoryId,
        brand_id: brandId,
        cover_image: resolvedCover,
        images: resolvedImages,
        price: price !== '' ? Number(price) : undefined,
        compare_at_price: compareAtPrice !== '' ? Number(compareAtPrice) : undefined,
        is_featured: isFeatured,
        extra: { pre_order: preOrder, days_to_ship: daysToShip !== '' ? Number(daysToShip) : undefined },
        is_digital: isDigital,
        digital_file_url: isDigital ? (digitalFileUrl || null) : null,
        weight_grams: weightGrams !== '' ? Number(weightGrams) : undefined,
        length_cm: lengthCm !== '' ? Number(lengthCm) : undefined,
        width_cm: widthCm !== '' ? Number(widthCm) : undefined,
        height_cm: heightCm !== '' ? Number(heightCm) : undefined,
        biteship_category: biteshipCategory || undefined,
        translation: { locale: 'id', title: name, excerpt: description },
      }

      if (!productId) {
        if (!activeSite?.id) throw new Error('No active site selected')
        if (!name.trim()) throw new Error('Product name is required')
        if (!slug.trim()) throw new Error('Slug is required')
        const created = await productsService.create({ ...payload, site_id: activeSite.id })
        setProductId(created.id)
        void queryClient.invalidateQueries({ queryKey: ['products', activeSite?.id] })
        navigate(`/products/${created.id}/edit`, { replace: true })
      } else {
        await productsService.update(productId, payload)
        void queryClient.invalidateQueries({ queryKey: ['products', activeSite?.id, productId] })
        void queryClient.invalidateQueries({ queryKey: ['products', activeSite?.id] })
      }
      setLastSaved(new Date().toLocaleTimeString())
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setIsSaving(false)
    }
  }, [
    productId, activeSite, name, slug, sku, productType, status, tags, categoryId, brandId,
    coverImage, images, price, compareAtPrice, isFeatured, preOrder, daysToShip,
    isDigital, digitalFileUrl, weightGrams, lengthCm, widthCm, heightCm, biteshipCategory,
    description, navigate, queryClient,
  ])

  // ── Autosave (EDIT mode only, 2s debounce) — same pattern as the old
  // SimpleContentEditorPage / EditorShell. Skipped until the product exists. ──
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!productId || !hasHydrated.current || isSaving) return
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => { void doSave() }, 2_000)
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, slug, sku, description, tags, categoryId, brandId, coverImage, images, price, compareAtPrice, isFeatured, preOrder, daysToShip, isDigital, digitalFileUrl, weightGrams, lengthCm, widthCm, heightCm, biteshipCategory])

  const hasVariants = (product?.variants ?? []).some((v) => v.status !== 'archived')

  return (
    <ContentEditorLayout
      title={isNew ? 'New Product' : name || 'Edit Product'}
      subtitle={`Products${name ? ` / ${name}` : ''}`}
      onBack={() => navigate('/products')}
      sidebarContent={
        <PublishCard
          status={status}
          onStatusChange={setStatus}
          onSave={() => void doSave()}
          onPublish={() => void doSave(status === 'published' ? 'draft' : 'published')}
          isSaving={isSaving}
          lastSaved={lastSaved}
        />
      }
    >
      {saveError && (
        <div className="cms-card py-2.5 px-4 mb-3.5 text-[var(--s-danger)] text-sm" role="alert">{saveError}</div>
      )}

      <WizardShell steps={STEPS} activeStepId={activeStep} onStepChange={setActiveStep}>
        {activeStep === 'information' && (
          <ProductInformationForm
            values={{ name, sku, description, productType, tags }}
            categoryId={categoryId}
            brandId={brandId}
            onChange={(key, value) => {
              if (key === 'name') setName(value as string)
              if (key === 'sku') setSku(value as string)
              if (key === 'description') setDescription(value as string)
              if (key === 'productType') setProductType(value as ProductType)
              if (key === 'tags') setTags(value as string[])
            }}
          />
        )}

        {activeStep === 'category' && (
          <div className="space-y-4">
            <div className="cms-card p-5 space-y-1.5">
              <label className="cms-label">Category</label>
              <CategorySelector value={categoryId} onChange={(cid) => setCategoryId(cid)} />
            </div>
            <div className="cms-card p-5 space-y-1.5">
              <label className="cms-label">Brand</label>
              <BrandSelector value={brandId} categoryId={categoryId} onChange={setBrandId} />
            </div>
          </div>
        )}

        {activeStep === 'attributes' && (
          <DynamicAttributeForm productId={productId} categoryId={categoryId} />
        )}

        {activeStep === 'media' && (
          <ProductMediaUploader
            coverImage={coverImage}
            images={images}
            onCoverImageChange={setCoverImage}
            onImagesChange={setImages}
          />
        )}

        {activeStep === 'variants' && (
          <div className="space-y-4">
            <VariantsCard
              productId={productId}
              disabled={!productId}
              product={product}
              skuPrefix={slug.toUpperCase()}
              categoryId={categoryId}
              brandId={brandId}
              productName={name}
              onSynced={() => void queryClient.invalidateQueries({ queryKey: ['products', activeSite?.id, productId] })}
            />
            <InventoryEditor productId={productId} product={product} hasVariants={hasVariants} />
          </div>
        )}

        {activeStep === 'pricing' && (
          <PricingForm
            values={{ price, compareAtPrice, currency: 'IDR', isFeatured, preOrder, daysToShip }}
            onChange={(key, value) => {
              if (key === 'price') setPrice(value as string)
              if (key === 'compareAtPrice') setCompareAtPrice(value as string)
              if (key === 'isFeatured') setIsFeatured(value as boolean)
              if (key === 'preOrder') setPreOrder(value as boolean)
              if (key === 'daysToShip') setDaysToShip(value as string)
            }}
          />
        )}

        {activeStep === 'shipping' && (
          <ShippingForm
            values={{ isDigital, digitalFileUrl, weightGrams, lengthCm, widthCm, heightCm, biteshipCategory }}
            onChange={(key, value) => {
              if (key === 'isDigital') setIsDigital(value as boolean)
              if (key === 'digitalFileUrl') setDigitalFileUrl(value as string)
              if (key === 'weightGrams') setWeightGrams(value as string)
              if (key === 'lengthCm') setLengthCm(value as string)
              if (key === 'widthCm') setWidthCm(value as string)
              if (key === 'heightCm') setHeightCm(value as string)
              if (key === 'biteshipCategory') setBiteshipCategory(value as string)
            }}
          />
        )}

        {activeStep === 'seo' && (
          <SeoForm productId={productId} initialMetaTitle={metaTitle} initialMetaDescription={metaDescription} />
        )}
      </WizardShell>
    </ContentEditorLayout>
  )
}
