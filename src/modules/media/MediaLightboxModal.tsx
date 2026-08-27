/**
 * MediaLightboxModal — the Media Hub's "click an asset" experience.
 *
 * Images  → full lightbox with wheel-zoom + drag-to-pan, metadata panel,
 *           Copy URL, and inline module retagging.
 * PDFs    → native embedded viewer (<iframe>, browsers render PDFs
 *           natively) + download + Copy URL.
 * Spreadsheets (xls/xlsx/csv) → best-effort in-browser preview of the first
 *           sheet via SheetJS (already a CMS dependency, used by CSV
 *           import) + download + Copy URL. Falls back to an icon card if
 *           the file can't be fetched client-side (e.g. a cross-origin host
 *           without permissive CORS).
 * Everything else → icon card + download + Copy URL.
 */
import { useEffect, useRef, useState } from 'react'
import { Copy, Download, Minus, Plus, RotateCcw, Loader2 } from 'lucide-react'
import { Modal, Select, Button, useToast, KNOWN_SOURCE_MODULES, sourceModuleLabel } from '@litostudio/ui-cms'
import type { Media } from '@litostudio/ui-cms'
import { formatBytes } from '@/lib/utils'
import { FileTypeIcon } from './mediaIcons'

interface MediaLightboxModalProps {
  item: Media | null
  onClose: () => void
  onRetag: (id: string, sourceModule: string) => void | Promise<void>
}

const CATEGORY_OPTIONS = KNOWN_SOURCE_MODULES.map((m) => ({ value: m, label: sourceModuleLabel(m) }))

type SpreadsheetRows = string[][]

export function MediaLightboxModal({ item, onClose, onRetag }: MediaLightboxModalProps) {
  const toast = useToast()
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const [sheetRows, setSheetRows] = useState<SpreadsheetRows | null>(null)
  const [sheetLoading, setSheetLoading] = useState(false)
  const [sheetError, setSheetError] = useState(false)

  const url = item ? (item.cdn_url ?? item.file_url) : null

  // Reset zoom/pan and spreadsheet preview whenever the open asset changes.
  useEffect(() => {
    setScale(1)
    setPos({ x: 0, y: 0 })
    setSheetRows(null)
    setSheetError(false)

    if (item && item.file_type === 'spreadsheet' && url) {
      setSheetLoading(true)
      let cancelled = false
      ;(async () => {
        try {
          const XLSX = await import('xlsx')
          const res = await fetch(url)
          if (!res.ok) throw new Error('fetch failed')
          const buf = await res.arrayBuffer()
          const wb = XLSX.read(buf, { type: 'array' })
          const sheet = wb.Sheets[wb.SheetNames[0]]
          const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false }) as SpreadsheetRows
          if (!cancelled) setSheetRows(rows.slice(0, 15).map((r) => r.slice(0, 10)))
        } catch {
          if (!cancelled) setSheetError(true)
        } finally {
          if (!cancelled) setSheetLoading(false)
        }
      })()
      return () => { cancelled = true }
    }
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id])

  if (!item || !url) return null

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    const delta = -e.deltaY * 0.0015
    setScale((s) => Math.min(4, Math.max(1, +(s + delta).toFixed(3))))
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (scale <= 1) return
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }
  }
  function handleMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setPos({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy })
  }
  function stopDrag() { dragRef.current = null }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url as string)
      toast.show({ message: 'URL copied to clipboard', variant: 'success' })
    } catch {
      toast.show({ message: 'Could not copy URL', variant: 'error' })
    }
  }

  async function handleRetag(next: string) {
    try {
      await onRetag(item!.id, next)
      toast.show({ message: 'Category updated', variant: 'success' })
    } catch (err) {
      toast.show({ message: 'Could not update category', description: err instanceof Error ? err.message : undefined, variant: 'error' })
    }
  }

  const zoomBtn = 'w-7 h-7 flex items-center justify-center rounded-full bg-[rgba(17,17,17,0.55)] text-white border-none cursor-pointer'

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title={item.file_name}
      subtitle={item.mime_type}
      width={860}
      closeIcon={<span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>×</span>}
    >
      <div className="flex flex-col md:flex-row gap-[18px]">
        {/* Preview pane */}
        <div className="flex-1 min-w-0">
          {item.file_type === 'image' ? (
            <div
              className="relative rounded-[10px] overflow-hidden bg-[var(--lito-cream-alt)] h-[420px] select-none"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDrag}
              onMouseLeave={stopDrag}
              style={{ cursor: scale > 1 ? 'grab' : 'default' }}
            >
              <img
                src={url}
                alt={item.alt_text ?? item.file_name}
                draggable={false}
                style={{
                  width: '100%', height: '100%', objectFit: 'contain',
                  transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                  transformOrigin: 'center center', transition: dragRef.current ? 'none' : 'transform 60ms ease-out',
                }}
              />
              <div className="absolute bottom-[10px] right-[10px] flex gap-[6px]">
                <button type="button" className={zoomBtn} aria-label="Zoom out" onClick={() => setScale((s) => Math.max(1, s - 0.25))}><Minus size={13} /></button>
                <button type="button" className={zoomBtn} aria-label="Reset zoom" onClick={() => { setScale(1); setPos({ x: 0, y: 0 }) }}><RotateCcw size={12} /></button>
                <button type="button" className={zoomBtn} aria-label="Zoom in" onClick={() => setScale((s) => Math.min(4, s + 0.25))}><Plus size={13} /></button>
              </div>
            </div>
          ) : item.file_type === 'pdf' ? (
            <iframe src={url} title={item.file_name} className="w-full h-[420px] rounded-[10px] border border-[var(--lito-border)]" />
          ) : item.file_type === 'video' ? (
            <video
              key={url}
              src={url}
              controls
              preload="metadata"
              className="w-full h-[420px] rounded-[10px] border border-[var(--lito-border)] bg-black object-contain"
            >
              Your browser does not support embedded video playback.
            </video>
          ) : item.file_type === 'spreadsheet' ? (
            sheetLoading ? (
              <div className="h-[420px] rounded-[10px] border border-[var(--lito-border)] flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
              </div>
            ) : sheetRows && sheetRows.length > 0 ? (
              <div className="h-[420px] overflow-auto rounded-[10px] border border-[var(--lito-border)] cms-scroll">
                <table className="w-full text-[11.5px] font-body border-collapse">
                  <tbody>
                    {sheetRows.map((row, ri) => (
                      <tr key={ri} className={ri === 0 ? 'bg-[var(--lito-cream-alt)] font-semibold' : ''}>
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-[8px] py-[5px] border-b border-[var(--lito-border)] whitespace-nowrap">{String(cell ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-[420px] rounded-[10px] border border-[var(--lito-border)] flex flex-col items-center justify-center gap-2">
                <FileTypeIcon fileType={item.file_type} className="w-10 h-10 text-[var(--text-muted)]" />
                <p className="font-body text-[12px] text-[var(--text-muted)]">
                  {sheetError ? 'Preview unavailable — download to view' : 'No preview available'}
                </p>
              </div>
            )
          ) : (
            <div className="h-[420px] rounded-[10px] border border-[var(--lito-border)] flex flex-col items-center justify-center gap-2">
              <FileTypeIcon fileType={item.file_type} className="w-10 h-10 text-[var(--text-muted)]" />
              <p className="font-body text-[12px] text-[var(--text-muted)]">{item.file_name}</p>
            </div>
          )}

          <div className="flex gap-[8px] mt-[12px]">
            <Button skin="cms" variant="secondary" leftIcon={<Copy size={13} />} onClick={handleCopy}>Copy URL</Button>
            <a href={url} download={item.file_name} target="_blank" rel="noreferrer" className="no-underline">
              <Button skin="cms" variant="ghost" leftIcon={<Download size={13} />}>Download</Button>
            </a>
          </div>
        </div>

        {/* Metadata panel */}
        <div className="w-full md:w-[220px] shrink-0 flex flex-col gap-[14px]">
          <MetaRow label="Size" value={item.file_size ? formatBytes(item.file_size) : '—'} />
          <MetaRow label="Dimensions" value={item.width && item.height ? `${item.width} × ${item.height}` : '—'} />
          <MetaRow label="Type" value={item.mime_type} />
          <MetaRow label="Uploaded" value={new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} />
          {item.source_domain && <MetaRow label="Source" value={item.source_domain} />}

          <div>
            <label className="font-body text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.03em] block mb-[6px]">
              Module
            </label>
            <Select size="sm" value={item.source_module} onChange={handleRetag} options={CATEGORY_OPTIONS} />
          </div>
        </div>
      </div>
    </Modal>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-body text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.03em] mb-[2px]">{label}</div>
      <div className="font-body text-[13px] text-[var(--text-primary)] break-words">{value}</div>
    </div>
  )
}
