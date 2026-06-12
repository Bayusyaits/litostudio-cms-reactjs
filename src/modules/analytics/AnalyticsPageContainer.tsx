import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWebsiteStore } from '@/stores/website.store'
import { analyticsService, trackingService } from '@/services/analytics.service'
import type { AnalyticsSettings, TrackingScript } from '@/services/analytics.service'
import { useForm } from 'react-hook-form'
import { useState } from 'react'

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

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<AnalyticsSettings>()

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
        <div className="text-gray-500">Select a site to manage analytics settings.</div>
      </div>
    )
  }

  const scripts = scriptsQuery.data?.data ?? []

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Tracking</h1>
        <p className="text-sm text-gray-500 mt-1">Configure analytics providers and custom scripts for your site.</p>
      </div>

      {/* Analytics Settings Form */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">Analytics Providers</h2>
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
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
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
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
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
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
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
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
            />
          </div>

          {/* Privacy */}
          <div className="flex items-center gap-6 pt-2 border-t border-gray-100">
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
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium disabled:opacity-50 hover:bg-blue-700"
            >
              {saveMutation.isPending ? 'Saving…' : 'Save Analytics Settings'}
            </button>
          </div>
        </form>
      </section>

      {/* Tracking Scripts */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Custom Tracking Scripts</h2>
          <button
            onClick={() => { setEditScript(null); setShowScriptForm(true) }}
            className="px-3 py-1.5 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800"
          >
            + Add Script
          </button>
        </div>

        {scriptsQuery.isLoading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : scripts.length === 0 ? (
          <p className="text-sm text-gray-500">No custom scripts yet.</p>
        ) : (
          <div className="space-y-2">
            {scripts.map(script => (
              <div key={script.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-md bg-gray-50">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{script.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{script.position} · order {script.load_order ?? 0} · {script.is_active ? 'active' : 'inactive'}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => { setEditScript(script); setShowScriptForm(true) }}
                    className="text-xs text-blue-600 hover:underline"
                  >Edit</button>
                  <button
                    onClick={() => script.id && deleteScriptMutation.mutate(script.id)}
                    className="text-xs text-red-500 hover:underline"
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
            className="mt-4 p-4 border border-blue-200 rounded-md bg-blue-50 space-y-3"
          >
            <h3 className="text-sm font-semibold text-gray-700">{editScript ? 'Edit Script' : 'New Script'}</h3>
            <input
              {...scriptForm.register('name', { required: true })}
              placeholder="Script name"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <select {...scriptForm.register('position')} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
              <option value="head">Head</option>
              <option value="body">Body (start)</option>
              <option value="footer">Footer</option>
            </select>
            <textarea
              {...scriptForm.register('content', { required: true })}
              placeholder="<script>…</script>"
              rows={5}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono text-xs"
            />
            <input
              {...scriptForm.register('load_order', { valueAsNumber: true })}
              type="number"
              placeholder="Load order (0 = first)"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...scriptForm.register('is_active')} className="h-4 w-4" />
              Active
            </label>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowScriptForm(false); setEditScript(null) }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
              >Cancel</button>
              <button
                type="submit"
                disabled={saveScriptMutation.isPending}
                className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium disabled:opacity-50"
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
