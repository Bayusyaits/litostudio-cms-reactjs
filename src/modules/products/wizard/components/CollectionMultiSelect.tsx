/**
 * CollectionMultiSelect — link/unlink this item into Product Collections,
 * from the item's own edit form (the mirror image of CollectionItemsPanel,
 * which links from the collection's side).
 *
 * 2026-08-27 (collections-audit-2026-08-27.md Phase D). Deliberately scoped
 * to `item_type: 'product'` only — i.e. Products and Services (product_type
 * 'service' rows live in the same `products` table, same real id, so
 * item_type='product' is correct for both). Portfolio is NOT wired to this
 * component: portfolio items live in `content_items`, a different table,
 * and nothing on the storefront resolves an `item_type` other than
 * 'product' for a collection (verified: GET /products?collection_id=...
 * is the only real consumer). Wiring Portfolio in would let an editor
 * "successfully" link a portfolio piece into a collection that the
 * storefront would then silently never render — worse than no picker.
 *
 * Each add/remove is its own immediate API call (POST/DELETE
 * /collections/:id/items), same as CollectionItemsPanel — collection
 * membership isn't part of this item's own save/autosave payload.
 */
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MultiSelect } from '@litostudio/ui-cms'
import { collectionsService } from '@/services/content.service'

interface Props {
  /** null before the item has been saved once — panel renders disabled. */
  itemId: string | null
  siteId: string | null
}

export function CollectionMultiSelect({ itemId, siteId }: Readonly<Props>) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [pending, setPending] = useState(false)

  const currentQuery = useQuery({
    queryKey: ['collection-multiselect-current', itemId],
    queryFn: () => collectionsService.getForItem(siteId!, itemId!, 'product'),
    enabled: !!itemId && !!siteId,
  })

  const searchQuery = useQuery({
    queryKey: ['collection-multiselect-search', siteId, search],
    queryFn: () => collectionsService.searchByName(siteId!, search, 'collection'),
    enabled: !!siteId && !!itemId,
  })

  if (!itemId) {
    return (
      <p className="font-body text-xs text-[var(--text-muted)]">Save this item first to link it into collections.</p>
    )
  }

  const current = currentQuery.data?.data ?? []
  const currentIds = new Set(current.map((c) => c.id))
  const byId = new Map(current.map((c) => [c.id, c]))

  // 2026-08-27 (Phase D follow-on fix, same audit doc): GET /collections
  // now flattens the matching translation via applyLocale() before this
  // reaches the CMS, so `.name` is real here (see collections.routes.ts's
  // GET / handler) — no need to reach into a `.translations` array.
  const options = (searchQuery.data?.data ?? [])
    .filter((c) => !currentIds.has(c.id))
    .map((c) => ({ value: c.id, label: c.name ?? c.slug }))

  async function handleChange(nextIds: string[]) {
    setPending(true)
    try {
      const added = nextIds.filter((cid) => !currentIds.has(cid))
      const removed = [...currentIds].filter((cid) => !nextIds.includes(cid))
      await Promise.all([
        ...added.map((cid) => collectionsService.addItem(cid, { item_id: itemId!, item_type: 'product' })),
        ...removed.map((cid) => {
          const row = byId.get(cid)
          return row ? collectionsService.removeItem(cid, row.matched_item_id) : Promise.resolve()
        }),
      ])
      await queryClient.invalidateQueries({ queryKey: ['collection-multiselect-current', itemId] })
    } finally {
      setPending(false)
    }
  }

  return (
    <MultiSelect
      value={[...currentIds]}
      onChange={handleChange}
      onSearchChange={setSearch}
      options={[
        ...current.map((c) => ({ value: c.id, label: c.name ?? c.slug })),
        ...options,
      ]}
      loading={currentQuery.isLoading || searchQuery.isFetching || pending}
      disabled={pending}
      placeholder="Search collections…"
    />
  )
}
