// modules/loyalty/LoyaltySettingsPage.tsx
//
// Tenant CMS loyalty settings — earn rules (rate, thresholds, redemption
// value, balance cap) and tiers. Mirrors LabelsPageContainer's mutateError
// state pattern for surfacing mutation failures (e.g. the backend's 403 when
// the caller lacks the 'admin' role required by PATCH /settings and the
// /tiers write routes).
//
// GET /settings already returns { rules, tiers, is_override } in one call
// (apps/backend/src/modules/loyalty/loyalty-admin.routes.ts), so this page
// uses that single query for both the rules form and the tiers list —
// loyaltyService.listTiers() (GET /tiers) is still exposed for API parity
// but isn't separately queried here since it would just duplicate the same
// data GET /settings already returned.
//
// `is_override` from the backend describes the EARN RULES row only
// (`rules.org_id === orgId`) — tiers have their own, independent org-vs-
// platform-default state, derived here from `tiers[0]?.org_id === null`
// (the backend always returns either the full platform set or the full
// org-owned set, never a mix). Creating or editing a tier while still on
// platform defaults is a one-way switch per the backend's own design (no
// route to revert an org back to org_id = null) — this page warns with a
// confirm() before the first such mutation, same escape hatch Labels uses
// for its own destructive confirm (window.confirm, not a step-up MFA flow —
// this isn't one of the money-move-approval-gated actions like promotions'
// activate/delete).
//
// Route: /loyalty/settings — see apps/cms/src/app/router.tsx.
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Settings2, Plus, Pencil, Trash2, Check, X, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react'
import { Button, useOrgStore } from '@litostudio/ui-cms'
import { loyaltyService } from '@/services/loyalty.service'
import type { LoyaltySettingsUpdatePayload, LoyaltyTier, LoyaltyTierCreatePayload, LoyaltyTierUpdatePayload } from '@/services/loyalty.service'

const RULES_FIELDS: Array<{ key: keyof LoyaltySettingsUpdatePayload; label: string; hint: string }> = [
  { key: 'earn_rate_points', label: 'Earn rate (points)', hint: 'Points earned per earn_rate_currency spent' },
  { key: 'earn_rate_currency', label: 'Earn rate (currency, Rp)', hint: 'Rupiah spent to earn earn_rate_points' },
  { key: 'min_order_amount_to_earn', label: 'Minimum order amount to earn (Rp)', hint: 'Orders below this don’t earn points' },
  { key: 'redemption_value_per_point', label: 'Redemption value per point (Rp)', hint: 'Rupiah value of 1 point when redeemed' },
  { key: 'max_balance', label: 'Max balance per account', hint: 'Cap on a single account’s points_balance' },
]

type RulesFormState = Record<keyof LoyaltySettingsUpdatePayload, string>

const EMPTY_RULES_FORM: RulesFormState = {
  earn_rate_points: '',
  earn_rate_currency: '',
  min_order_amount_to_earn: '',
  redemption_value_per_point: '',
  max_balance: '',
}

interface TierFormState {
  name: string
  min_points_threshold: string
  perk_description: string
  sort_order: string
}

const EMPTY_TIER_FORM: TierFormState = { name: '', min_points_threshold: '', perk_description: '', sort_order: '' }

function fmtRp(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`
}

export default function LoyaltySettingsPage() {
  const { org } = useOrgStore()
  const qc = useQueryClient()

  const settingsQuery = useQuery({
    queryKey: ['loyalty-settings', org?.id],
    queryFn: () => loyaltyService.getSettings(),
    enabled: !!org,
  })
  const settings = settingsQuery.data?.data

  // ── Earn rules form ─────────────────────────────────────────────────────
  const [rulesForm, setRulesForm] = useState<RulesFormState>(EMPTY_RULES_FORM)
  const [rulesError, setRulesError] = useState<string | null>(null)
  const [rulesSuccess, setRulesSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (settings?.rules) {
      const r = settings.rules
      setRulesForm({
        earn_rate_points: String(r.earn_rate_points),
        earn_rate_currency: String(r.earn_rate_currency),
        min_order_amount_to_earn: String(r.min_order_amount_to_earn),
        redemption_value_per_point: String(r.redemption_value_per_point),
        max_balance: String(r.max_balance),
      })
    }
  }, [settings?.rules])

  const updateRulesMutation = useMutation({
    mutationFn: (payload: LoyaltySettingsUpdatePayload) => loyaltyService.updateSettings(payload),
    onSuccess: () => {
      setRulesError(null)
      setRulesSuccess('Earn rules saved.')
      void qc.invalidateQueries({ queryKey: ['loyalty-settings', org?.id] })
    },
    onError: (err: Error) => {
      setRulesSuccess(null)
      setRulesError(err.message)
    },
  })

  function handleSaveRules(e: React.FormEvent) {
    e.preventDefault()
    const payload: LoyaltySettingsUpdatePayload = {}
    for (const { key } of RULES_FIELDS) {
      const raw = rulesForm[key]
      const n = Number(raw)
      if (raw.trim() !== '' && Number.isFinite(n)) payload[key] = n
    }
    updateRulesMutation.mutate(payload)
  }

  // ── Tiers ────────────────────────────────────────────────────────────────
  const tiers = settings?.tiers ?? []
  const usingPlatformDefaultTiers = tiers.length > 0 && tiers[0]?.org_id === null

  const [showAddTier, setShowAddTier] = useState(false)
  const [addTierForm, setAddTierForm] = useState<TierFormState>(EMPTY_TIER_FORM)
  const [editingTierId, setEditingTierId] = useState<string | null>(null)
  const [editTierForm, setEditTierForm] = useState<TierFormState>(EMPTY_TIER_FORM)
  const [tierError, setTierError] = useState<string | null>(null)

  function confirmSwitchIfNeeded(): boolean {
    if (!usingPlatformDefaultTiers) return true
    return window.confirm(
      'This organization is currently using platform-default loyalty tiers. Adding or editing a tier switches you to your own custom tier list going forward — this cannot be undone from this screen. Continue?',
    )
  }

  const createTierMutation = useMutation({
    mutationFn: (payload: LoyaltyTierCreatePayload) => loyaltyService.createTier(payload),
    onSuccess: () => {
      setTierError(null)
      setShowAddTier(false)
      setAddTierForm(EMPTY_TIER_FORM)
      void qc.invalidateQueries({ queryKey: ['loyalty-settings', org?.id] })
    },
    onError: (err: Error) => setTierError(err.message),
  })

  const updateTierMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LoyaltyTierUpdatePayload }) => loyaltyService.updateTier(id, payload),
    onSuccess: () => {
      setTierError(null)
      setEditingTierId(null)
      void qc.invalidateQueries({ queryKey: ['loyalty-settings', org?.id] })
    },
    onError: (err: Error) => setTierError(err.message),
  })

  const removeTierMutation = useMutation({
    mutationFn: (id: string) => loyaltyService.removeTier(id),
    onSuccess: () => {
      setTierError(null)
      void qc.invalidateQueries({ queryKey: ['loyalty-settings', org?.id] })
    },
    onError: (err: Error) => setTierError(err.message),
  })

  function handleOpenAddTier() {
    setTierError(null)
    setShowAddTier(true)
  }

  function handleSubmitAddTier(e: React.FormEvent) {
    e.preventDefault()
    if (!addTierForm.name.trim() || addTierForm.min_points_threshold.trim() === '') return
    if (!confirmSwitchIfNeeded()) return
    const payload: LoyaltyTierCreatePayload = {
      name: addTierForm.name.trim(),
      min_points_threshold: Number(addTierForm.min_points_threshold),
    }
    if (addTierForm.perk_description.trim()) payload.perk_description = addTierForm.perk_description.trim()
    if (addTierForm.sort_order.trim() !== '') payload.sort_order = Number(addTierForm.sort_order)
    createTierMutation.mutate(payload)
  }

  function handleStartEditTier(tier: LoyaltyTier) {
    setTierError(null)
    setEditingTierId(tier.id)
    setEditTierForm({
      name: tier.name,
      min_points_threshold: String(tier.min_points_threshold),
      perk_description: tier.perk_description ?? '',
      sort_order: String(tier.sort_order),
    })
  }

  function handleSubmitEditTier(id: string) {
    if (!confirmSwitchIfNeeded()) return
    updateTierMutation.mutate({
      id,
      payload: {
        name: editTierForm.name.trim(),
        min_points_threshold: Number(editTierForm.min_points_threshold),
        perk_description: editTierForm.perk_description.trim() || null,
        sort_order: Number(editTierForm.sort_order),
      },
    })
  }

  function handleDeleteTier(tier: LoyaltyTier) {
    if (window.confirm(`Delete tier "${tier.name}"?`)) removeTierMutation.mutate(tier.id)
  }

  if (settingsQuery.isLoading) {
    return <div className="p-6 font-body text-sm text-[var(--text-muted)]">Loading…</div>
  }
  if (settingsQuery.error || !settings) {
    return (
      <div className="p-6">
        <div className="cms-card p-5 text-sm text-[var(--s-danger)]" role="alert">
          {settingsQuery.error instanceof Error ? settingsQuery.error.message : 'Failed to load loyalty settings'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 overflow-y-auto">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-[var(--lito-gold)]" />
          Loyalty Settings
        </h1>
        <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
          Earn rules and reward tiers for this organization's loyalty program
        </p>
      </div>

      {/* Earn rules */}
      <div className="cms-card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-body text-sm font-semibold">Earn rules</h3>
          {settings.is_override ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--lito-gold-soft)] text-[var(--lito-gold)]">
              <ShieldCheck className="w-3.5 h-3.5" /> Custom override
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--bg-muted)] text-[var(--text-muted)]">
              <ShieldAlert className="w-3.5 h-3.5" /> Using platform defaults
            </span>
          )}
        </div>

        {rulesError && (
          <div className="cms-card border-[var(--s-danger)] p-3">
            <p className="font-body text-sm text-[var(--s-danger)]">{rulesError}</p>
          </div>
        )}
        {rulesSuccess && (
          <div className="cms-card border-[var(--s-success)] p-3">
            <p className="font-body text-sm text-[var(--s-success)]">{rulesSuccess}</p>
          </div>
        )}

        <form onSubmit={handleSaveRules} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {RULES_FIELDS.map(({ key, label, hint }) => (
            <div key={key}>
              <label className="cms-label">{label}</label>
              <input
                className="cms-input mt-1 w-full"
                type="number"
                min={0}
                step="1"
                value={rulesForm[key]}
                onChange={(e) => setRulesForm((p) => ({ ...p, [key]: e.target.value }))}
              />
              <p className="font-body text-xs text-[var(--text-muted)] mt-1">{hint}</p>
            </div>
          ))}
          <div className="md:col-span-2 flex justify-end pt-1">
            <Button skin="cms" type="submit" size="sm" disabled={updateRulesMutation.isPending}>
              {updateRulesMutation.isPending ? 'Saving…' : 'Save earn rules'}
            </Button>
          </div>
        </form>
      </div>

      {/* Tiers */}
      <div className="cms-card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-body text-sm font-semibold">Tiers</h3>
          <Button skin="cms" size="sm" onClick={handleOpenAddTier}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />Add tier
          </Button>
        </div>

        {usingPlatformDefaultTiers && (
          <div className="cms-card p-3 flex items-start gap-2 border-[var(--lito-gold)]">
            <AlertTriangle className="w-4 h-4 text-[var(--lito-gold)] shrink-0 mt-0.5" />
            <p className="font-body text-xs text-[var(--text-muted)]">
              This organization is currently showing platform-default tiers. Adding or editing a tier will switch you
              to your own custom tier list going forward — this is a one-way change.
            </p>
          </div>
        )}

        {tierError && (
          <div className="cms-card border-[var(--s-danger)] p-3">
            <p className="font-body text-sm text-[var(--s-danger)]">{tierError}</p>
          </div>
        )}

        {showAddTier && (
          <form onSubmit={handleSubmitAddTier} className="cms-card p-4 space-y-3 bg-[var(--bg-muted)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="cms-label">Name <span className="text-[var(--s-danger)]">*</span></label>
                <input
                  className="cms-input mt-1 w-full"
                  value={addTierForm.name}
                  onChange={(e) => setAddTierForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="cms-label">Min points threshold <span className="text-[var(--s-danger)]">*</span></label>
                <input
                  className="cms-input mt-1 w-full"
                  type="number"
                  min={0}
                  value={addTierForm.min_points_threshold}
                  onChange={(e) => setAddTierForm((p) => ({ ...p, min_points_threshold: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="cms-label">Perk description</label>
                <input
                  className="cms-input mt-1 w-full"
                  value={addTierForm.perk_description}
                  onChange={(e) => setAddTierForm((p) => ({ ...p, perk_description: e.target.value }))}
                />
              </div>
              <div>
                <label className="cms-label">Sort order</label>
                <input
                  className="cms-input mt-1 w-full"
                  type="number"
                  value={addTierForm.sort_order}
                  onChange={(e) => setAddTierForm((p) => ({ ...p, sort_order: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                skin="cms"
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => { setShowAddTier(false); setAddTierForm(EMPTY_TIER_FORM); setTierError(null) }}
              >
                Cancel
              </Button>
              <Button
                skin="cms"
                type="submit"
                size="sm"
                disabled={createTierMutation.isPending || !addTierForm.name.trim() || addTierForm.min_points_threshold.trim() === ''}
              >
                {createTierMutation.isPending ? 'Creating…' : 'Create tier'}
              </Button>
            </div>
          </form>
        )}

        {tiers.length === 0 ? (
          <p className="font-body text-sm text-[var(--text-muted)]">No tiers configured.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {tiers.map((tier) => (
              <div key={tier.id} className="cms-card p-3">
                {editingTierId === tier.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="cms-label">Name</label>
                      <input
                        className="cms-input mt-1 w-full"
                        value={editTierForm.name}
                        onChange={(e) => setEditTierForm((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="cms-label">Min points threshold</label>
                      <input
                        className="cms-input mt-1 w-full"
                        type="number"
                        min={0}
                        value={editTierForm.min_points_threshold}
                        onChange={(e) => setEditTierForm((p) => ({ ...p, min_points_threshold: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="cms-label">Perk description</label>
                      <input
                        className="cms-input mt-1 w-full"
                        value={editTierForm.perk_description}
                        onChange={(e) => setEditTierForm((p) => ({ ...p, perk_description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="cms-label">Sort order</label>
                      <input
                        className="cms-input mt-1 w-full"
                        type="number"
                        value={editTierForm.sort_order}
                        onChange={(e) => setEditTierForm((p) => ({ ...p, sort_order: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingTierId(null)}
                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSubmitEditTier(tier.id)}
                        disabled={updateTierMutation.isPending}
                        className="text-[var(--s-success)] hover:opacity-80 disabled:opacity-50"
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-body text-sm font-semibold text-[var(--text-primary)]">{tier.name}</span>
                        <span className="font-body text-xs text-[var(--text-muted)]">
                          {'≥'} {tier.min_points_threshold.toLocaleString('id-ID')} pts
                        </span>
                      </div>
                      {tier.perk_description && (
                        <p className="font-body text-xs text-[var(--text-muted)] mt-0.5">{tier.perk_description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEditTier(tier)}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
                        title="Edit tier"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {tier.org_id !== null && (
                        <button
                          onClick={() => handleDeleteTier(tier)}
                          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--s-danger)] hover:bg-[var(--border)] transition-colors"
                          title="Delete tier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="font-body text-xs text-[var(--text-muted)]">
          {fmtRp(settings.rules.redemption_value_per_point)} per point on redemption &middot; max balance {settings.rules.max_balance.toLocaleString('id-ID')} pts
        </p>
      </div>
    </div>
  )
}
