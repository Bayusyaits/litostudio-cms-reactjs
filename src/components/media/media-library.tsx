'use client'
// apps/cms/src/components/media/media-library.tsx
import { useCallback, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, X, Copy, Trash2, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Button, formatBytes, cn } from '@litostudio/ui'

interface MediaFile {
  id: string
  filename: string
  url: string
  size: number
  mime_type: string
  created_at: string
}

interface PresignResponse { upload_url: string; key: string }
interface ConfirmResponse { id: string; url: string }

export function MediaLibrary() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [selected, setSelected] = useState<MediaFile | null>(null)
  const [uploading, setUploading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['media'],
    queryFn: () => api.get<{ data: MediaFile[] }>('/api/v1/cms/media'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/cms/media/${id}`),
    onSuccess: () => {
      toast.success('File deleted')
      setSelected(null)
      queryClient.invalidateQueries({ queryKey: ['media'] })
    },
    onError: () => toast.error('Delete failed'),
  })

  async function uploadFiles(files: File[]) {
    setUploading(true)
    for (const file of files) {
      try {
        const { upload_url, key } = await api.post<PresignResponse>('/api/v1/cms/media/presign', {
          filename: file.name,
          content_type: file.type,
          size: file.size,
        })
        await fetch(upload_url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
        await api.post<ConfirmResponse>('/api/v1/cms/media/confirm', { key, filename: file.name, size: file.size, mime_type: file.type })
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    setUploading(false)
    queryClient.invalidateQueries({ queryKey: ['media'] })
    toast.success('Upload complete')
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) uploadFiles(files)
  }, [])

  const files = data?.data ?? []

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50',
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium">{uploading ? 'Uploading…' : 'Drop files here or click to upload'}</p>
        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP, PDF up to 25 MB</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => { const f = Array.from(e.target.files ?? []); if (f.length) uploadFiles(f) }}
        />
      </div>

      {/* Grid + detail panel */}
      <div className="flex gap-4">
        {/* Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ImageIcon className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No media files yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => setSelected(file.id === selected?.id ? null : file)}
                  className={cn(
                    'group relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                    selected?.id === file.id ? 'border-primary' : 'border-transparent hover:border-muted-foreground/40',
                  )}
                >
                  {file.mime_type.startsWith('image/') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-mono text-muted-foreground uppercase">
                        {file.mime_type.split('/')[1]}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-64 shrink-0 rounded-lg border border-border p-4 space-y-3 self-start sticky top-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate">{selected.filename}</p>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            {selected.mime_type.startsWith('image/') && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.url} alt={selected.filename} className="w-full rounded-md border border-border" />
            )}
            <dl className="text-xs space-y-1 text-muted-foreground">
              <div className="flex justify-between"><dt>Size</dt><dd>{formatBytes(selected.size)}</dd></div>
              <div className="flex justify-between"><dt>Type</dt><dd>{selected.mime_type}</dd></div>
            </dl>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => { navigator.clipboard.writeText(selected.url); toast.success('URL copied') }}
              >
                <Copy className="h-3.5 w-3.5" /> Copy URL
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteMutation.mutate(selected.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
