import { useRef, useState } from 'react'
import { useWebsiteStore, useOrgStore, http, RadioGroup, type RadioOption } from '@litostudio/ui-cms'
import { useAuthStore } from '@/stores/auth.store'
import type { ApiResponse } from '@/types/api.types'

// 2026-07-17 style-standardization pass: replaced hardcoded Tailwind colors
// (green-600/orange-300/red-600 etc.) with the CMS's real design tokens
// (--lito-teal, --s-pub-*, --s-draft-*, --s-danger), swapped raw
// <textarea>/<input type=radio> for .cms-input/.cms-label/RadioGroup —
// this page predates the 2026-07 form-standardization pass (Track A) and
// was never migrated. See DECISIONS.md.
const MODE_OPTIONS: RadioOption[] = [
  { value: 'upsert', label: 'Upsert (create or update)' },
  { value: 'insert', label: 'Insert only (new records)' },
]

const MODULES = [
  { key: 'products',    label: 'Products',    siteScoped: true },
  { key: 'collections', label: 'Collections', siteScoped: true },
  { key: 'reviews',     label: 'Reviews',     siteScoped: true },
  { key: 'newsletter',  label: 'Newsletter',  siteScoped: false },
  { key: 'categories',  label: 'Categories',  siteScoped: true },
  { key: 'stories',     label: 'Stories',     siteScoped: true },
  { key: 'journal',     label: 'Journal',     siteScoped: true },
  { key: 'faqs',        label: 'FAQs',        siteScoped: true },
]

interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: Array<{ row: number; message: string }>
  message: string
}

export default function CsvPageContainer() {
  const { activeSite } = useWebsiteStore()
  const { org } = useOrgStore()
  const { token } = useAuthStore()
  const siteId = activeSite?.id ?? ''
  const orgId = org?.id ?? ''

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedModule, setSelectedModule] = useState('products')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [importMode, setImportMode] = useState<'upsert' | 'insert'>('upsert')

  const moduleConfig = MODULES.find(m => m.key === selectedModule)!

  const handleExport = async () => {
    setExporting(true)
    try {
      const qs = new URLSearchParams()
      if (moduleConfig.siteScoped && siteId) qs.set('site_id', siteId)
      else if (orgId) qs.set('org_id', orgId)

      const res = await fetch(`/api/v1/cms/csv/${selectedModule}/export?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token ?? ''}` },
      })

      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedModule}-export-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Export failed. Check console for details.')
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async () => {
    if (!csvText.trim()) { alert('Paste CSV content before importing.'); return }
    setImporting(true)
    setImportResult(null)
    try {
      const body: Record<string, unknown> = {
        csv_content: csvText,
        mode: importMode,
      }
      if (moduleConfig.siteScoped && siteId) body['site_id'] = siteId

      const result = await http.post<ApiResponse<ImportResult>>(
        `/api/v1/cms/csv/${selectedModule}/import`,
        body,
      )
      setImportResult(result.data as unknown as ImportResult)
    } catch (err) {
      console.error(err)
      alert('Import failed. Check console.')
    } finally {
      setImporting(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = ev => setCsvText((ev.target?.result as string) ?? '')
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">CSV Import / Export</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Bulk import or export content data as CSV.</p>
      </div>

      {/* Module selector */}
      <div className="flex gap-2 flex-wrap">
        {MODULES.map(m => (
          <button
            key={m.key}
            onClick={() => { setSelectedModule(m.key); setImportResult(null) }}
            className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
              selectedModule === m.key
                ? 'bg-[var(--lito-teal)] text-white border-[var(--lito-teal)]'
                : 'bg-[var(--cms-card-bg)] text-[var(--text-primary)] border-[var(--lito-border)] hover:border-[var(--lito-teal)]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Export */}
      <section className="cms-card p-5 space-y-3">
        <h2 className="font-body text-sm font-semibold text-[var(--text-primary)]">Export</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Download all <strong>{moduleConfig.label}</strong> records as CSV.
          {moduleConfig.siteScoped && !siteId && (
            <span className="text-[var(--s-draft-fg)] ml-1">Select a site first.</span>
          )}
        </p>
        <button
          onClick={handleExport}
          disabled={exporting || (moduleConfig.siteScoped && !siteId)}
          className="cms-btn cms-btn-secondary cms-btn-sm"
        >
          {exporting ? 'Exporting…' : `Export ${moduleConfig.label}`}
        </button>
      </section>

      {/* Import */}
      <section className="cms-card p-5 space-y-4">
        <h2 className="font-body text-sm font-semibold text-[var(--text-primary)]">Import</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Paste CSV content or upload a .csv file. The first row must be a header row.
        </p>

        {/* File upload — native <input type=file> is visually hidden (sr-only) and
            triggered via a real .cms-btn, matching the pattern already established
            in MediaPageView.tsx. A raw unstyled file input renders as the browser's
            own control (no radius/color tokens), which is what this fixes. */}
        <div>
          <label className="cms-label">Upload CSV file</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="cms-btn cms-btn-secondary cms-btn-sm"
            >
              Choose file
            </button>
            <span className="text-sm text-[var(--text-muted)]">{fileName ?? 'No file chosen'}</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="sr-only"
          />
        </div>

        <div>
          <label className="cms-label">Or paste CSV content</label>
          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            rows={8}
            placeholder="id,slug,title&#10;,my-product,My Product"
            className="cms-input min-h-[80px] resize-y font-mono text-xs"
          />
        </div>

        <div>
          <label className="cms-label">Mode</label>
          <RadioGroup
            name="import-mode"
            layout="inline"
            options={MODE_OPTIONS}
            value={importMode}
            onChange={v => setImportMode(v as 'upsert' | 'insert')}
          />
        </div>

        <button
          onClick={handleImport}
          disabled={importing || !csvText.trim() || (moduleConfig.siteScoped && !siteId)}
          className="cms-btn cms-btn-primary cms-btn-sm"
        >
          {importing ? 'Importing…' : `Import ${moduleConfig.label}`}
        </button>

        {/* Result */}
        {importResult && (
          <div
            role={importResult.errors.length > 0 ? 'alert' : 'status'}
            className={`p-3 rounded-[var(--radius-sm)] border text-sm ${
              importResult.errors.length > 0
                ? 'border-[var(--s-draft-fg)] bg-[var(--s-draft-bg)]'
                : 'border-[var(--s-pub-fg)] bg-[var(--s-pub-bg)]'
            }`}
          >
            <p className="font-medium text-[var(--text-primary)]">{importResult.message}</p>
            <p className="text-xs mt-1 text-[var(--text-muted)]">
              Imported: {importResult.imported} · Skipped: {importResult.skipped}
            </p>
            {importResult.errors.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {importResult.errors.map((e, i) => (
                  <li key={i} className="text-xs text-[var(--s-danger)]">Row {e.row}: {e.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
