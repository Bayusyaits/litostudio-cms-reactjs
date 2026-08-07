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
import { productInventoryService } from '@/services/catalog.service'
import { productsService } from '@/services/content.service'
import type { Product, ProductType } from '@/types/content.types'

import { WizardShell } from './WizardShell'
import { ProductInformationForm } from './components/ProductInformationForm'
import { CategorySelector } from './components/CategorySelector'
import { BrandSelector } from './components/BrandSelector'
import { DynamicAttributeForm } from './components/DynamicAttributeForm'
import { ProductMediaUploader } from './components/ProductMediaUploader'
import { InventoryEditor } from './components/InventoryEditor'
import { ProductPromotionsCard } from './components/ProductPromotionsCard'
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
  const [sortOrder, setSortOrder] = useState('0')
  const [productType, setProductType] = useState<ProductType>('product')
  const [tags, setTags] = useState<string[]>([])
  const [status, setStatus] = useState<ContentStatus>('draft')

  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [brandId, setBrandId] = useState<string | null>(null)

  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

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
  const [minStock, setMinStock] = useState('')
  const [inventoryQuantity, setInventoryQuantity] = useState('0')
  const [inventoryTrackStock, setInventoryTrackStock] = useState(true)

  // ── Hydrate from the loaded product (EDIT mode) ───────────────────────
  const hasHydrated = useRef(false)
  useEffect(() => {
    if (!product) return
    hasHydrated.current = true
    const t = product.translations?.[0]
    // 2026-07-25 bug fix (QA audit, Critical #1): `product_translations` has
    // no `title` column — only `name`. Reading `t?.title` always returned
    // undefined, so this field loaded empty and autosave then PATCHed the
    // product with an empty name, silently blanking every product opened
    // for editing. Read the real column instead.
    setName(t?.name ?? '')
    setSlug(product.slug)
    setSlugLocked(true)
    setSku(product.sku ?? '')
    // Same class of bug: the wizard's Description field was hydrated from
    // `excerpt`, but the save payload below wrote to a key the backend
    // never persists to `excerpt` (see the `translation` payload comment).
    // Fall back the same way the storefront composables already do
    // (`description ?? excerpt`) so existing data in either column shows.
    setDescription(t?.description ?? t?.excerpt ?? '')
    setProductType(product.product_type)
    setSortOrder(String(product.sort_order ?? 0))
    setTags(product.tags ?? [])
    setStatus(product.status)
    setCategoryId(product.category_id ?? null)
    setBrandId(product.brand_id ?? null)
    setCoverImage(product.cover_image ?? null)
    setImages(product.images ?? [])
    setVideoUrl(product.video_url ?? null)
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
    setMinStock(product.extra?.min_stock_alert != null ? String(product.extra.min_stock_alert) : '')
    const productLevelInventory = product.inventory?.find((i) => i.variant_id === null)
    setInventoryQuantity(String(productLevelInventory?.quantity ?? 0))
    setInventoryTrackStock(productLevelInventory?.track_stock ?? true)
    setMetaTitle(t?.meta_title ?? '')
    setMetaDescription(t?.meta_description ?? '')
  }, [product])

  useEffect(() => {
    if (isNew && !slugLocked && name) setSlug(slugify(name))
  }, [isNew, slugLocked, name])

  // BUG FIX: this was previously declared with the `return (` JSX block,
  // AFTER `doSave`'s useCallback below — but doSave's own dependency array
  // reads `hasVariants` directly (not just inside the callback body), so
  // that ordering was a genuine temporal-dead-zone violation ("Cannot
  // access 'hasVariants' before initialization" — this component crashed
  // on every render, not just an edge case). Moved above doSave so it's
  // initialized before anything reads it.
  const hasVariants = (product?.variants ?? []).some((v) => v.status !== 'archived')

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

    // BUG FIX (QA-AUDIT-2026-08-05.md finding 2.3): the pricing/shipping
    // number inputs had no validation at all — a negative price, weight, or
    // dimension saved silently (in any status, not just on publish) and,
    // for weight/dimensions, flowed straight into the live Biteship
    // shipping-rate integration. This runs on every save, not just publish
    // — the backend's new `minimum: 0` schema (products.routes.ts) would
    // reject the request either way, but checking here first gives an
    // immediate, field-specific message instead of a generic 400. min={0}
    // on the inputs themselves (PricingForm/ShippingForm) is only a
    // browser-UI hint — typing or pasting a negative value still reaches
    // this code, so it's not a substitute for this check.
    const negativeFieldChecks: Array<[label: string, raw: string]> = [
      ['Price', price],
      ['Compare-at price', compareAtPrice],
      ['Weight', weightGrams],
      ['Length', lengthCm],
      ['Width', widthCm],
      ['Height', heightCm],
      ['Days to ship', daysToShip],
    ]
    const firstNegative = negativeFieldChecks.find(([, raw]) => raw !== '' && Number(raw) < 0)
    if (firstNegative) {
      setSaveError(`${firstNegative[0]} can't be negative.`)
      return
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      const resolvedCover = coverImage ? await draftMediaStore.resolveUrl(coverImage) : null
      const resolvedImages = images.length > 0 ? await draftMediaStore.resolveUrls(images) : []
      const existingExtra = product?.extra && typeof product.extra === 'object' ? product.extra : undefined
      const nextExtra: Record<string, unknown> = existingExtra ? { ...existingExtra } : {}
      nextExtra.pre_order = preOrder
      nextExtra.days_to_ship = daysToShip !== '' ? Number(daysToShip) : undefined
      nextExtra.min_stock_alert = minStock !== '' ? Number(minStock) : null

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
        sort_order: sortOrder !== '' ? Number(sortOrder) : 0,
        status: nextStatus ?? status,
        tags,
        category_id: categoryId,
        brand_id: brandId,
        cover_image: resolvedCover,
        images: resolvedImages,
        // Not deferred like cover/gallery above — mediaService.upload()
        // (called directly from ProductVideoField, not through
        // draftMediaStore) already returns a real CDN URL at upload time,
        // so there's nothing left to resolve here.
        video_url: videoUrl,
        price: price !== '' ? Number(price) : undefined,
        compare_at_price: compareAtPrice !== '' ? Number(compareAtPrice) : undefined,
        is_featured: isFeatured,
        extra: nextExtra,
        is_digital: isDigital,
        digital_file_url: isDigital ? (digitalFileUrl || null) : null,
        weight_grams: weightGrams !== '' ? Number(weightGrams) : undefined,
        length_cm: lengthCm !== '' ? Number(lengthCm) : undefined,
        width_cm: widthCm !== '' ? Number(widthCm) : undefined,
        height_cm: heightCm !== '' ? Number(heightCm) : undefined,
        biteship_category: biteshipCategory || undefined,
        // 2026-07-25 bug fix (QA audit, Critical #1, related finding): the
        // backend's translation upsert writes `description: t.description`
        // (products.routes.ts:489,531) — sending `excerpt` here meant that
        // key was always absent from the upsert body and the description
        // never actually persisted, independent of the name-blanking bug
        // above. `title` stays as-is; the backend intentionally maps it to
        // the `name` column.
        translation: { locale: 'id', title: name, description },
      }

      let savedProductId = productId
      if (!savedProductId) {
        if (!activeSite?.id) throw new Error('No active site selected')
        if (!name.trim()) throw new Error('Product name is required')
        if (!slug.trim()) throw new Error('Slug is required')
        const created = await productsService.create({ ...payload, site_id: activeSite.id })
        savedProductId = created.id
        setProductId(created.id)
        void queryClient.invalidateQueries({ queryKey: ['products', activeSite?.id] })
        navigate(`/products/${created.id}/edit`, { replace: true })
      } else {
        await productsService.update(savedProductId, payload)
        void queryClient.invalidateQueries({ queryKey: ['products', activeSite?.id, savedProductId] })
        void queryClient.invalidateQueries({ queryKey: ['products', activeSite?.id] })
      }

      if (savedProductId && !hasVariants) {
        await productInventoryService.set(savedProductId, Number(inventoryQuantity) || 0, inventoryTrackStock)
      }

      if (savedProductId) {
        await productsService.upsertTranslation(savedProductId, 'id', { meta_title: metaTitle, meta_description: metaDescription })
      }

      setLastSaved(new Date().toLocaleTimeString())
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setIsSaving(false)
    }
  }, [
    productId, activeSite, name, slug, sku, productType, sortOrder, status, tags, categoryId, brandId,
    coverImage, images, videoUrl, price, compareAtPrice, isFeatured, preOrder, daysToShip,
    isDigital, digitalFileUrl, weightGrams, lengthCm, widthCm, heightCm, biteshipCategory,
    description, minStock, inventoryQuantity, inventoryTrackStock, hasVariants, product?.extra, navigate, queryClient,
    metaTitle, metaDescription,
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
  }, [name, slug, sku, description, tags, categoryId, brandId, coverImage, images, videoUrl, price, compareAtPrice, isFeatured, preOrder, daysToShip, isDigital, digitalFileUrl, weightGrams, lengthCm, widthCm, heightCm, biteshipCategory, sortOrder, minStock, inventoryQuantity, inventoryTrackStock])

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
          <div className="space-y-4">
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
            {/* 2026-07-22 (user request): moved out of the Variants step —
                Inventory belongs with the product's basic info, not buried
                behind the variant matrix. For no-variant products this is
                the only place stock lives; for variant products it already
                self-collapses to a "tracked per-variant" note (see
                InventoryEditor's hasVariants branch, unchanged). */}
            <InventoryEditor
              productId={productId}
              hasVariants={hasVariants}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
              quantity={inventoryQuantity}
              onQuantityChange={setInventoryQuantity}
              trackStock={inventoryTrackStock}
              onTrackStockChange={setInventoryTrackStock}
              minStock={minStock}
              onMinStockChange={setMinStock}
            />
          </div>
        )}

        {activeStep === 'category' && (
          <div className="space-y-4">
            <div className="cms-card p-5 space-y-1.5">
              <p className="cms-label">Category</p>
              <CategorySelector
                id="product-category-combobox"
                value={categoryId}
                onChange={(cid) => {
                  const categoryChanged = cid !== categoryId
                  setCategoryId(cid)
                  if (categoryChanged) setBrandId(null)
                }}
              />
            </div>
            <div className="cms-card p-5 space-y-1.5">
              <p className="cms-label">Brand</p>
              <BrandSelector id="product-brand-combobox" value={brandId} categoryId={categoryId} onChange={setBrandId} />
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
            videoUrl={videoUrl}
            onCoverImageChange={setCoverImage}
            onImagesChange={setImages}
            onVideoUrlChange={setVideoUrl}
            siteId={activeSite?.id}
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
          </div>
        )}

        {activeStep === 'pricing' && (
          <div className="space-y-4">
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
            <ProductPromotionsCard productId={productId} siteId={activeSite?.id} />
          </div>
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
          <SeoForm
            productId={productId}
            metaTitle={metaTitle}
            onMetaTitleChange={setMetaTitle}
            metaDescription={metaDescription}
            onMetaDescriptionChange={setMetaDescription}
          />
        )}
      </WizardShell>
    </ContentEditorLayout>
  )
}
