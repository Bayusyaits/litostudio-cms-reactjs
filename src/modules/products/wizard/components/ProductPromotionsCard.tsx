/**
 * ProductPromotionsCard — link/unlink this product from existing promotions,
 * directly from the product wizard's Pricing step. Grill-me decision
 * (2026-07-22, user request "poin 5 dikaitkan dengan promo saat ini"):
 * previously the only way to scope a promotion to a product was from the
 * Promotions module's own scope picker (PromotionFormPage.tsx) — this is
 * the reverse direction, product → promotions, using the exact same
 * promotion_scopes rows and the exact same addScope/removeScope endpoints,
 * so the two screens can never disagree about what's scoped.
 *
 * Three groups, per the site's promotions (all statuses except
 * draft/archived — a paused or expired-but-not-yet-archived promotion is
 * still worth seeing/managing from here):
 *  - applies_to === 'specific_products' → actionable checkbox, toggles a
 *    promotion_scopes row via addScope/removeScope.
 *  - applies_to === 'all' → read-only note (already includes every product
 *    on the site by definition, nothing to toggle).
 *  - applies_to === 'specific_collections' → read-only note (scoped by
 *    collection membership, not a per-product toggle — editing that scope
 *    still requires the Promotions module).
 */
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useToast } from '@litostudio/ui-cms'
import { promotionsService } from '@/services/content.service'
import type { Promotion } from '@/types/content.types'

interface ProductPromotionsCardProps {
  productId: string | null
  siteId?: string | null
}

function formatDiscount(p: Promotion): string {
  return p.discount_type === 'percentage'
    ? `${p.discount_value}%${p.max_discount_amount ? ` (up to Rp${p.max_discount_amount.toLocaleString('id-ID')})` : ''}`
    : `Rp${p.discount_value.toLocaleString('id-ID')}`
}

export function ProductPromotionsCard({ productId, siteId }: ProductPromotionsCardProps) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [pendingId, setPendingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['product-promotions-card', siteId],
    queryFn: () => promotionsService.getList({ site_id: siteId!, per_page: 100 }),
    enabled: !!siteId,
    staleTime: 15_000,
  })

  if (!productId) {
    return (
      <div className="cms-card p-5">
        <h3 className="font-body text-sm font-semibold text-[var(--text-primary)] mb-1">Promotions</h3>
        <p className="font-body text-xs text-[var(--text-muted)]">Save the product first, then link it to promotions here.</p>
      </div>
    )
  }

  const promotions = (data?.data ?? []).filter((p) => p.status !== 'draft' && p.status !== 'archived')
  const specific  = promotions.filter((p) => p.applies_to === 'specific_products')
  const allScoped = promotions.filter((p) => p.applies_to === 'all')
  const collScoped = promotions.filter((p) => p.applies_to === 'specific_collections')

  async function toggle(promotion: Promotion, checked: boolean) {
    setPendingId(promotion.id)
    try {
      if (checked) {
        await promotionsService.addScope(promotion.id, { product_id: productId! })
        toast.show({ message: `Linked to "${promotion.name}"`, variant: 'success' })
      } else {
        const scopeId = promotion.scopes?.find((s) => s.product_id === productId)?.id
        if (scopeId) {
          await promotionsService.removeScope(promotion.id, scopeId)
          toast.show({ message: `Unlinked from "${promotion.name}"`, variant: 'success' })
        }
      }
      void queryClient.invalidateQueries({ queryKey: ['product-promotions-card', siteId] })
    } catch (err) {
      toast.show({ message: err instanceof Error ? err.message : 'Failed to update promotion link', variant: 'error' })
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="cms-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Promotions</h3>
        <Link to="/promotions/new" className="font-body text-[11px] text-[var(--text-muted)] hover:underline">
          + New promotion
        </Link>
      </div>

      {isLoading && <p className="font-body text-xs text-[var(--text-muted)]">Loading…</p>}

      {!isLoading && promotions.length === 0 && (
        <p className="font-body text-xs text-[var(--text-faint)]">No promotions on this site yet.</p>
      )}

      {specific.length > 0 && (
        <div className="space-y-1.5">
          {specific.map((p) => {
            const checked = !!p.scopes?.some((s) => s.product_id === productId)
            return (
              <label key={p.id} className="flex items-center justify-between gap-3 py-1">
                <span className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={pendingId === p.id}
                    onChange={(e) => void toggle(p, e.target.checked)}
                  />
                  <span className="font-body text-sm truncate">{p.name}</span>
                  {p.status === 'paused' && <span className="font-body text-[10px] text-[var(--text-faint)]">(paused)</span>}
                </span>
                <span className="font-body text-xs text-[var(--text-muted)] whitespace-nowrap">{formatDiscount(p)}</span>
              </label>
            )
          })}
        </div>
      )}

      {allScoped.length > 0 && (
        <div className="pt-1 border-t border-[var(--lito-border)] space-y-1">
          <p className="font-body text-[11px] text-[var(--text-faint)]">Applies automatically (all products):</p>
          {allScoped.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 py-0.5">
              <span className="font-body text-sm text-[var(--text-muted)]">{p.name}</span>
              <span className="font-body text-xs text-[var(--text-muted)]">{formatDiscount(p)}</span>
            </div>
          ))}
        </div>
      )}

      {collScoped.length > 0 && (
        <div className="pt-1 border-t border-[var(--lito-border)] space-y-1">
          <p className="font-body text-[11px] text-[var(--text-faint)]">
            Scoped by collection — edit from the <Link to="/promotions" className="hover:underline">Promotions</Link> module:
          </p>
          {collScoped.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 py-0.5">
              <span className="font-body text-sm text-[var(--text-muted)]">{p.name}</span>
              <span className="font-body text-xs text-[var(--text-muted)]">{formatDiscount(p)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
