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
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
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
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>Storage</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          {formatBytes(usedMb * 1024 * 1024)} of {formatBytes(totalMb * 1024 * 1024)}
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>
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
      style={{
        position: 'relative', borderRadius: 6, overflow: 'hidden', cursor: 'pointer',
        border: `1.5px solid ${selected ? 'var(--lito-gold)' : 'var(--lito-border)'}`,
        aspectRatio: '4/3',
        background: 'var(--lito-cream-alt)',
        transition: 'border-color 150ms',
      }}
      onClick={onSelect}
    >
      {isImageMime(item.mime_type) ? (
        <img src={item.cdn_url ?? item.original_url ?? ''} alt={item.alt_text ?? item.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <MediaTypeIcon mimeType={item.mime_type} className="w-8 h-8" />
          <span style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', padding: '0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
            {item.filename}
          </span>
        </div>
      )}

      {/* Type badge */}
      <div style={{
        position: 'absolute', top: 5, left: 5,
        padding: '2px 5px', borderRadius: 3,
        background: 'rgba(17,17,17,0.55)', backdropFilter: 'blur(4px)',
        fontSize: 9, fontWeight: 600, color: '#fff', letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}>
        {item.mime_type.split('/')[1]?.slice(0, 4) ?? 'FILE'}
      </div>

      {/* Selection check */}
      {selected && (
        <div style={{
          position: 'absolute', top: 5, right: 5,
          width: 18, height: 18, borderRadius: '50%',
          background: 'var(--lito-gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={10} color="#111" strokeWidth={3} />
        </div>
      )}

      {/* Hover overlay */}
      <div
        className="group-overlay"
        style={{
          position: 'absolute', inset: 0, background: 'rgba(17,17,17,0)',
          display: 'flex', alignItems: 'flex-end', padding: 6,
          transition: 'background 150ms',
          opacity: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(17,17,17,0.45)' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.background = 'rgba(17,17,17,0)' }}
      >
        <button
          type="button"
          aria-label={`Delete ${item.filename}`}
          onClick={e => { e.stopPropagation(); onDelete() }}
          style={{
            marginLeft: 'auto', width: 24, height: 24, borderRadius: '50%',
            background: 'rgba(163,48,40,0.8)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
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

  const iconBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, borderRadius: 4,
    border: '1px solid var(--lito-border)',
    background: 'transparent', cursor: 'pointer',
    color: 'var(--text-muted)', transition: 'all 150ms',
  }

  return (
    <div className="cms-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '24px 28px 16px', flexShrink: 0, background: 'var(--cms-main-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--text-primary)' }}>Media Library</h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              {meta ? `${meta.total.toLocaleString()} files` : 'Upload and manage media'}
            </p>
          </div>
          <button
            type="button"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 999,
              background: uploading ? 'var(--lito-ink)' : 'var(--lito-ink)',
              color: 'var(--lito-cream)', border: 'none',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)',
              opacity: uploading ? 0.7 : 1,
            }}
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
          style={{
            border: '2px dashed var(--lito-border)',
            borderRadius: 10, padding: '28px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
            textAlign: 'center', cursor: 'pointer',
            transition: 'border-color 200ms, background 200ms',
            background: uploading ? 'rgba(212,168,83,0.04)' : 'transparent',
            opacity: uploading ? 0.6 : 1,
            pointerEvents: uploading ? 'none' : 'auto',
            marginBottom: 16,
          }}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--lito-gold)' }}
          onDragLeave={e => (e.currentTarget.style.borderColor = 'var(--lito-border)')}
          onDrop={e => { e.currentTarget.style.borderColor = 'var(--lito-border)'; handleDrop(e) }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={22} style={{ color: 'var(--text-muted)' }} aria-hidden />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
            Drop files here or{' '}
            <span style={{ color: 'var(--lito-gold)', textDecoration: 'underline' }}>browse</span>
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-faint)' }}>Images, videos, PDFs up to 50 MB</p>
        </div>

        {uploadError && (
          <div style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--cms-danger-bg)', border: '1px solid rgba(163,48,40,0.2)', marginBottom: 12 }} role="alert">
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--cms-danger)' }}>{uploadError}</p>
          </div>
        )}

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SearchInput
            value={filter.q}
            onChange={(q) => setFilter({ q, page: 1 })}
            placeholder="Search media…"
            className="w-56"
          />
          <select
            className="cms-input"
            style={{ height: 34, width: 140, fontSize: 12 }}
            value={filter.media_type}
            onChange={e => setFilter({ media_type: e.target.value, page: 1 })}
          >
            <option value="">All types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button type="button" aria-label="Grid view" onClick={() => setViewMode('grid')}
              style={{ ...iconBtn, background: viewMode === 'grid' ? 'var(--lito-ink)' : 'transparent', color: viewMode === 'grid' ? 'var(--lito-cream)' : 'var(--text-muted)', borderColor: viewMode === 'grid' ? 'var(--lito-ink)' : 'var(--lito-border)' }}>
              <Grid size={14} />
            </button>
            <button type="button" aria-label="List view" onClick={() => setViewMode('list')}
              style={{ ...iconBtn, background: viewMode === 'list' ? 'var(--lito-ink)' : 'transparent', color: viewMode === 'list' ? 'var(--lito-cream)' : 'var(--text-muted)', borderColor: viewMode === 'list' ? 'var(--lito-ink)' : 'var(--lito-border)' }}>
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 28px' }}>
        {/* Storage ring card */}
        <div className="cms-card" style={{ marginBottom: 16, overflow: 'hidden' }}>
          <StorageRing usedMb={(meta?.total ?? 0) * 0.8} totalMb={5000} />
        </div>

        {isLoading ? (
          viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              {Array.from({ length: 20 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-md" />)}
            </div>
          ) : (
            <div className="cms-card" style={{ overflow: 'hidden' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ padding: '10px 16px', display: 'flex', gap: 12, borderBottom: '1px solid var(--lito-border)' }}>
                  <Skeleton className="h-10 w-14 rounded" />
                  <div style={{ flex: 1 }}><Skeleton className="h-3.5 w-48 mb-1" /><Skeleton className="h-2.5 w-24" /></div>
                  <Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          )
        ) : items.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No media files" description="Upload images and videos to get started" />
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
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
          <div className="cms-card" style={{ overflow: 'hidden' }}>
            <table className="cms-table">
              <thead>
                <tr>
                  <th style={{ width: 20 }}><input type="checkbox" aria-label="Select all" /></th>
                  <th>File</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Added</th>
                  <th style={{ width: 48 }} />
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} aria-label={`Select ${item.filename}`} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isImageMime(item.mime_type) ? (
                          <img src={item.cdn_url ?? item.original_url ?? ''} alt="" style={{ width: 48, height: 34, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} loading="lazy" />
                        ) : (
                          <div style={{ width: 48, height: 34, borderRadius: 3, background: 'var(--lito-cream-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <MediaTypeIcon mimeType={item.mime_type} className="w-4 h-4" />
                          </div>
                        )}
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{item.filename}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ padding: '2px 7px', borderRadius: 3, background: 'var(--lito-cream-alt)', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {item.mime_type.split('/')[1]?.slice(0, 4)}
                      </span>
                    </td>
                    <td><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatBytes(item.size_bytes)}</span></td>
                    <td><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleDateString()}</span></td>
                    <td>
                      <button
                        type="button"
                        aria-label={`Delete ${item.filename}`}
                        onClick={() => onDelete(item.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', display: 'flex', borderRadius: 4 }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--cms-danger)'; e.currentTarget.style.background = 'var(--cms-danger-bg)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}
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
