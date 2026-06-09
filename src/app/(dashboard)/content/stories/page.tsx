'use client'
// apps/cms/src/app/(dashboard)/content/stories/page.tsx
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus, BookOpen } from 'lucide-react'
import { PageHeader, Button, DataTable, StatusBadge, formatDate } from '@litostudio/ui'
import type { ColumnDef } from '@tanstack/react-table'
import { api } from '@/lib/api'
import type { ContentStatus } from '@litostudio/ui'

interface Story {
  id: string
  title: string
  category: string
  status: ContentStatus
  published_at: string | null
  updated_at: string
}

const columns: ColumnDef<Story>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <Link href={`/content/stories/${row.original.id}`} className="font-medium text-sm hover:underline">
        {row.getValue('title')}
      </Link>
    ),
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => <span className="text-sm text-muted-foreground capitalize">{row.getValue('category') || '—'}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
  },
  {
    accessorKey: 'updated_at',
    header: 'Updated',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{formatDate(row.getValue('updated_at'))}</span>
    ),
  },
]

export default function StoriesListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['content-stories'],
    queryFn: () => api.get<{ data: Story[] }>('/api/v1/cms/content/stories'),
  })

  const stories = data?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader title="Stories" description="Articles, blogs, and photo essays.">
        <Button asChild>
          <Link href="/content/stories/new"><Plus className="h-4 w-4" /> New story</Link>
        </Button>
      </PageHeader>

      {!isLoading && stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-sm font-medium mb-1">No stories yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Write your first story.</p>
          <Button asChild><Link href="/content/stories/new"><Plus className="h-4 w-4" /> New story</Link></Button>
        </div>
      ) : (
        <DataTable columns={columns} data={stories} isLoading={isLoading} searchKey="title" searchPlaceholder="Search stories…" />
      )}
    </div>
  )
}
