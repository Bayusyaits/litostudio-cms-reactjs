// apps/cms/src/modules/products/MassUploadPageContainer.tsx
// Catalog mass-upload tool UI — Phase 4 of
// execution-plan-variants-mass-upload-pdp-2026-07-16.md.
//
// Talks to apps/backend/src/modules/products/product-mass-upload.routes.ts via
// massUploadService (packages/ui-cms/src/services/massUpload.service.ts).
//
// The .xlsx is parsed entirely client-side with SheetJS (`xlsx`) — the API
// never receives raw file bytes, only the already-parsed row objects, per
// the "keep the API server out of the file-bytes path" convention documented
// in the route file's header comment (mirrors the presigned-upload pattern
// used for media).

import { useState, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { useWebsiteStore, massUploadService, useToast, Button, Spinner } from '@litostudio/ui-cms'
import type { MassUploadSubmitResult } from '@litostudio/ui-cms'
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react'

const TEMPLATE_SHEET_NAME = 'Products'

type ParsedRow = Record<string, unknown>

export default function MassUploadPageContainer() {
  const { activeSite } = useWebsiteStore()
  const toast = useToast()
  const siteId = activeSite?.id ?? ''
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [downloading, setDownloading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [parseWarning, setParseWarning] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<MassUploadSubmitResult | null>(null)

  const handleDownloadTemplate = useCallback(async () => {
    if (!siteId) { toast.show({ message: 'Select a site first.', variant: 'error' }); return }
    setDownloading(true)
    try {
      const blob = await massUploadService.downloadTemplate(siteId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'products-mass-upload-template.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      toast.show({ message: 'Could not download the template.', variant: 'error' })
    } finally {
      setDownloading(false)
    }
  }, [siteId, toast])

  const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setResult(null)
    setParseWarning(null)
    setFileName(file.name)
    setParsing(true)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const buf = ev.target?.result as ArrayBuffer
        const workbook = XLSX.read(buf, { type: 'array' })
        const sheetName = workbook.SheetNames.includes(TEMPLATE_SHEET_NAME)
          ? TEMPLATE_SHEET_NAME
          : workbook.SheetNames[0]
        if (!sheetName) throw new Error('Workbook has no sheets')
        if (sheetName !== TEMPLATE_SHEET_NAME) {
          setParseWarning(`Sheet "${TEMPLATE_SHEET_NAME}" not found — reading "${sheetName}" instead. Use the downloaded template to avoid header mismatches.`)
        }
        const sheet = workbook.Sheets[sheetName]!
        const json = XLSX.utils.sheet_to_json<ParsedRow>(sheet, { defval: '' })
        // The template pre-provisions 500 rows for dropdown validation —
        // strip fully-blank trailing rows (no Parent SKU and no Product Name).
        const nonEmpty = json.filter((r) => {
          const parentSku = String(r['Parent SKU'] ?? '').trim()
          const productName = String(r['Product Name'] ?? '').trim()
          return parentSku !== '' || productName !== ''
        })
        setRows(nonEmpty)
        if (nonEmpty.length === 0) {
          setParseWarning('No data rows found in this file — every row was blank.')
        }
      } catch (err) {
        console.error(err)
        setRows([])
        setParseWarning(err instanceof Error ? err.message : 'Could not parse this file as an .xlsx workbook.')
      } finally {
        setParsing(false)
      }
    }
    reader.onerror = () => {
      setParsing(false)
      setParseWarning('Could not read the selected file.')
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const handleImport = useCallback(async () => {
    if (!siteId) { toast.show({ message: 'Select a site first.', variant: 'error' }); return }
    if (rows.length === 0) { toast.show({ message: 'Parse a file with at least one data row first.', variant: 'error' }); return }
    setImporting(true)
    setResult(null)
    try {
      const outcome = await massUploadService.submit(siteId, rows, fileName ?? undefined)
      setResult(outcome)
      toast.show({
        message: `${outcome.products_processed} product(s) processed`,
        description: outcome.errors.length > 0 ? `${outcome.errors.length} row error(s) — see details below.` : 'No row errors.',
        variant: outcome.errors.length > 0 ? 'info' : 'success',
      })
    } catch (err) {
      console.error(err)
      toast.show({ message: 'Import failed. Check console for details.', variant: 'error' })
    } finally {
      setImporting(false)
    }
  }, [siteId, rows, fileName, toast])

  const handleReset = useCallback(() => {
    setFileName(null)
    setRows([])
    setParseWarning(null)
    setResult(null)
  }, [])

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Catalog Mass Upload</h1>
        <p className="font-body text-sm text-[var(--text-muted)] mt-1">
          Create or update many products and their color/size variants at once with a spreadsheet.
          Rows are grouped by Parent SKU; a product missing from a re-imported file is archived, never deleted.
        </p>
      </div>

      {/* Step 1: template */}
      <section className="bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-[8px] p-5 space-y-3">
        <h2 className="font-semibold text-[var(--text-primary)]">1. Download the template</h2>
        <p className="text-sm text-[var(--text-muted)]">
          The template's Category, Brand, Status and Digital columns come pre-filled with this site's real
          dropdown options — pasting values outside those lists will fail validation on import.
        </p>
        <Button
          skin="cms"
          variant="secondary"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={handleDownloadTemplate}
          disabled={downloading || !siteId}
        >
          {downloading ? 'Preparing…' : 'Download .xlsx template'}
        </Button>
        {!siteId && <p className="text-xs text-orange-600">Select a site first.</p>}
      </section>

      {/* Step 2: upload + parse */}
      <section className="bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-[8px] p-5 space-y-4">
        <h2 className="font-semibold text-[var(--text-primary)]">2. Upload your filled-in file</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Images are attached by pasting a public URL into the Main Image URL / Variant Image URL columns —
          the file itself never contains images.
        </p>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileSelected}
            className="text-sm text-[var(--text-muted)]"
          />
        </div>

        {parsing && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Spinner className="w-4 h-4" /> Parsing {fileName}…
          </div>
        )}

        {!parsing && fileName && rows.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-green-700">
            <FileSpreadsheet className="w-4 h-4" />
            <span>{fileName}: {rows.length} data row{rows.length !== 1 ? 's' : ''} parsed, ready to import.</span>
          </div>
        )}

        {parseWarning && (
          <div className="flex items-start gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded p-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{parseWarning}</span>
          </div>
        )}
      </section>

      {/* Step 3: import */}
      <section className="bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-[8px] p-5 space-y-4">
        <h2 className="font-semibold text-[var(--text-primary)]">3. Import</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Valid rows commit even if some rows fail — failures are reported below with the row number and reason,
          nothing is silently dropped.
        </p>

        <div className="flex items-center gap-2">
          <Button
            skin="cms"
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={handleImport}
            disabled={importing || rows.length === 0 || !siteId}
          >
            {importing ? 'Importing…' : `Import ${rows.length || ''} row${rows.length === 1 ? '' : 's'}`.trim()}
          </Button>
          {(fileName || result) && (
            <Button skin="cms" variant="ghost" leftIcon={<RotateCcw className="w-4 h-4" />} onClick={handleReset} disabled={importing}>
              Reset
            </Button>
          )}
        </div>

        {result && (
          <div className={`p-4 rounded border text-sm space-y-2 ${result.errors.length > 0 ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}`}>
            <div className="flex items-center gap-2 font-medium">
              {result.errors.length > 0
                ? <AlertTriangle className="w-4 h-4 text-orange-600" />
                : <CheckCircle2 className="w-4 h-4 text-green-600" />}
              <span>
                {result.products_processed} product{result.products_processed !== 1 ? 's' : ''} processed ·{' '}
                {result.variants_synced} variant{result.variants_synced !== 1 ? 's' : ''} synced ·{' '}
                {result.variants_archived} archived
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Job ID: {result.job_id}</p>
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="font-medium text-orange-800 mb-1">{result.errors.length} row error(s):</p>
                <ul className="space-y-0.5 max-h-64 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <li key={i} className="text-xs text-red-600">Row {e.row}: {e.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
