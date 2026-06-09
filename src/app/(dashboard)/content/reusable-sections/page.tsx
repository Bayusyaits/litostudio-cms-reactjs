'use client'
// apps/cms/src/app/(dashboard)/content/reusable-sections/page.tsx
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Layers, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, Button, DataTable, StatusBadge, Badge, formatDate } from '@litostudio/ui'
import type { ColumnDef } from '@tanstack/react-table'
import { api } from '@/lib/api'
import type { ContentStatus } from '@litostudio/ui'

interface ReusableSection {
  id: string
  name: string
  section_type: string
  status: ContentStatus
  updated_at: string
}

const columns: ColumnDef<ReusableSection>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <Link href={`/content/reusable-sections/${row.original.id}`} className="font-medium text-sm hover:underline">
        {row.getValue('name')}
      </Link>
    ),
  },
  {
    accessorKey: 'section_type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant="secondary" className="text-xs capitalize">{row.getValue('section_type')}</Badge>
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

export default function ReusableSectionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['content-reusable-sections'],
    queryFn: () => api.get<{ data: ReusableSection[] }>('/api/v1/cms/content/reusable-sections'),
  })
  const items = data?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader title="Reusable Sections" description="Shared section components used across pages.">
        <Button asChild>
          <Link href="/content/reusable-sections/new"><Plus className="h-4 w-4" /> New section</Link>
        </Button>
      </PageHeader>

      {!isLoading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Layers className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-sm font-medium mb-1">No reusable sections yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create shared sections to use across your pages.</p>
          <Button asChild><Link href="/content/reusable-sections/new"><Plus className="h-4 w-4" /> New section</Link></Button>
        </div>
      ) : (
        <DataTable columns={columns} data={items} isLoading={isLoading} searchKey="name" searchPlaceholder="Search sections…" />
      )}
    </div>
  )
}
