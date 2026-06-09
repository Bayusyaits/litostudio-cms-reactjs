'use client'
// apps/cms/src/app/(dashboard)/content/journal/page.tsx
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus, FileText } from 'lucide-react'
import { PageHeader, Button, DataTable, StatusBadge, formatDate } from '@litostudio/ui'
import type { ColumnDef } from '@tanstack/react-table'
import { api } from '@/lib/api'
import type { ContentStatus } from '@litostudio/ui'

interface JournalEntry {
  id: string
  title: string
  status: ContentStatus
  updated_at: string
}

const columns: ColumnDef<JournalEntry>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <Link href={`/content/journal/${row.original.id}`} className="font-medium text-sm hover:underline">
        {row.getValue('title')}
      </Link>
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
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.getValue('updated_at'))}</span>,
  },
]

export default function JournalPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['content-journal'],
    queryFn: () => api.get<{ data: JournalEntry[] }>('/api/v1/cms/content/journal'),
  })
  const items = data?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader title="Journal" description="Photography journals and reflections.">
        <Button asChild><Link href="/content/journal/new"><Plus className="h-4 w-4" /> New entry</Link></Button>
      </PageHeader>
      {!isLoading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-sm font-medium mb-1">No journal entries yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Start your first journal entry.</p>
          <Button asChild><Link href="/content/journal/new"><Plus className="h-4 w-4" /> New entry</Link></Button>
        </div>
      ) : (
        <DataTable columns={columns} data={items} isLoading={isLoading} searchKey="title" searchPlaceholder="Search journal…" />
      )}
    </div>
  )
}
