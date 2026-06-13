import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWebsiteStore } from '@/stores/website.store'
import { analyticsService, trackingService } from '@/services/analytics.service'
import type { AnalyticsSettings, TrackingScript } from '@/services/analytics.service'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// ── Schemas ───────────────────────────────────────────────────────────────────

const analyticsSchema = z.object({
  ga4_enabled:        z.boolean().optional(),
  ga4_measurement_id: z.string().max(50).optional(),
  gtm_enabled:        z.boolean().optional(),
  gtm_container_id:   z.string().max(50).optional(),
  meta_enabled:       z.boolean().optional(),
  meta_pixel_id:      z.string().max(50).optional(),
  tiktok_enabled:     z.boolean().optional(),
  tiktok_pixel_id:    z.string().max(50).optional(),
  anonymize_ip:       z.boolean().optional(),
  cookie_consent:     z.boolean().optional(),
})

const trackingScriptSchema = z.object({
  name:       z.string().min(1, 'Script name is required').max(100),
  position:   z.enum(['head', 'body', 'footer']),
  content:    z.string().min(1, 'Script content is required'),
  load_order: z.coerce.number().int().nonnegative().optional(),
  is_active:  z.boolean().optional(),
})

export default function AnalyticsPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()
  const siteId = activeSite?.id ?? ''

  // ── Analytics settings ────────────────────────────────────────────────────
  const settingsQuery = useQuery({
    queryKey: ['analytics-settings', siteId],
    queryFn: () => analyticsService.getSettings(siteId),
    enabled: !!siteId,
  })

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<AnalyticsSettings>({
    resolver: zodResolver(analyticsSchema),
    mode: 'onChange',
  })

  useEffect(() => {
    if (settingsQuery.data?.data) {
      reset(settingsQuery.data.data)
    }
  }, [settingsQuery.data, reset])

  const saveMutation = useMutation({
    mutationFn: (values: AnalyticsSettings) => analyticsService.updateSettings(siteId, values),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['analytics-settings', siteId] }),
  })

  // ── Tracking scripts ──────────────────────────────────────────────────────
  const scriptsQuery = useQuery({
    queryKey: ['tracking-scripts', siteId],
    queryFn: () => trackingService.listScripts(siteId),
    enabled: !!siteId,
  })

  const [showScriptForm, setShowScriptForm] = useState(false)
  const [editScript, setEditScript] = useState<TrackingScript | null>(null)

  const scriptForm = useForm<TrackingScript>({
    resolver: zodResolver(trackingScriptSchema),
    mode: 'onChange',
    defaultValues: { position: 'head', is_active: true, load_order: 0 },
  })

  useEffect(() => {
    if (editScript) scriptForm.reset(editScript)
    else scriptForm.reset({ position: 'head', is_active: true, load_order: 0, name: '', content: '' })
  }, [editScript, scriptForm])

  const saveScriptMutation = useMutation({
    mutationFn: (values: TrackingScript) =>
      editScript?.id
        ? trackingService.updateScript(siteId, editScript.id, values)
        : trackingService.createScript(siteId, values),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tracking-scripts', siteId] })
      setShowScriptForm(false)
      setEditScript(null)
    },
  })

  const deleteScriptMutation = useMutation({
    mutationFn: (id: string) => trackingService.deleteScript(siteId, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['tracking-scripts', siteId] }),
  })

  if (!siteId) {
    return (
      <div className="p-6">
        <div className="text-[var(--text-muted)]">Select a site to manage analytics settings.</div>
      </div>
    )
  }

  const scripts = scriptsQuery.data?.data ?? []

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics & Tracking</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Configure analytics providers and custom scripts for your site.</p>
      </div>

      {/* Analytics Settings Form */}
      <section className="bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-[8px] p-6 space-y-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Analytics Providers</h2>
        <form onSubmit={handleSubmit(v => saveMutation.mutate(v))} className="space-y-5">
          {/* GA4 */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input type="checkbox" {...register('ga4_enabled')} id="ga4_enabled" className="h-4 w-4" />
              <label htmlFor="ga4_enabled" className="font-medium text-sm">Google Analytics 4 (GA4)</label>
            </div>
            <input
              {...register('ga4_measurement_id')}
              placeholder="G-XXXXXXXXXX"
              className="w-full border border-[var(--lito-border)] rounded px-3 py-2 text-sm font-mono"
            />
          </div>

          {/* GTM */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input type="checkbox" {...register('gtm_enabled')} id="gtm_enabled" className="h-4 w-4" />
              <label htmlFor="gtm_enabled" className="font-medium text-sm">Google Tag Manager (GTM)</label>
            </div>
            <input
              {...register('gtm_container_id')}
              placeholder="GTM-XXXXXXX"
              className="w-full border border-[var(--lito-border)] rounded px-3 py-2 text-sm font-mono"
            />
          </div>

          {/* Meta Pixel */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input type="checkbox" {...register('meta_enabled')} id="meta_enabled" className="h-4 w-4" />
              <label htmlFor="meta_enabled" className="font-medium text-sm">Meta Pixel</label>
            </div>
            <input
              {...register('meta_pixel_id')}
              placeholder="Pixel ID (numeric)"
              className="w-full border border-[var(--lito-border)] rounded px-3 py-2 text-sm font-mono"
            />
          </div>

          {/* TikTok Pixel */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input type="checkbox" {...register('tiktok_enabled')} id="tiktok_enabled" className="h-4 w-4" />
              <label htmlFor="tiktok_enabled" className="font-medium text-sm">TikTok Pixel</label>
            </div>
            <input
              {...register('tiktok_pixel_id')}
              placeholder="TikTok Pixel ID"
              className="w-full border border-[var(--lito-border)] rounded px-3 py-2 text-sm font-mono"
            />
          </div>

          {/* Privacy */}
          <div className="flex items-center gap-6 pt-2 border-t border-[var(--lito-border)]">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('anonymize_ip')} className="h-4 w-4" />
              Anonymize IP
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('cookie_consent')} className="h-4 w-4" />
              Require cookie consent before tracking
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isDirty || saveMutation.isPending}
              className="cms-btn cms-btn-primary cms-btn-sm hover:bg-blue-700"
            >
              {saveMutation.isPending ? 'Saving…' : 'Save Analytics Settings'}
            </button>
          </div>
        </form>
      </section>

      {/* Tracking Scripts */}
      <section className="bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-[8px] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Custom Tracking Scripts</h2>
          <button
            onClick={() => { setEditScript(null); setShowScriptForm(true) }}
            className="cms-btn cms-btn-primary cms-btn-sm"
          >
            + Add Script
          </button>
        </div>

        {scriptsQuery.isLoading ? (
          <p className="text-sm text-[var(--text-faint)]">Loading…</p>
        ) : scripts.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No custom scripts yet.</p>
        ) : (
          <div className="space-y-2">
            {scripts.map(script => (
              <div key={script.id} className="flex items-center justify-between p-3 border border-[var(--lito-border)] rounded-[6px] bg-[var(--cms-surface-2,rgba(0,0,0,0.02))]">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{script.name}</p>
                  <p className="text-xs text-[var(--text-muted)] capitalize">{script.position} · order {script.load_order ?? 0} · {script.is_active ? 'active' : 'inactive'}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => { setEditScript(script); setShowScriptForm(true) }}
                    className="text-xs text-[var(--lito-teal)] hover:underline"
                  >Edit</button>
                  <button
                    onClick={() => script.id && deleteScriptMutation.mutate(script.id)}
                    className="text-xs text-[var(--s-danger)] hover:underline"
                  >Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Script form */}
        {showScriptForm && (
          <form
            onSubmit={scriptForm.handleSubmit(v => saveScriptMutation.mutate(v))}
            className="mt-4 p-4 border border-blue-200 rounded-[6px] bg-blue-50 space-y-3"
          >
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{editScript ? 'Edit Script' : 'New Script'}</h3>
            <input
              {...scriptForm.register('name', { required: true })}
              placeholder="Script name"
              className="w-full border border-[var(--lito-border)] rounded px-3 py-2 text-sm"
            />
            <select {...scriptForm.register('position')} className="w-full border border-[var(--lito-border)] rounded px-3 py-2 text-sm">
              <option value="head">Head</option>
              <option value="body">Body (start)</option>
              <option value="footer">Footer</option>
            </select>
            <textarea
              {...scriptForm.register('content', { required: true })}
              placeholder="<script>…</script>"
              rows={5}
              className="w-full border border-[var(--lito-border)] rounded px-3 py-2 text-sm font-mono text-xs"
            />
            <input
              {...scriptForm.register('load_order', { valueAsNumber: true })}
              type="number"
              placeholder="Load order (0 = first)"
              className="w-full border border-[var(--lito-border)] rounded px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...scriptForm.register('is_active')} className="h-4 w-4" />
              Active
            </label>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowScriptForm(false); setEditScript(null) }}
                className="px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >Cancel</button>
              <button
                type="submit"
                disabled={saveScriptMutation.isPending}
                className="cms-btn cms-btn-primary cms-btn-sm"
              >
                {saveScriptMutation.isPending ? 'Saving…' : 'Save Script'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
