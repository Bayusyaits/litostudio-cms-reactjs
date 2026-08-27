/**
 * CollectionItemsPanel — search-and-add product picker for a Collection's
 * membership (collection_items pivot table).
 *
 * 2026-08-27 (collections-audit-2026-08-27.md, Phase C — the actual fix for
 * the reported bug): before this, nothing in the CMS called the backend's
 * POST /:id/items endpoint at all — collections.routes.ts had a real, working
 * add-item API since it was built, but every collection created through the
 * generic SimpleContentEditorPage shipped with zero linked items, so the
 * storefront correctly rendered "empty" for every collection. This panel is
 * the missing consumer of that endpoint (plus the new DELETE /:id/items/:id
 * unlink route added alongside it).
 *
 * Scoped to `collection_type: 'collection'` (product collections) only —
 * confirmed live: that's the one collection_type/item_type pairing that
 * actually has real data and a real storefront consumer
 * (GET /products?collection_id=... in products.routes.ts, used by every
 * template's collection detail page). 'gallery'/'destination'/'category'
 * collections have never had a real item linked in this system and nothing
 * downstream consumes an item_type other than 'product' yet — rather than
 * guess at a picker for those, this panel says so plainly and only handles
 * the type that's real, per Phase B's type-locking rule (backend rejects
 * mixing item_type within one collection regardless).
 *
 * Follows the same reusable-card, disabled-until-saved convention as
 * VariantsCard.tsx (products) — collection_items.collection_id is a hard
 * NOT NULL FK, so there's nothing to attach an item to before the first save.
 */
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { Combobox, useToast } from '@litostudio/ui-cms'
import { collectionsService, productsService } from '@/services/content.service'
import type { Collection } from '@/types/content.types'

interface Props {
  /** null in CREATE mode (not saved yet) — panel renders disabled. */
  collectionId: string | null
  /** The collection's own collection_type (from the sidebar's Collection Details card). */
  collectionType: string
  siteId: string | null
}

function ProductRow({
  productId, sortOrder, onRemove, removing,
}: {
  productId: string
  sortOrder: number
  onRemove: () => void
  removing: boolean
}) {
  const { data: product } = useQuery({
    queryKey: ['collection-item-product', productId],
    queryFn: () => productsService.getById(productId),
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="flex items-center gap-3 py-2 px-1 border-b border-[var(--lito-border)] last:border-b-0">
      <div className="w-9 h-9 rounded-md bg-[var(--cms-surface-2)] overflow-hidden shrink-0">
        {product?.cover_image && (
          <img src={product.cover_image} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-body text-xs font-medium text-[var(--text-primary)] truncate">
          {product?.name ?? (product === undefined ? 'Loading…' : `(deleted product ${productId.slice(0, 8)})`)}
        </p>
        <p className="font-body text-[11px] text-[var(--text-faint)]">Sort order: {sortOrder}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={removing}
        aria-label="Remove from collection"
        className="p-1.5 rounded text-[var(--text-faint)] hover:text-[var(--s-danger)] hover:bg-[var(--cms-danger-bg)] disabled:opacity-50"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function CollectionItemsPanel({ collectionId, collectionType, siteId }: Readonly<Props>) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const collectionQuery = useQuery<Collection>({
    queryKey: ['collection-items-panel', collectionId],
    queryFn: () => collectionsService.getById(collectionId!),
    enabled: !!collectionId,
  })

  const trimmedSearch = search.trim()
  const productsQuery = useQuery({
    queryKey: ['collection-item-search', siteId, trimmedSearch],
    queryFn: () => productsService.getList({ site_id: siteId!, search: trimmedSearch || undefined, limit: 20 }),
    enabled: !!siteId && !!collectionId,
  })

  if (!collectionId) {
    return (
      <div className="cms-card p-4 space-y-1.5">
        <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Collection Items</h3>
        <p className="font-body text-xs text-[var(--text-muted)]">Save the collection first to add items to it.</p>
      </div>
    )
  }

  if (collectionType !== 'collection') {
    return (
      <div className="cms-card p-4 space-y-1.5">
        <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Collection Items</h3>
        <p className="font-body text-xs text-[var(--text-muted)]">
          Item management here currently supports Product Collections only. This collection is type
          &ldquo;{collectionType}&rdquo;, which the storefront doesn&apos;t yet render member items for.
        </p>
      </div>
    )
  }

  const items = collectionQuery.data?.items ?? []
  const existingProductIds = new Set(items.map((it) => it.item_id))

  const productOptions = (productsQuery.data?.data ?? [])
    .filter((p) => !existingProductIds.has(p.id))
    .map((p) => ({
      value: p.id,
      label: p.name,
      ...(p.cover_image ? { avatar: p.cover_image } : {}),
    }))

  async function handleAdd(productId: string) {
    if (!collectionId) return
    setAdding(true)
    try {
      await collectionsService.addItem(collectionId, { item_id: productId, item_type: 'product', sort_order: items.length })
      setSearch('')
      await queryClient.invalidateQueries({ queryKey: ['collection-items-panel', collectionId] })
      toast.show({ message: 'Product added to collection', variant: 'success' })
    } catch (err) {
      toast.show({ message: err instanceof Error ? err.message : 'Failed to add product', variant: 'error' })
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(collectionItemId: string) {
    if (!collectionId) return
    setRemovingId(collectionItemId)
    try {
      await collectionsService.removeItem(collectionId, collectionItemId)
      await queryClient.invalidateQueries({ queryKey: ['collection-items-panel', collectionId] })
    } catch (err) {
      toast.show({ message: err instanceof Error ? err.message : 'Failed to remove product', variant: 'error' })
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="cms-card p-4 space-y-3">
      <div>
        <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Collection Items</h3>
        <p className="font-body text-[11px] text-[var(--text-muted)]">
          Products linked here are what the storefront renders on this collection&apos;s page.
        </p>
      </div>

      {items.length > 0 && (
        <div className="rounded-lg border border-[var(--lito-border)]">
          {items.map((it) => (
            <ProductRow
              key={it.id}
              productId={it.item_id}
              sortOrder={it.sort_order}
              removing={removingId === it.id}
              onRemove={() => handleRemove(it.id)}
            />
          ))}
        </div>
      )}
      {items.length === 0 && !collectionQuery.isLoading && (
        <p className="font-body text-xs text-[var(--text-faint)] italic">No products linked yet — the storefront will show this collection empty.</p>
      )}

      <div className="space-y-1.5">
        <label className="cms-label">Add a product</label>
        <Combobox
          value={null}
          onChange={handleAdd}
          onSearchChange={setSearch}
          options={productOptions}
          loading={productsQuery.isFetching || adding}
          disabled={adding}
          placeholder="Search products by name…"
        />
      </div>
    </div>
  )
}
