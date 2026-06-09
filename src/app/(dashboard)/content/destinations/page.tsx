'use client'
// apps/cms/src/app/(dashboard)/content/destinations/page.tsx
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus, MapPin } from 'lucide-react'
import { PageHeader, Button, DataTable, StatusBadge, formatDate } from '@litostudio/ui'
import type { ColumnDef } from '@tanstack/react-table'
import { api } from '@/lib/api'
import type { ContentStatus } from '@litostudio/ui'

interface Destination {
  id: string
  name: string
  country: string
  status: ContentStatus
  updated_at: string
}

const columns: ColumnDef<Destination>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <Link href={`/content/destinations/${row.original.id}`} className="font-medium text-sm hover:underline">
        {row.getValue('name')}
      </Link>
    ),
  },
  {
    accessorKey: 'country',
    header: 'Country',
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue('country') || '—'}</span>,
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

export default function DestinationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['content-destinations'],
    queryFn: () => api.get<{ data: Destination[] }>('/api/v1/cms/content/destinations'),
  })
  const items = data?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader title="Destinations" description="Travel destinations and locations.">
        <Button asChild>
          <Link href="/content/destinations/new"><Plus className="h-4 w-4" /> New destination</Link>
        </Button>
      </PageHeader>
      {!isLoading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-sm font-medium mb-1">No destinations yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Add your first travel destination.</p>
          <Button asChild><Link href="/content/destinations/new"><Plus className="h-4 w-4" /> New destination</Link></Button>
        </div>
      ) : (
        <DataTable columns={columns} data={items} isLoading={isLoading} searchKey="name" searchPlaceholder="Search destinations…" />
      )}
    </div>
  )
}
