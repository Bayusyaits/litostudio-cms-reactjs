import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrgStore } from '@/stores/org.store'
import { aiAssistantService } from '@/services/ai-assistant.service'
import type { AiAssistantSettings, KnowledgeEntry } from '@/services/ai-assistant.service'
import { useForm } from 'react-hook-form'

const CONTENT_TYPES = ['products', 'collections', 'services', 'blogs', 'stories', 'faq', 'custom', 'policies', 'about'] as const

export default function AiAssistantPageContainer() {
  const { org } = useOrgStore()
  const qc = useQueryClient()
  const orgId = org?.id ?? ''

  // ── Settings ──────────────────────────────────────────────────────────────
  const settingsQuery = useQuery({
    queryKey: ['ai-assistant-settings', orgId],
    queryFn: () => aiAssistantService.getSettings(orgId),
    enabled: !!orgId,
  })

  const settingsForm = useForm<AiAssistantSettings>({
    defaultValues: {
      is_enabled: false,
      model: 'claude-3-haiku-20240307',
      temperature: 0.7,
      max_tokens: 2048,
      widget_enabled: false,
      widget_position: 'bottom-right',
      widget_theme: 'light',
      rate_limit_per_hour: 100,
    },
  })

  useEffect(() => {
    if (settingsQuery.data?.data) settingsForm.reset(settingsQuery.data.data)
  }, [settingsQuery.data, settingsForm])

  const saveSettingsMutation = useMutation({
    mutationFn: (v: AiAssistantSettings) => aiAssistantService.updateSettings(orgId, v),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ai-assistant-settings', orgId] }),
  })

  // ── Knowledge Base ────────────────────────────────────────────────────────
  const [typeFilter, setTypeFilter] = useState('')
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [editEntry, setEditEntry] = useState<KnowledgeEntry | null>(null)

  const knowledgeQuery = useQuery({
    queryKey: ['ai-knowledge', orgId, typeFilter],
    queryFn: () => aiAssistantService.listKnowledge(orgId, typeFilter ? { content_type: typeFilter } : undefined),
    enabled: !!orgId,
  })

  const entryForm = useForm<KnowledgeEntry>({
    defaultValues: { content_type: 'custom', is_active: true, priority: 0 },
  })

  useEffect(() => {
    if (editEntry) entryForm.reset(editEntry)
    else entryForm.reset({ content_type: 'custom', is_active: true, priority: 0, title: '', content: '' })
  }, [editEntry, entryForm])

  const saveEntryMutation = useMutation({
    mutationFn: (v: KnowledgeEntry) =>
      editEntry?.id
        ? aiAssistantService.updateKnowledge(orgId, editEntry.id, v)
        : aiAssistantService.createKnowledge(orgId, v),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ai-knowledge', orgId] })
      setShowEntryForm(false)
      setEditEntry(null)
    },
  })

  const deleteEntryMutation = useMutation({
    mutationFn: (id: string) => aiAssistantService.deleteKnowledge(orgId, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ai-knowledge', orgId] }),
  })

  if (!orgId) {
    return <div className="p-6 text-gray-500">Select an organization to manage AI assistant settings.</div>
  }

  const entries = knowledgeQuery.data?.data ?? []

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-sm text-gray-500 mt-1">Configure the AI assistant and manage the knowledge base.</p>
      </div>

      {/* Settings Form */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-800">Configuration</h2>
        <form onSubmit={settingsForm.handleSubmit(v => saveSettingsMutation.mutate(v))} className="space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" {...settingsForm.register('is_enabled')} className="h-4 w-4" />
            <span className="text-sm font-medium">Enable AI Assistant</span>
          </label>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
            <select {...settingsForm.register('model')} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
              <option value="claude-3-haiku-20240307">Claude 3 Haiku (fast, economical)</option>
              <option value="claude-3-sonnet-20240229">Claude 3 Sonnet (balanced)</option>
              <option value="claude-3-opus-20240229">Claude 3 Opus (powerful)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">System Prompt (optional override)</label>
            <textarea
              {...settingsForm.register('system_prompt')}
              rows={3}
              placeholder="You are a helpful assistant for…"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Temperature (0–2)</label>
              <input
                type="number" step="0.1" min="0" max="2"
                {...settingsForm.register('temperature', { valueAsNumber: true })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max Tokens</label>
              <input
                type="number" min="1" max="8192"
                {...settingsForm.register('max_tokens', { valueAsNumber: true })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Widget</h3>
            <label className="flex items-center gap-3">
              <input type="checkbox" {...settingsForm.register('widget_enabled')} className="h-4 w-4" />
              <span className="text-sm">Show AI chat widget on website</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
                <select {...settingsForm.register('widget_position')} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Theme</label>
                <select {...settingsForm.register('widget_theme')} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (system)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Welcome Message</label>
              <input
                {...settingsForm.register('welcome_message')}
                placeholder="Hi! How can I help you today?"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saveSettingsMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium disabled:opacity-50 hover:bg-blue-700"
            >
              {saveSettingsMutation.isPending ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </form>
      </section>

      {/* Knowledge Base */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-gray-800">Knowledge Base</h2>
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="">All types</option>
              {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button
              onClick={() => { setEditEntry(null); setShowEntryForm(true) }}
              className="px-3 py-1.5 bg-gray-900 text-white rounded text-sm font-medium"
            >
              + Add Entry
            </button>
          </div>
        </div>

        {knowledgeQuery.isLoading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-500">No knowledge base entries yet.</p>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-start justify-between p-3 border border-gray-100 rounded-md bg-gray-50 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{entry.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {entry.content_type} · priority {entry.priority ?? 0} · {entry.is_active ? 'active' : 'inactive'}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{entry.content.slice(0, 100)}{entry.content.length > 100 ? '…' : ''}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => { setEditEntry(entry); setShowEntryForm(true) }} className="text-xs text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => entry.id && deleteEntryMutation.mutate(entry.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Entry Form */}
        {showEntryForm && (
          <form
            onSubmit={entryForm.handleSubmit(v => saveEntryMutation.mutate(v))}
            className="mt-4 p-4 border border-blue-200 rounded-md bg-blue-50 space-y-3"
          >
            <h3 className="text-sm font-semibold text-gray-700">{editEntry ? 'Edit Entry' : 'New Entry'}</h3>
            <select {...entryForm.register('content_type')} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
              {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              {...entryForm.register('title', { required: true })}
              placeholder="Entry title"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <textarea
              {...entryForm.register('content', { required: true })}
              placeholder="Knowledge content (plain text or markdown)"
              rows={6}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                {...entryForm.register('priority', { valueAsNumber: true })}
                placeholder="Priority (higher = more relevant)"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...entryForm.register('is_active')} className="h-4 w-4" />
                Active
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowEntryForm(false); setEditEntry(null) }}
                className="text-sm text-gray-600"
              >Cancel</button>
              <button
                type="submit"
                disabled={saveEntryMutation.isPending}
                className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium disabled:opacity-50"
              >
                {saveEntryMutation.isPending ? 'Saving…' : 'Save Entry'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
