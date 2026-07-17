import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { pagesService, type PageStatus, type Page } from '@litostudio/ui-cms'
import { getErrorMessage, useToast } from '@litostudio/ui-cms'
import { PagesPageView } from './PagesPageView'

interface Filter {
  status: PageStatus | ''
  search: string
  offset: number
}

const LIMIT = 20

export default function PagesPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()
  const toast = useToast()
  const siteId = activeSite?.id ?? ''

  const [filter, setFilter] = useState<Filter>({ status: '', search: '', offset: 0 })

  const query = useQuery({
    queryKey: ['pages', siteId, filter],
    queryFn:  () => pagesService.getList({ site_id: siteId, limit: LIMIT, ...filter }),
    enabled:  !!siteId,
    staleTime: 2 * 60 * 1000,
  })

  // Separate query that fetches ALL pages (no filter) for the parent picker dropdown.
  // Stale 5 min — it's just used to populate a select, doesn't need to be fresh.
  const allPagesQuery = useQuery({
    queryKey: ['pages-all', siteId],
    queryFn:  () => pagesService.getAllForSite(siteId),
    enabled:  !!siteId,
    staleTime: 5 * 60 * 1000,
  })

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['pages', siteId] })
    void qc.invalidateQueries({ queryKey: ['pages-all', siteId] })
  }

  // ── Auto-fix duplicate sort_orders ──────────────────────────────────────
  // Runs once per site mount. If the DB has duplicate sort_order values (e.g.
  // from legacy seed data), assigns fresh sequential values by current order.
  const normalizedRef = useRef<string>('')   // tracks which siteId was normalized
  useEffect(() => {
    const pages = allPagesQuery.data
    if (!pages || pages.length === 0 || !siteId) return
    if (normalizedRef.current === siteId) return  // already ran for this site

    const orders = pages.map((p) => p.sort_order)
    const hasDupes = new Set(orders).size < orders.length
    if (!hasDupes) return

    normalizedRef.current = siteId
    const sorted = [...pages].sort(
      (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at),
    )
    const updates = sorted.map((p, i) => ({ id: p.id, sort_order: i }))
    // Automatic background normalization, not user-initiated — log rather
    // than toast so a transient failure here doesn't confuse the user with
    // an error about an action they never took.
    void pagesService.reorder(siteId, updates).then(invalidate).catch((err) => {
      console.error('Failed to auto-normalize duplicate sort_order values:', err)
    })
  }, [allPagesQuery.data, siteId])   // eslint-disable-line react-hooks/exhaustive-deps

  // Bug hunt fix (2026-07-16): same silent-failure class as promotions'
  // delete, orders' status update, shipping's deactivate, domains', and
  // organizations' delete — NONE of this module's mutations had an onError
  // handler, and PagesPageView surfaces no error state anywhere. A failed
  // delete (permission error, a page still referenced as another page's
  // parent_id, a backend rule rejecting it, network blip) previously gave
  // the user zero feedback after confirming the browser confirm() dialog —
  // the row just silently stayed in the list, exactly matching the reported
  // "I can't delete a page, nothing happens" symptom. Toast + re-invalidate,
  // same pattern as the other fixes; applied to every mutation in this file
  // for consistency, not just delete.
  const deleteMutation = useMutation({
    mutationFn: (id: string) => pagesService.remove(id),
    onSuccess:  invalidate,
    onError: (err) => {
      toast.show({ message: 'Could not delete page', description: getErrorMessage(err), variant: 'error' })
      invalidate()
    },
  })

  const toggleMenuMutation = useMutation({
    mutationFn: ({ id, is_in_menu }: { id: string; is_in_menu: boolean }) =>
      pagesService.toggleMenu(id, is_in_menu),
    onSuccess: invalidate,
    onError: (err) => {
      toast.show({ message: 'Could not update menu visibility', description: getErrorMessage(err), variant: 'error' })
      invalidate()
    },
  })

  const toggleHeaderMutation = useMutation({
    mutationFn: ({ id, is_header }: { id: string; is_header: boolean }) =>
      pagesService.toggleHeader(id, is_header),
    onSuccess: invalidate,
    onError: (err) => {
      toast.show({ message: 'Could not update header visibility', description: getErrorMessage(err), variant: 'error' })
      invalidate()
    },
  })

  const toggleFooterMutation = useMutation({
    mutationFn: ({ id, is_footer }: { id: string; is_footer: boolean }) =>
      pagesService.toggleFooter(id, is_footer),
    onSuccess: invalidate,
    onError: (err) => {
      toast.show({ message: 'Could not update footer visibility', description: getErrorMessage(err), variant: 'error' })
      invalidate()
    },
  })

  const toggleMobileMenuMutation = useMutation({
    mutationFn: ({ id, is_mobile_menu }: { id: string; is_mobile_menu: boolean }) =>
      pagesService.toggleMobileMenu(id, is_mobile_menu),
    onSuccess: invalidate,
    onError: (err) => {
      toast.show({ message: 'Could not update mobile menu visibility', description: getErrorMessage(err), variant: 'error' })
      invalidate()
    },
  })

  const updateMenuLabelMutation = useMutation({
    mutationFn: ({ id, menu_label }: { id: string; menu_label: string | null }) =>
      pagesService.updateMenuLabel(id, menu_label),
    onSuccess: invalidate,
    onError: (err) => {
      toast.show({ message: 'Could not update menu label', description: getErrorMessage(err), variant: 'error' })
      invalidate()
    },
  })

  const updateParentIdMutation = useMutation({
    mutationFn: ({ id, parent_id }: { id: string; parent_id: string | null }) =>
      pagesService.updateParentId(id, parent_id),
    onSuccess: invalidate,
    onError: (err) => {
      toast.show({ message: 'Could not change parent page', description: getErrorMessage(err), variant: 'error' })
      invalidate()
    },
  })

  /**
   * Conflict-aware sort_order handler.
   * If the new value conflicts with an existing page:
   *   1. Collect all pages
   *   2. Insert the target page at the desired position and shift others
   *   3. Call /reorder with all updated {id, sort_order} pairs
   * If no conflict: single PATCH (cheaper).
   */
  const handleSortOrder = (pageId: string, newOrder: number, allPages: Page[]) => {
    const others = allPages.filter((p) => p.id !== pageId)
    const conflict = others.some((p) => p.sort_order === newOrder)

    if (!conflict) {
      // Simple single-page update
      void pagesService.updateSortOrder(pageId, newOrder).then(invalidate).catch((err) => {
        toast.show({ message: 'Could not reorder page', description: getErrorMessage(err), variant: 'error' })
        invalidate()
      })
      return
    }

    // Build a reorder list: place target at `newOrder`, shift everyone else
    const sorted = [...others].sort((a, b) => a.sort_order - b.sort_order)
    const updates: Array<{ id: string; sort_order: number }> = []

    // Assign positions: if a page lands at >= newOrder and is not the target, push it forward
    let cursor = 0
    for (const page of sorted) {
      if (cursor === newOrder) cursor++ // skip the slot we reserved for target
      updates.push({ id: page.id, sort_order: cursor })
      cursor++
    }
    // Insert target at desired position
    updates.push({ id: pageId, sort_order: newOrder })

    void pagesService.reorder(siteId, updates).then(invalidate).catch((err) => {
      toast.show({ message: 'Could not reorder pages', description: getErrorMessage(err), variant: 'error' })
      invalidate()
    })
  }

  return (
    <PagesPageView
      pages={query.data?.data ?? []}
      allPages={allPagesQuery.data ?? []}
      meta={query.data?.meta ?? { total: 0, limit: LIMIT, offset: 0 }}
      isLoading={query.isLoading}
      filter={filter}
      setFilter={(patch) => setFilter((f) => ({ ...f, ...patch }))}
      onDelete={(id) => deleteMutation.mutate(id)}
      onToggleMenu={(id, is_in_menu) => toggleMenuMutation.mutate({ id, is_in_menu })}
      onToggleHeader={(id, is_header) => toggleHeaderMutation.mutate({ id, is_header })}
      onToggleFooter={(id, is_footer) => toggleFooterMutation.mutate({ id, is_footer })}
      onToggleMobileMenu={(id, is_mobile_menu) => toggleMobileMenuMutation.mutate({ id, is_mobile_menu })}
      onUpdateMenuLabel={(id, menu_label) => updateMenuLabelMutation.mutate({ id, menu_label })}
      onUpdateParentId={(id, parent_id) => updateParentIdMutation.mutate({ id, parent_id })}
      onUpdateSortOrder={(pageId, newOrder, allPages) => handleSortOrder(pageId, newOrder, allPages)}
    />
  )
}
