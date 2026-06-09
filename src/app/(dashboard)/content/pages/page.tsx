'use client'
// apps/cms/src/app/(dashboard)/content/pages/page.tsx
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, FileText, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, Button, Badge, DataTable, StatusBadge, formatDate } from '@litostudio/ui'
import type { ColumnDef } from '@tanstack/react-table'
import { api } from '@/lib/api'
import type { ContentStatus } from '@litostudio/ui'

interface Page {
  id: string
  title: string
  slug: string
  status: ContentStatus
  updated_at: string
}

const columns: ColumnDef<Page>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <Link href={`/content/pages/${row.original.id}`} className="font-medium text-sm hover:underline">
        {row.getValue('title')}
      </Link>
    ),
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => (
      <span className="text-xs font-mono text-muted-foreground">/{row.getValue('slug')}</span>
    ),
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

export default function PagesListPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['content-pages'],
    queryFn: () => api.get<{ data: Page[] }>('/api/v1/cms/content/pages'),
  })

  const pages = data?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader title="Pages" description="Manage static website pages.">
        <Button asChild>
          <Link href="/content/pages/new"><Plus className="h-4 w-4" /> New page</Link>
        </Button>
      </PageHeader>

      {!isLoading && pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-sm font-medium mb-1">No pages yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first page to get started.</p>
          <Button asChild><Link href="/content/pages/new"><Plus className="h-4 w-4" /> New page</Link></Button>
        </div>
      ) : (
        <DataTable columns={columns} data={pages} isLoading={isLoading} searchKey="title" searchPlaceholder="Search pages…" />
      )}
    </div>
  )
}
