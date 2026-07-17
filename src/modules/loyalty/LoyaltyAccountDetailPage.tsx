// modules/loyalty/LoyaltyAccountDetailPage.tsx
//
// Tenant CMS loyalty account detail — balance/tier, transaction history, and
// a manual-adjustment form with a required audit reason. Modeled on
// apps/cms/src/modules/orders/OrderDetailPage.tsx's detail-page-with-
// intervention-form-and-history-list shape (the closest existing analog),
// and on LabelsPageContainer's mutateError state pattern for surfacing
// mutation failures (e.g. the backend's 403 when the caller lacks the
// 'editor' role required by POST /accounts/:id/adjust).
//
// Data comes from loyaltyService (apps/cms/src/services/loyalty.service.ts)
// → GET/POST /api/v1/cms/loyalty/accounts/:id[/adjust]
// (apps/backend/src/modules/loyalty/loyalty-admin.routes.ts).
//
// Route: /loyalty/accounts/:id — see apps/cms/src/app/router.tsx.
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Award, Clock, PlusCircle, MinusCircle } from 'lucide-react'
import { Button } from '@litostudio/ui-cms'
import { loyaltyService } from '@/services/loyalty.service'

const MIN_REASON_LENGTH = 10

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function LoyaltyAccountDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const [pointsInput, setPointsInput] = useState('')
  const [reason, setReason] = useState('')
  const [mutateError, setMutateError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const accountQuery = useQuery({
    queryKey: ['loyalty-accounts', 'detail', id],
    queryFn: () => loyaltyService.getAccount(id),
    enabled: !!id,
  })
  const account = accountQuery.data?.data

  const adjustMutation = useMutation({
    mutationFn: () =>
      loyaltyService.adjustAccount(id, {
        points: Number(pointsInput),
        reason: reason.trim(),
      }),
    onSuccess: (res) => {
      setPointsInput('')
      setReason('')
      setMutateError(null)
      setSuccessMessage(`Balance adjusted to ${res.data.new_balance.toLocaleString('id-ID')} points.`)
      void qc.invalidateQueries({ queryKey: ['loyalty-accounts', 'detail', id] })
      void qc.invalidateQueries({ queryKey: ['loyalty-accounts'] })
    },
    onError: (err: Error) => {
      setSuccessMessage(null)
      setMutateError(err.message)
    },
  })

  const points = Number(pointsInput)
  const canSubmit =
    pointsInput.trim() !== '' &&
    Number.isInteger(points) &&
    points !== 0 &&
    reason.trim().length >= MIN_REASON_LENGTH &&
    !adjustMutation.isPending

  if (accountQuery.isLoading) {
    return (
      <div className="p-8 flex items-center gap-2 text-[var(--text-muted)]">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    )
  }
  if (accountQuery.error || !account) {
    return (
      <div className="p-8">
        <Link to="/loyalty/accounts" className="inline-flex items-center gap-1.5 font-body text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Loyalty Accounts
        </Link>
        <div className="cms-card p-5 text-sm text-[var(--s-danger)]" role="alert">
          {accountQuery.error instanceof Error ? accountQuery.error.message : 'Loyalty account not found'}
        </div>
      </div>
    )
  }

  const history = account.history ?? []

  return (
    <div className="p-6 space-y-5 overflow-y-auto">
      <div>
        <Link to="/loyalty/accounts" className="inline-flex items-center gap-1.5 font-body text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Loyalty Accounts
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">{account.email}</h1>
            <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
              Account created {fmtDateTime(account.created_at)}
            </p>
          </div>
          {account.tier && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[var(--lito-gold-soft)] text-[var(--lito-gold)]">
              <Award className="w-3.5 h-3.5 mr-1.5" />{account.tier}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="cms-card p-4">
          <p className="text-[11px] text-[var(--text-muted)] mb-1">Points balance</p>
          <p className="font-body text-lg font-semibold text-[var(--text-primary)]">
            {account.points_balance.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="cms-card p-4">
          <p className="text-[11px] text-[var(--text-muted)] mb-1">Tier</p>
          <p className="font-body text-sm font-semibold">{account.tier ?? '—'}</p>
        </div>
        <div className="cms-card p-4">
          <p className="text-[11px] text-[var(--text-muted)] mb-1">Last updated</p>
          <p className="font-body text-sm font-semibold">{fmtDateTime(account.updated_at)}</p>
        </div>
      </div>

      <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
        {/* Manual adjustment form */}
        <div className="cms-card p-5">
          <h3 className="font-body text-sm font-semibold mb-3.5 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-[var(--text-muted)]" /> Adjust balance
          </h3>

          {mutateError && (
            <div className="cms-card border-[var(--s-danger)] p-3 mb-3">
              <p className="font-body text-sm text-[var(--s-danger)]">{mutateError}</p>
            </div>
          )}
          {successMessage && (
            <div className="cms-card border-[var(--s-success)] p-3 mb-3">
              <p className="font-body text-sm text-[var(--s-success)]">{successMessage}</p>
            </div>
          )}

          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (canSubmit) adjustMutation.mutate()
            }}
          >
            <div>
              <label className="cms-label">
                Points <span className="text-[var(--s-danger)]">*</span>
              </label>
              <input
                className="cms-input mt-1 w-full"
                type="number"
                step="1"
                placeholder="e.g. 100 or -50"
                value={pointsInput}
                onChange={(e) => setPointsInput(e.target.value)}
              />
              <p className="font-body text-xs text-[var(--text-muted)] mt-1">
                Positive to add points, negative to deduct. Cannot be zero.
              </p>
            </div>

            <div>
              <label className="cms-label">
                Reason <span className="text-[var(--s-danger)]">*</span>
              </label>
              <textarea
                className="cms-input mt-1 w-full h-24 resize-none"
                placeholder="Explain why this adjustment is being made (min. 10 characters)…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <p className="font-body text-xs text-[var(--text-muted)] mt-1">
                {reason.trim().length}/{MIN_REASON_LENGTH} characters minimum — this is recorded in the account's audit trail.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <Button skin="cms" type="submit" size="sm" disabled={!canSubmit}>
                {adjustMutation.isPending ? 'Adjusting…' : 'Apply adjustment'}
              </Button>
            </div>
          </form>
        </div>

        {/* Transaction history */}
        <div className="cms-card p-5">
          <h3 className="font-body text-sm font-semibold mb-3.5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--text-muted)]" /> Transaction history
          </h3>
          {history.length === 0 ? (
            <p className="text-[12px] text-[var(--text-muted)]">No transactions yet.</p>
          ) : (
            <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
              {history.map((tx) => {
                const positive = tx.points > 0
                return (
                  <div key={tx.id} className="flex items-start gap-3 text-sm">
                    {positive ? (
                      <PlusCircle className="w-4 h-4 mt-0.5 text-[var(--s-success)] shrink-0" />
                    ) : (
                      <MinusCircle className="w-4 h-4 mt-0.5 text-[var(--s-danger)] shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="capitalize font-medium">{tx.type.replace('_', ' ')}</span>
                        <span
                          className={`font-body text-sm font-semibold ${positive ? 'text-[var(--s-success)]' : 'text-[var(--s-danger)]'}`}
                        >
                          {positive ? '+' : ''}{tx.points.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">{fmtDateTime(tx.created_at)}</span>
                      </div>
                      {tx.note && <p className="text-[12px] text-[var(--text-muted)] mt-1">{tx.note}</p>}
                      {tx.order_id && (
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Order: {tx.order_id}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
