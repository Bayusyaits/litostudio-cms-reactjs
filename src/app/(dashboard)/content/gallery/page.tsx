'use client'
// apps/cms/src/app/(dashboard)/content/gallery/page.tsx
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus, ImageIcon } from 'lucide-react'
import { PageHeader, Button, Badge, Card, CardContent, StatusBadge, formatDate } from '@litostudio/ui'
import { api } from '@/lib/api'
import type { ContentStatus } from '@litostudio/ui'

interface Gallery {
  id: string
  title: string
  cover_url?: string
  photo_count: number
  status: ContentStatus
  updated_at: string
}

export default function GalleryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['content-gallery'],
    queryFn: () => api.get<{ data: Gallery[] }>('/api/v1/cms/content/gallery'),
  })
  const items = data?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader title="Gallery" description="Photo galleries and collections.">
        <Button asChild><Link href="/content/gallery/new"><Plus className="h-4 w-4" /> New gallery</Link></Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-0 aspect-video animate-pulse bg-muted/40" /></Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-sm font-medium mb-1">No galleries yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first gallery.</p>
          <Button asChild><Link href="/content/gallery/new"><Plus className="h-4 w-4" /> New gallery</Link></Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((g) => (
            <Link key={g.id} href={`/content/gallery/${g.id}`}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                <div className="aspect-video bg-muted relative">
                  {g.cover_url
                    ? <img src={g.cover_url} alt={g.title} className="w-full h-full object-cover" />
                    : <div className="flex items-center justify-center h-full"><ImageIcon className="h-8 w-8 text-muted-foreground/40" /></div>
                  }
                </div>
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm truncate">{g.title}</p>
                    <StatusBadge status={g.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{g.photo_count} photos · {formatDate(g.updated_at)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
