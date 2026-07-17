import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { promotionsService } from '@/services/content.service'
import { useWebsiteStore, useToast, getErrorMessage } from '@litostudio/ui-cms'
import { StepUpConfirmDialog } from '@/components/StepUpConfirmDialog'
import { PromotionsPageView } from './PromotionsPageView'
import type { PromotionStatus, PromotionType } from '@/types/content.types'

export default function PromotionsPageContainer() {
  const navigate = useNavigate()
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()
  const toast = useToast()

  const [filter, setFilter] = useState({
    search: '',
    type: '' as PromotionType | '',
    status: '' as PromotionStatus | '',
    page: 1,
    limit: 20,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['promotions', activeSite?.id, filter],
    queryFn: () =>
      promotionsService.getList({
        site_id: activeSite!.id,
        type: filter.type || undefined,
        status: filter.status || undefined,
        page: filter.page,
        per_page: filter.limit,
      }),
    enabled: !!activeSite,
    staleTime: 60 * 1000,
  })

  // Bug hunt fix (2026-07-16): no onError at all, and PromotionsPageView
  // renders no delete-error state whatsoever — a failed delete (permission
  // error, network blip, or a backend rule rejecting it) previously gave
  // the user zero feedback. This is worse than the orders silent-failure
  // case: the user goes through the full step-up TOTP confirmation
  // ceremony, watches the dialog close as if it succeeded, and has no way
  // to know the promotion is still live. Same toast + re-invalidate fix as
  // orders' updateStatusMutation.
  const deleteMutation = useMutation({
    mutationFn: (id: string) => promotionsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions', activeSite?.id] }),
    onError: (err) => {
      toast.show({ message: 'Could not delete promotion', description: getErrorMessage(err), variant: 'error' })
      qc.invalidateQueries({ queryKey: ['promotions', activeSite?.id] })
    },
  })

  // Deleting a promotion is one of the three step-up-gated actions
  // (dev-spec-promo-tier1-display-multisite-mfa-2026-07-15.md, Workstream H,
  // Requirement #11) — a live TOTP confirmation replaces the plain
  // window.confirm() this used to use, same reasoning as activate/org-wide
  // in PromotionFormPage.tsx: an accidental click here is a real pricing/
  // availability mistake, not just an annoyance.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  function handleDelete(id: string) {
    setPendingDeleteId(id)
  }

  return (
    <>
      <PromotionsPageView
        promotions={data?.data ?? []}
        meta={data?.meta}
        isLoading={isLoading}
        filter={filter}
        setFilter={(f) => setFilter((prev) => ({ ...prev, ...f }))}
        onNew={() => navigate('/promotions/new')}
        onEdit={(id) => navigate(`/promotions/${id}/edit`)}
        onDelete={handleDelete}
      />
      <StepUpConfirmDialog
        open={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        title="Delete this promotion?"
        description="This cannot be undone. Confirm with your authenticator app to permanently delete this promotion."
        onConfirmed={() => {
          if (pendingDeleteId) deleteMutation.mutate(pendingDeleteId)
        }}
      />
    </>
  )
}
