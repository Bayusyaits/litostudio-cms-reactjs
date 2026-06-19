import { useRef, useCallback, useState } from 'react'
import { FolderOpen, Upload, Trash2, FileVideo, FileText, File, Grid, List, Check } from 'lucide-react'
import { Skeleton } from '@/components/atoms/Skeleton'
import { SearchInput } from '@/components/molecules/SearchInput'
import { EmptyState } from '@/components/molecules/EmptyState'
import { formatBytes, isImageMime, isVideoMime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Media } from '@/types/media.types'

type ViewMode = 'grid' | 'list'

interface Props {
  items: Media[]
  meta?: { total: number; page: number; per_page: number }
  isLoading: boolean
  uploading: boolean
  uploadError: string | null
  filter: { q: string; media_type: string; page: number }
  setFilter: (f: Partial<{ q: string; media_type: string; page: number }>) => void
  onUpload: (files: File[]) => void
  onDelete: (id: string) => void
}

function StorageRing({ usedMb = 240, totalMb = 1000 }) {
  const pct = Math.min(usedMb / totalMb, 1)
  const R = 34
  const circ = 2 * Math.PI * R
  const dash = circ * pct
  return (
    <div className="flex items-center gap-[14px] px-[18px] py-[14px]">
      <svg width={80} height={80} viewBox="0 0 80 80" aria-hidden>
        <circle cx={40} cy={40} r={R} fill="none" stroke="var(--lito-border)" strokeWidth={6} />
        <circle cx={40} cy={40} r={R} fill="none" stroke="var(--lito-gold)" strokeWidth={6}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          transform="rotate(-90 40 40)" />
        <text x={40} y={44} textAnchor="middle" fontFamily="var(--font-display)" fontSize={15} fill="var(--text-primary)">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <div>
        <div className="font-body text-xs font-medium text-[var(--text-primary)]">Storage</div>
        <div className="font-body text-[11px] text-[var(--text-muted)] mt-0.5">
          {formatBytes(usedMb * 1024 * 1024)} of {formatBytes(totalMb * 1024 * 1024)}
        </div>
        <div className="font-body text-[11px] text-[var(--text-muted)]">
          {formatBytes((totalMb - usedMb) * 1024 * 1024)} remaining
        </div>
      </div>
    </div>
  )
}

function MediaTypeIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (isVideoMime(mimeType)) return <FileVideo className={cn('text-[var(--text-muted)]', className)} aria-hidden />
  if (mimeType.startsWith('text/')) return <FileText className={cn('text-[var(--text-muted)]', className)} aria-hidden />
  return <File className={cn('text-[var(--text-muted)]', className)} aria-hidden />
}

function GridCard({ item, selected, onSelect, onDelete }: { item: Media; selected: boolean; onSelect: () => void; onDelete: () => void }) {
  return (
    <div
      className={`relative rounded-md overflow-hidden cursor-pointer aspect-[4/3] bg-[var(--lito-cream-alt)] transition-[border-color] duration-150 border-[1.5px] ${selected ? 'border-[var(--lito-gold)]' : 'border-[var(--lito-border)]'}`}
      onClick={onSelect}
    >
      {isImageMime(item.mime_type) ? (
        <img src={item.cdn_url ?? item.original_url ?? ''} alt={item.alt_text ?? item.filename} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-[6px]">
          <MediaTypeIcon mimeType={item.mime_type} className="w-8 h-8" />
          <span className="text-[9px] text-[var(--text-muted)] text-center px-[6px] overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
            {item.filename}
          </span>
        </div>
      )}

      {/* Type badge */}
      <div className="absolute top-[5px] left-[5px] px-[5px] py-[2px] rounded-[3px] bg-[rgba(17,17,17,0.55)] backdrop-blur-[4px] text-[9px] font-semibold text-white tracking-[0.05em] uppercase">
        {item.mime_type.split('/')[1]?.slice(0, 4) ?? 'FILE'}
      </div>

      {/* Selection check */}
      {selected && (
        <div className="absolute top-[5px] right-[5px] w-[18px] h-[18px] rounded-full bg-[var(--lito-gold)] flex items-center justify-center">
          <Check size={10} color="#111" strokeWidth={3} />
        </div>
      )}

      {/* Hover overlay */}
      <div
        className="absolute inset-0 flex items-end p-[6px] opacity-0 hover:opacity-100 hover:bg-[rgba(17,17,17,0.45)] transition-all duration-150"
      >
        <button
          type="button"
          aria-label={`Delete ${item.filename}`}
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="ml-auto w-6 h-6 rounded-full bg-[rgba(163,48,40,0.8)] border-none cursor-pointer flex items-center justify-center"
        >
          <Trash2 size={11} color="#fff" />
        </button>
      </div>
    </div>
  )
}

export function MediaPageView({
  items, meta, isLoading, uploading, uploadError,
  filter, setFilter, onUpload, onDelete,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onUpload(files)
  }, [onUpload])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) onUpload(files)
    e.target.value = ''
  }, [onUpload])

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const iconBtnBase = 'flex items-center justify-center w-8 h-8 rounded border border-[var(--lito-border)] bg-transparent cursor-pointer text-[var(--text-muted)] transition-all duration-150'
  const iconBtnActive = 'bg-[var(--lito-ink)] text-[var(--lito-cream)] border-[var(--lito-ink)]'
  const iconBtnInactive = 'bg-transparent text-[var(--text-muted)] border-[var(--lito-border)]'

  return (
    <div className="cms-page flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-7 pt-6 pb-4 shrink-0 bg-[var(--cms-main-bg)]">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="font-display text-[28px] font-normal text-[var(--text-muted)]">Media Library</h1>
            <p className="font-body text-xs text-[var(--text-muted)] mt-[3px]">
              {meta ? `${meta.total.toLocaleString()} files` : 'Upload and manage media'}
            </p>
          </div>
          <button
            type="button"
            className={`flex items-center gap-[6px] px-4 py-[7px] rounded-full bg-[var(--lito-ink)] text-[var(--lito-cream)] border-none text-[13px] font-medium cursor-pointer font-body transition-opacity duration-150 ${uploading ? 'opacity-70' : 'opacity-100'}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf"
            className="sr-only"
            onChange={handleFileChange}
            aria-label="Upload files"
          />
        </div>

        {/* Dropzone */}
        <div
          className={`border-2 border-dashed border-[var(--lito-border)] rounded-[10px] py-7 px-5 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-[border-color,background] duration-200 mb-4 ${uploading ? 'bg-[rgba(212,168,83,0.04)] opacity-60 pointer-events-none' : 'bg-transparent'}`}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--lito-gold)' }}
          onDragLeave={e => (e.currentTarget.style.borderColor = 'var(--lito-border)')}
          onDrop={e => { e.currentTarget.style.borderColor = 'var(--lito-border)'; handleDrop(e) }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={22} className="text-[var(--text-muted)]" aria-hidden />
          <p className="font-body text-[13px] text-[var(--text-muted)]">
            Drop files here or{' '}
            <span className="text-[var(--lito-gold)] underline">browse</span>
          </p>
          <p className="font-body text-[11px] text-[var(--text-faint)]">Images, videos, PDFs up to 50 MB</p>
        </div>

        {uploadError && (
          <div className="px-3 py-2 rounded-md bg-[var(--cms-danger-bg)] border border-[rgba(163,48,40,0.2)] mb-3" role="alert">
            <p className="font-body text-xs text-[var(--cms-danger)]">{uploadError}</p>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-[10px]">
          <SearchInput
            value={filter.q}
            onChange={(q) => setFilter({ q, page: 1 })}
            placeholder="Search media…"
            className="w-56"
          />
          <select
            className="cms-input h-[34px] w-[140px] text-xs"
            value={filter.media_type}
            onChange={e => setFilter({ media_type: e.target.value, page: 1 })}
          >
            <option value="">All types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
          </select>

          <div className="ml-auto flex gap-1">
            <button type="button" aria-label="Grid view" onClick={() => setViewMode('grid')}
              className={`${iconBtnBase} ${viewMode === 'grid' ? iconBtnActive : iconBtnInactive}`}>
              <Grid size={14} />
            </button>
            <button type="button" aria-label="List view" onClick={() => setViewMode('list')}
              className={`${iconBtnBase} ${viewMode === 'list' ? iconBtnActive : iconBtnInactive}`}>
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-7 pb-7">
        {/* Storage ring card */}
        <div className="cms-card mb-4 overflow-hidden">
          <StorageRing usedMb={(meta?.total ?? 0) * 0.8} totalMb={5000} />
        </div>

        {isLoading ? (
          viewMode === 'grid' ? (
            <div className="grid gap-[10px] [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
              {Array.from({ length: 20 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-md" />)}
            </div>
          ) : (
            <div className="cms-card overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-4 py-[10px] flex gap-3 border-b border-[var(--lito-border)]">
                  <Skeleton className="h-10 w-14 rounded" />
                  <div className="flex-1"><Skeleton className="h-3.5 w-48 mb-1" /><Skeleton className="h-2.5 w-24" /></div>
                  <Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          )
        ) : items.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No media files" description="Upload images and videos to get started" />
        ) : viewMode === 'grid' ? (
          <div className="grid gap-[10px] [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
            {items.map(item => (
              <GridCard
                key={item.id}
                item={item}
                selected={selected.has(item.id)}
                onSelect={() => toggleSelect(item.id)}
                onDelete={() => onDelete(item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="cms-card overflow-hidden">
            <table className="cms-table">
              <thead>
                <tr>
                  <th className="w-5"><input type="checkbox" aria-label="Select all" /></th>
                  <th>File</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Added</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} aria-label={`Select ${item.filename}`} /></td>
                    <td>
                      <div className="flex items-center gap-[10px]">
                        {isImageMime(item.mime_type) ? (
                          <img src={item.cdn_url ?? item.original_url ?? ''} alt="" className="w-12 h-[34px] object-cover rounded-[3px] shrink-0" loading="lazy" />
                        ) : (
                          <div className="w-12 h-[34px] rounded-[3px] bg-[var(--lito-cream-alt)] flex items-center justify-center shrink-0">
                            <MediaTypeIcon mimeType={item.mime_type} className="w-4 h-4" />
                          </div>
                        )}
                        <span className="font-body text-[13px] font-medium text-[var(--text-primary)]">{item.filename}</span>
                      </div>
                    </td>
                    <td>
                      <span className="px-[7px] py-[2px] rounded-[3px] bg-[var(--lito-cream-alt)] text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                        {item.mime_type.split('/')[1]?.slice(0, 4)}
                      </span>
                    </td>
                    <td><span className="text-xs text-[var(--text-muted)]">{formatBytes(item.size_bytes)}</span></td>
                    <td><span className="text-xs text-[var(--text-muted)]">{new Date(item.created_at).toLocaleDateString()}</span></td>
                    <td>
                      <button
                        type="button"
                        aria-label={`Delete ${item.filename}`}
                        onClick={() => onDelete(item.id)}
                        className="bg-transparent border-none cursor-pointer p-1 text-[var(--text-muted)] flex rounded hover:text-[var(--cms-danger)] hover:bg-[var(--cms-danger-bg)]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
