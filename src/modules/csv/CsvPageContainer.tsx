import { useState } from 'react'
import { useWebsiteStore } from '@/stores/website.store'
import { useOrgStore } from '@/stores/org.store'
import { http } from '@/lib/request'
import type { ApiResponse } from '@/types/api.types'

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
  const siteId = activeSite?.id ?? ''
  const orgId = org?.id ?? ''

  const [selectedModule, setSelectedModule] = useState('products')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [importMode, setImportMode] = useState<'upsert' | 'insert'>('upsert')

  const moduleConfig = MODULES.find(m => m.key === selectedModule)!

  const handleExport = async () => {
    setExporting(true)
    try {
      const qs = new URLSearchParams()
      if (moduleConfig.siteScoped && siteId) qs.set('site_id', siteId)
      else if (orgId) qs.set('org_id', orgId)

      const res = await fetch(`/api/v1/cms/csv/${selectedModule}/export?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}` },
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
      <section className="bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-[8px] p-5 space-y-3">
        <h2 className="font-semibold text-[var(--text-primary)]">Export</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Download all <strong>{moduleConfig.label}</strong> records as CSV.
          {moduleConfig.siteScoped && !siteId && (
            <span className="text-orange-600 ml-1">Select a site first.</span>
          )}
        </p>
        <button
          onClick={handleExport}
          disabled={exporting || (moduleConfig.siteScoped && !siteId)}
          className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium disabled:opacity-50 hover:bg-green-700"
        >
          {exporting ? 'Exporting…' : `Export ${moduleConfig.label}`}
        </button>
      </section>

      {/* Import */}
      <section className="bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-[8px] p-5 space-y-4">
        <h2 className="font-semibold text-[var(--text-primary)]">Import</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Paste CSV content or upload a .csv file. The first row must be a header row.
        </p>

        {/* File upload */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Upload CSV file</label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="text-sm text-[var(--text-muted)]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Or paste CSV content</label>
          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            rows={8}
            placeholder="id,slug,title&#10;,my-product,My Product"
            className="w-full border border-[var(--lito-border)] rounded px-3 py-2 text-xs font-mono"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-[var(--text-primary)]">Mode:</label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio" value="upsert"
              checked={importMode === 'upsert'}
              onChange={() => setImportMode('upsert')}
            />
            Upsert (create or update)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio" value="insert"
              checked={importMode === 'insert'}
              onChange={() => setImportMode('insert')}
            />
            Insert only (new records)
          </label>
        </div>

        <button
          onClick={handleImport}
          disabled={importing || !csvText.trim() || (moduleConfig.siteScoped && !siteId)}
          className="cms-btn cms-btn-primary cms-btn-sm hover:bg-blue-700"
        >
          {importing ? 'Importing…' : `Import ${moduleConfig.label}`}
        </button>

        {/* Result */}
        {importResult && (
          <div className={`p-3 rounded border text-sm ${importResult.errors.length > 0 ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}`}>
            <p className="font-medium">{importResult.message}</p>
            <p className="text-xs mt-1 text-[var(--text-muted)]">
              Imported: {importResult.imported} · Skipped: {importResult.skipped}
            </p>
            {importResult.errors.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {importResult.errors.map((e, i) => (
                  <li key={i} className="text-xs text-red-600">Row {e.row}: {e.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
