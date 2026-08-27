/**
 * AddMediaModal — Core Objectives #2 and #3 of the Centralized Media Hub.
 *
 * Two ways to register an asset:
 *   • Upload  — drag-and-drop or click-to-browse, multi-file.
 *   • Paste URL — an external asset URL, gated by the approved-domain
 *     allowlist (client-side check here for instant feedback; the backend's
 *     POST /link re-validates authoritatively — see media.routes.ts).
 *
 * The Category / Module dropdown is mandatory in both modes: nothing can be
 * submitted with no category selected, and whatever is chosen is what tags
 * the resulting media row's `source_module` (Reverse Integration).
 */
import { useCallback, useRef, useState } from 'react'
import { UploadCloud, Link2, AlertCircle, Loader2 } from 'lucide-react'
import {
  Modal, Button, Select, useToast,
  KNOWN_SOURCE_MODULES, sourceModuleLabel, isAllowedMediaUrlClient,
} from '@litostudio/ui-cms'

type Mode = 'upload' | 'url'

interface AddMediaModalProps {
  open: boolean
  onClose: () => void
  uploading: boolean
  onUploadFiles: (files: File[], category: string) => void | Promise<void>
  onLinkUrl: (url: string, category: string) => Promise<void>
}

const CATEGORY_OPTIONS = KNOWN_SOURCE_MODULES.map((m) => ({ value: m, label: sourceModuleLabel(m) }))

export function AddMediaModal({ open, onClose, uploading, onUploadFiles, onLinkUrl }: AddMediaModalProps) {
  const toast = useToast()
  const [mode, setMode] = useState<Mode>('upload')
  const [category, setCategory] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categoryChosen = category.trim().length > 0

  function reset() {
    setMode('upload')
    setCategory('')
    setUrl('')
    setUrlError(null)
    setDragActive(false)
  }

  function handleClose() {
    if (uploading || linking) return
    reset()
    onClose()
  }

  const handleFiles = useCallback((files: FileList | File[]) => {
    if (!categoryChosen) {
      toast.show({ message: 'Choose a category first', description: 'Pick which module this media belongs to before uploading.', variant: 'error' })
      return
    }
    const list = Array.from(files)
    if (list.length === 0) return
    void onUploadFiles(list, category)
  }, [categoryChosen, category, onUploadFiles, toast])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
  }

  function handleUrlChange(next: string) {
    setUrl(next)
    if (!next.trim()) { setUrlError(null); return }
    const check = isAllowedMediaUrlClient(next.trim())
    setUrlError(check.ok ? null : check.reason ?? 'This domain is not allowed')
  }

  async function handleLinkSubmit() {
    if (!categoryChosen) {
      toast.show({ message: 'Choose a category first', variant: 'error' })
      return
    }
    const trimmed = url.trim()
    const check = isAllowedMediaUrlClient(trimmed)
    if (!check.ok) {
      setUrlError(check.reason ?? 'This domain is not allowed')
      return
    }
    setLinking(true)
    try {
      await onLinkUrl(trimmed, category)
      toast.show({ message: 'Media linked', description: trimmed, variant: 'success' })
      reset()
      onClose()
    } catch (err) {
      toast.show({ message: 'Could not link that URL', description: err instanceof Error ? err.message : undefined, variant: 'error' })
    } finally {
      setLinking(false)
    }
  }

  const busy = uploading || linking

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Media"
      subtitle="Upload a file or paste an approved asset URL"
      width={520}
      closeIcon={<span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>×</span>}
      footer={mode === 'url' ? (
        <div className="flex justify-end gap-[10px]">
          <Button skin="cms" variant="ghost" onClick={handleClose} disabled={busy}>Cancel</Button>
          <Button
            skin="cms"
            onClick={handleLinkSubmit}
            disabled={busy || !categoryChosen || !url.trim() || !!urlError}
            leftIcon={linking ? <Loader2 size={14} className="animate-spin" /> : undefined}
          >
            {linking ? 'Linking…' : 'Add Media'}
          </Button>
        </div>
      ) : undefined}
    >
      <div className="flex flex-col gap-[16px]">
        {/* Mode tabs */}
        <div className="flex gap-[6px] p-[3px] rounded-[8px] bg-[var(--lito-cream-alt)]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex-1 flex items-center justify-center gap-[6px] py-[7px] rounded-[6px] text-[12.5px] font-medium font-body cursor-pointer border-none transition-colors duration-150 ${mode === 'upload' ? 'bg-[var(--lito-ink)] text-[var(--lito-cream)]' : 'bg-transparent text-[var(--text-muted)]'}`}
          >
            <UploadCloud size={13} /> Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`flex-1 flex items-center justify-center gap-[6px] py-[7px] rounded-[6px] text-[12.5px] font-medium font-body cursor-pointer border-none transition-colors duration-150 ${mode === 'url' ? 'bg-[var(--lito-ink)] text-[var(--lito-cream)]' : 'bg-transparent text-[var(--text-muted)]'}`}
          >
            <Link2 size={13} /> Paste URL
          </button>
        </div>

        {/* Mandatory category dropdown */}
        <div>
          <label className="font-body text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.03em] block mb-[6px]">
            Category / Module <span className="text-[var(--cms-danger)]">*</span>
          </label>
          <Select
            size="sm"
            value={category}
            onChange={setCategory}
            placeholder="Select a category…"
            options={CATEGORY_OPTIONS}
          />
          {!categoryChosen && (
            <p className="font-body text-[11px] text-[var(--text-faint)] mt-[5px]">
              Required — tags this media so it shows up under the right module.
            </p>
          )}
        </div>

        {mode === 'upload' ? (
          <div
            className={`border-2 border-dashed rounded-[10px] py-8 px-5 flex flex-col items-center justify-center gap-2 text-center transition-[border-color,background] duration-200 ${dragActive ? 'border-[var(--lito-gold)] bg-[rgba(212,168,83,0.06)]' : 'border-[var(--lito-border)]'} ${!categoryChosen || busy ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Loader2 size={22} className="text-[var(--text-muted)] animate-spin" /> : <UploadCloud size={22} className="text-[var(--text-muted)]" aria-hidden />}
            <p className="font-body text-[13px] text-[var(--text-muted)]">
              {uploading ? 'Uploading…' : (<>Drop files here or <span className="text-[var(--lito-gold)] underline">browse</span></>)}
            </p>
            <p className="font-body text-[11px] text-[var(--text-faint)]">Images, PDFs, spreadsheets, videos up to 100 MB</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,video/mp4,video/webm"
              className="sr-only"
              onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = '' }}
              aria-label="Upload files"
            />
          </div>
        ) : (
          <div>
            <label className="font-body text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.03em] block mb-[6px]">
              Asset URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://res.cloudinary.com/…"
              className="w-full px-3 py-[9px] rounded-[7px] border border-[var(--lito-border)] bg-transparent font-body text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--lito-gold)]"
              disabled={busy}
            />
            {urlError ? (
              <p className="font-body text-[11px] text-[var(--cms-danger)] mt-[6px] flex items-start gap-[4px]">
                <AlertCircle size={12} className="mt-[1px] shrink-0" /> {urlError}
              </p>
            ) : (
              <p className="font-body text-[11px] text-[var(--text-faint)] mt-[6px]">
                Approved sources only: Cloudinary, Unsplash, Adobe Stock, Google (Drive/Photos/APIs).
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
