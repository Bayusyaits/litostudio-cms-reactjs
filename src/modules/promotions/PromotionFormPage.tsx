// apps/cms/src/modules/promotions/PromotionFormPage.tsx
//
// Bespoke create/edit form for `promotions` — deliberately NOT built on
// SimpleContentEditorPage (apps/cms/src/modules/editor/SimpleContentEditorPage.tsx).
// That editor is shaped around the content_items/translatable title-excerpt-body
// model (stories, journal, gallery, services, destinations, products,
// collections, campaigns) — promotions are structured business-rule rows
// (discount_type, discount_value, dates, usage limits), not translatable
// content, and don't fit that shape. Confirmed by reading the editor's own
// file header before deciding to build a dedicated form instead of
// extending it (dev-spec-promo-cms-ordermgmt-campaignfix-2026-07-15.md,
// Open Question #3).
//
// Routes: /promotions/new (create), /promotions/:id/edit (edit) — see
// apps/cms/src/app/router.tsx.
import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Loader2, Search } from 'lucide-react'
import { FIELD_LIMITS, Select } from '@litostudio/ui-cms'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { promotionsService, productsService, collectionsService } from '@/services/content.service'
import { Switch } from '@/components/atoms/Switch'
import { StepUpConfirmDialog } from '@/components/StepUpConfirmDialog'

const promotionSchema = z.object({
  type: z.enum(['coupon', 'campaign', 'promo']),
  code: z.string().max(FIELD_LIMITS.PROMO_CODE, `Max ${FIELD_LIMITS.PROMO_CODE} characters`).optional().or(z.literal('')),
  name: z.string().min(1, 'Name is required').max(FIELD_LIMITS.CATEGORY_NAME, `Max ${FIELD_LIMITS.CATEGORY_NAME} characters`),
  description: z.string().max(FIELD_LIMITS.EXCERPT, `Max ${FIELD_LIMITS.EXCERPT} characters`).optional().or(z.literal('')),
  discount_type: z.enum(['percentage', 'fixed_amount']),
  discount_value: z.coerce.number().min(0, 'Must be 0 or greater'),
  max_discount_amount: z.coerce.number().min(0).optional().or(z.literal('')),
  min_order_amount: z.coerce.number().min(0).optional(),
  min_distinct_products: z.coerce.number().int().min(0).optional(),
  usage_limit_total: z.coerce.number().int().min(1).optional().or(z.literal('')),
  usage_limit_per_customer: z.coerce.number().int().min(1).optional().or(z.literal('')),
  applies_to: z.enum(['all', 'specific_products', 'specific_collections']),
  status: z.enum(['draft', 'active', 'paused', 'expired', 'archived']),
  stackable: z.boolean(),
  starts_at: z.string().optional().or(z.literal('')),
  ends_at: z.string().optional().or(z.literal('')),
  // Org-wide (site_id -> null on save) — 2026-07-15, Workstream E. Only
  // creatable from tenant CMS, never from cms-superadmin (2026-07-15 grill-
  // me decision) — this form is tenant-only, so no extra gating needed here.
  applies_to_all_sites: z.boolean(),
}).refine((v) => v.type !== 'coupon' || !!v.code, {
  message: 'Coupon-type promotions require a code',
  path: ['code'],
}).refine((v) => !v.applies_to_all_sites || v.applies_to === 'all', {
  message: 'Org-wide promotions can only use "All products" scope',
  path: ['applies_to'],
})

type FormValues = z.infer<typeof promotionSchema>

const DEFAULT_VALUES: FormValues = {
  type: 'coupon',
  code: '',
  name: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 0,
  max_discount_amount: '',
  min_order_amount: 0,
  min_distinct_products: 0,
  usage_limit_total: '',
  usage_limit_per_customer: '',
  applies_to: 'all',
  status: 'draft',
  stackable: false,
  starts_at: '',
  ends_at: '',
  applies_to_all_sites: false,
}

/** ISO timestamp <-> <input type="datetime-local"> value (local time, no seconds/zone). */
function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function localInputToIso(value: string): string | undefined {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

// ── Scope picker (products or collections) ─────────────────────────────────
interface ScopeEntity { id: string; label: string; sub: string }

function ScopePicker({
  siteId, kind, selectedIds, onToggle,
}: {
  siteId: string
  kind: 'specific_products' | 'specific_collections'
  selectedIds: Set<string>
  onToggle: (id: string) => void
}) {
  const [search, setSearch] = useState('')

  // Branched explicitly (rather than a ternary-selected `service` variable)
  // because Product and Collection are structurally different result types —
  // TS can't unify a single queryFn's return type across both service calls
  // when the service itself is chosen dynamically. Annotating each branch's
  // return against the same narrow shape (id/name/slug only, which both
  // Product and Collection satisfy) resolves it without an `any` cast.
  const { data, isLoading } = useQuery({
    queryKey: ['promotion-scope-options', kind, siteId, search],
    queryFn: async (): Promise<{ data: Array<{ id: string; name?: string; slug: string }> }> => {
      if (kind === 'specific_products') {
        return productsService.getList({ site_id: siteId, search: search || undefined, page: 1, limit: 50 })
      }
      return collectionsService.getList({ site_id: siteId, search: search || undefined, page: 1, limit: 50 })
    },
    enabled: !!siteId,
    staleTime: 30 * 1000,
  })

  const entities: ScopeEntity[] = useMemo(() => {
    return (data?.data ?? []).map((r) => ({ id: r.id, label: r.name ?? r.slug, sub: r.slug }))
  }, [data])

  return (
    <div className="cms-card p-4">
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          className="cms-input h-9 text-sm pl-8 w-full"
          placeholder={kind === 'specific_products' ? 'Search products…' : 'Search collections…'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="max-h-64 overflow-y-auto flex flex-col gap-1">
        {isLoading && <p className="font-body text-xs text-[var(--text-muted)] py-2">Loading…</p>}
        {!isLoading && entities.length === 0 && (
          <p className="font-body text-xs text-[var(--text-muted)] py-2">No results.</p>
        )}
        {entities.map((e) => (
          <label key={e.id} className="flex items-center gap-2 py-1.5 px-1 rounded cursor-pointer hover:bg-[rgba(17,17,17,0.03)]">
            <input
              type="checkbox"
              checked={selectedIds.has(e.id)}
              onChange={() => onToggle(e.id)}
              className="w-4 h-4"
            />
            <span className="font-body text-sm text-[var(--text-primary)]">{e.label}</span>
            <span className="font-body text-xs text-[var(--text-muted)]">{e.sub}</span>
          </label>
        ))}
      </div>
      <p className="font-body text-xs text-[var(--text-muted)] mt-2">
        {selectedIds.size} selected
      </p>
    </div>
  )
}

export default function PromotionFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['promotion', id],
    queryFn: () => promotionsService.getById(id!),
    enabled: isEdit,
  })

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(promotionSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onBlur',
  })

  useEffect(() => {
    if (existing) {
      reset({
        type: existing.type,
        code: existing.code ?? '',
        name: existing.name,
        description: existing.description ?? '',
        discount_type: existing.discount_type,
        discount_value: existing.discount_value,
        max_discount_amount: existing.max_discount_amount ?? '',
        min_order_amount: existing.min_order_amount ?? 0,
        min_distinct_products: existing.min_distinct_products ?? 0,
        usage_limit_total: existing.usage_limit_total ?? '',
        usage_limit_per_customer: existing.usage_limit_per_customer ?? '',
        applies_to: existing.applies_to,
        status: existing.status,
        stackable: existing.stackable,
        starts_at: isoToLocalInput(existing.starts_at),
        ends_at: isoToLocalInput(existing.ends_at),
        applies_to_all_sites: existing.site_id === null,
      })
    }
  }, [existing, reset])

  const appliesTo = watch('applies_to')
  const appliesToAllSites = watch('applies_to_all_sites')

  // ── Scope selection state ─────────────────────────────────────────────────
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (existing?.scopes) {
      setSelectedProductIds(new Set(existing.scopes.filter((s) => s.product_id).map((s) => s.product_id!)))
      setSelectedCollectionIds(new Set(existing.scopes.filter((s) => s.collection_id).map((s) => s.collection_id!)))
    }
  }, [existing])

  function toggleProduct(id: string) {
    setSelectedProductIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  function toggleCollection(id: string) {
    setSelectedCollectionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const [saveError, setSaveError] = useState<string | null>(null)

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        // Org-wide (2026-07-15, Workstream E): omitting site_id — sending
        // null explicitly — tells the backend to apply this promotion to
        // every site in the org instead of just activeSite. Backend also
        // enforces applies_to==='all' for these, mirrored by the form's own
        // zod .refine() above so the error surfaces before the request.
        site_id: values.applies_to_all_sites ? null : activeSite!.id,
        type: values.type,
        code: values.code ? values.code.trim() : undefined,
        name: values.name,
        description: values.description || undefined,
        discount_type: values.discount_type,
        discount_value: Number(values.discount_value),
        max_discount_amount: values.max_discount_amount === '' ? undefined : Number(values.max_discount_amount),
        min_order_amount: values.min_order_amount ?? 0,
        min_distinct_products: values.min_distinct_products ?? 0,
        usage_limit_total: values.usage_limit_total === '' ? undefined : Number(values.usage_limit_total),
        usage_limit_per_customer: values.usage_limit_per_customer === '' ? undefined : Number(values.usage_limit_per_customer),
        applies_to: values.applies_to,
        status: values.status,
        stackable: values.stackable,
        starts_at: localInputToIso(values.starts_at ?? ''),
        ends_at: localInputToIso(values.ends_at ?? ''),
      }

      const saved = isEdit
        ? await promotionsService.update(id!, payload)
        : await promotionsService.create(payload)

      // Scopes only make sense once the promotion row exists (scope rows
      // FK to promotion_id) — reconcile after create/update by diffing
      // against whatever scopes already existed (empty set on create).
      if (values.applies_to !== 'all') {
        const previousProductIds = new Set((existing?.scopes ?? []).filter((s) => s.product_id).map((s) => s.product_id!))
        const previousCollectionIds = new Set((existing?.scopes ?? []).filter((s) => s.collection_id).map((s) => s.collection_id!))
        const previousScopeByEntity = new Map((existing?.scopes ?? []).map((s) => [s.product_id ?? s.collection_id!, s.id]))

        const wantedIds = values.applies_to === 'specific_products' ? selectedProductIds : selectedCollectionIds
        const previousIds = values.applies_to === 'specific_products' ? previousProductIds : previousCollectionIds

        const toAdd = [...wantedIds].filter((eid) => !previousIds.has(eid))
        const toRemove = [...previousIds].filter((eid) => !wantedIds.has(eid))

        await Promise.all([
          ...toAdd.map((eid) => promotionsService.addScope(saved.id, values.applies_to === 'specific_products' ? { product_id: eid } : { collection_id: eid })),
          ...toRemove.map((eid) => {
            const scopeId = previousScopeByEntity.get(eid)
            return scopeId ? promotionsService.removeScope(saved.id, scopeId) : Promise.resolve()
          }),
        ])
      }

      return saved
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promotions', activeSite?.id] })
      navigate('/promotions')
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to save promotion'
      setSaveError(message)
    },
  })

  // Step-up gate — dev-spec-promo-tier1-display-multisite-mfa-2026-07-15.md,
  // Workstream H, Requirement #11. Gated whenever the SAVED state would be
  // active and/or org-wide, not just on the transition into that state —
  // simpler to reason about than diffing against the previous value, and
  // consistent with the spec's framing ("setting a promotion's status to
  // active, setting org-wide scope" as states this form can produce, not
  // deltas from a prior save).
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null)
  const needsStepUp = (values: FormValues) => values.status === 'active' || values.applies_to_all_sites

  function onSubmit(values: FormValues) {
    setSaveError(null)
    if (needsStepUp(values)) {
      setPendingValues(values)
      return
    }
    saveMutation.mutate(values)
  }

  if (isEdit && loadingExisting) {
    return (
      <div className="p-8 flex items-center gap-2 text-[var(--text-muted)]">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    )
  }

  return (
    <div className="cms-page p-8 overflow-y-auto h-full max-w-3xl mx-auto">
      <div className="mb-6">
        <Link to="/promotions" className="inline-flex items-center gap-1.5 font-body text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Promotions
        </Link>
        <h1 className="font-display text-[28px] font-normal text-[var(--text-muted)]">
          {isEdit ? 'Edit Promotion' : 'New Promotion'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <div className="cms-card p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="cms-label">Type</label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  className="w-full"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={[
                    { value: 'coupon', label: 'Coupon (customer enters a code)' },
                    { value: 'campaign', label: 'Campaign (auto-applied, no code)' },
                    { value: 'promo', label: 'Promo' },
                  ]}
                />
              )}
            />
          </div>
          <div>
            <label className="cms-label">Code {watch('type') !== 'coupon' && '(optional)'}</label>
            <input
              {...register('code')}
              maxLength={FIELD_LIMITS.PROMO_CODE}
              className="cms-input h-9 text-sm w-full uppercase"
              placeholder="WELCOME10"
              aria-invalid={!!errors.code}
            />
            {errors.code && <p className="mt-1 text-[11px] text-[var(--s-danger)]" role="alert">{errors.code.message}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="cms-label">Name</label>
            <input
              {...register('name')}
              maxLength={FIELD_LIMITS.CATEGORY_NAME}
              className="cms-input h-9 text-sm w-full"
              placeholder="Welcome 10% Off"
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="mt-1 text-[11px] text-[var(--s-danger)]" role="alert">{errors.name.message}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="cms-label">Description</label>
            <textarea
              {...register('description')}
              maxLength={FIELD_LIMITS.EXCERPT}
              rows={2}
              className="cms-input text-sm w-full"
              placeholder="Shown to customers where applicable"
            />
          </div>
        </div>

        <div className="cms-card p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="cms-label">Discount type</label>
            <Controller
              name="discount_type"
              control={control}
              render={({ field }) => (
                <Select
                  className="w-full"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={[
                    { value: 'percentage', label: 'Percentage (%)' },
                    { value: 'fixed_amount', label: 'Fixed amount (Rp)' },
                  ]}
                />
              )}
            />
          </div>
          <div>
            <label className="cms-label">Discount value</label>
            <input
              type="number" step="0.01" min={0}
              {...register('discount_value')}
              className="cms-input h-9 text-sm w-full"
              aria-invalid={!!errors.discount_value}
            />
            {errors.discount_value && <p className="mt-1 text-[11px] text-[var(--s-danger)]" role="alert">{errors.discount_value.message}</p>}
          </div>
          <div>
            <label className="cms-label">Max discount cap (Rp, optional)</label>
            <input type="number" step="1" min={0} {...register('max_discount_amount')} className="cms-input h-9 text-sm w-full" placeholder="Only relevant for percentage" />
          </div>
          <div>
            <label className="cms-label">Minimum order amount (Rp)</label>
            <input type="number" step="1" min={0} {...register('min_order_amount')} className="cms-input h-9 text-sm w-full" />
          </div>
          <div>
            <label className="cms-label">Minimum distinct products (optional)</label>
            <input type="number" step="1" min={0} {...register('min_distinct_products')} className="cms-input h-9 text-sm w-full" placeholder="0 = no minimum" />
            <p className="font-body text-[11px] text-[var(--text-muted)] mt-1">
              Counts different products in the cart, not total quantity — 3× the same product doesn't satisfy "min 2".
            </p>
          </div>
          <div>
            <label className="cms-label">Total usage limit (optional)</label>
            <input type="number" step="1" min={1} {...register('usage_limit_total')} className="cms-input h-9 text-sm w-full" placeholder="Unlimited" />
          </div>
          <div>
            <label className="cms-label">Per-customer usage limit (optional)</label>
            <input type="number" step="1" min={1} {...register('usage_limit_per_customer')} className="cms-input h-9 text-sm w-full" placeholder="Unlimited" />
          </div>
          <div className="md:col-span-2">
            <Controller
              name="stackable"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onChange={field.onChange} label="Stackable with other promotions" />
              )}
            />
          </div>
        </div>

        <div className="cms-card p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="cms-label">Status</label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  className="w-full"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={[
                    { value: 'draft', label: 'Draft (not visible to customers)' },
                    { value: 'active', label: 'Active' },
                    { value: 'paused', label: 'Paused' },
                    { value: 'expired', label: 'Expired' },
                    { value: 'archived', label: 'Archived' },
                  ]}
                />
              )}
            />
          </div>
          <div className="flex items-end">
            <Controller
              name="applies_to_all_sites"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onChange={(checked) => {
                    field.onChange(checked)
                    if (checked) setValue('applies_to', 'all')
                  }}
                  label="Apply to all sites in this organization"
                />
              )}
            />
          </div>
          <div>
            <label className="cms-label">Starts (optional)</label>
            <input type="datetime-local" {...register('starts_at')} className="cms-input h-9 text-sm w-full" />
          </div>
          <div>
            <label className="cms-label">Ends (optional)</label>
            <input type="datetime-local" {...register('ends_at')} className="cms-input h-9 text-sm w-full" />
          </div>
        </div>

        <div className="cms-card p-5">
          <label className="cms-label mb-2 block">Applies to</label>
          <Controller
            name="applies_to"
            control={control}
            render={({ field }) => (
              <Select
                className="w-full mb-1"
                disabled={appliesToAllSites}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={[
                  { value: 'all', label: 'All products' },
                  { value: 'specific_products', label: 'Specific products' },
                  { value: 'specific_collections', label: 'Specific collections' },
                ]}
              />
            )}
          />
          {appliesToAllSites && (
            <p className="font-body text-[11px] text-[var(--text-muted)] mb-4">
              Org-wide promotions can only target all products — a product belongs to exactly one site, so per-product/collection scoping isn't meaningful across multiple sites.
            </p>
          )}
          {errors.applies_to && <p className="mb-4 text-[11px] text-[var(--s-danger)]" role="alert">{errors.applies_to.message}</p>}

          {!appliesToAllSites && appliesTo === 'specific_products' && activeSite && (
            <ScopePicker siteId={activeSite.id} kind="specific_products" selectedIds={selectedProductIds} onToggle={toggleProduct} />
          )}
          {!appliesToAllSites && appliesTo === 'specific_collections' && activeSite && (
            <ScopePicker siteId={activeSite.id} kind="specific_collections" selectedIds={selectedCollectionIds} onToggle={toggleCollection} />
          )}
        </div>

        {saveError && (
          <div className="px-4 py-3 rounded bg-[var(--cms-danger-bg)] text-sm text-[var(--s-danger)]">{saveError}</div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={isSubmitting || saveMutation.isPending} className="cms-btn cms-btn-primary">
            <Save size={14} /> {saveMutation.isPending ? 'Saving…' : 'Save promotion'}
          </button>
          <Link to="/promotions" className="cms-btn cms-btn-ghost">Cancel</Link>
        </div>
      </form>

      <StepUpConfirmDialog
        open={pendingValues !== null}
        onClose={() => setPendingValues(null)}
        title={
          pendingValues?.status === 'active' && pendingValues.applies_to_all_sites
            ? 'Activate this promotion for all sites?'
            : pendingValues?.status === 'active'
              ? 'Activate this promotion?'
              : 'Apply this promotion to all sites?'
        }
        description={
          pendingValues?.status === 'active' && pendingValues.applies_to_all_sites
            ? 'This will make the promotion live and apply it to every site in your organization immediately. Confirm with your authenticator app.'
            : pendingValues?.status === 'active'
              ? 'This will make the promotion live immediately. Confirm with your authenticator app.'
              : 'This will apply the promotion to every site in your organization. Confirm with your authenticator app.'
        }
        onConfirmed={() => {
          if (pendingValues) saveMutation.mutate(pendingValues)
        }}
      />
    </div>
  )
}
