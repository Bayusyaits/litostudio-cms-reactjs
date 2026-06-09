'use client'
// apps/cms/src/app/(dashboard)/forms/page.tsx
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus, FormInput } from 'lucide-react'
import { PageHeader, Button, DataTable, StatusBadge, formatDate, Badge } from '@litostudio/ui'
import type { ColumnDef } from '@tanstack/react-table'
import { api } from '@/lib/api'
import type { ContentStatus } from '@litostudio/ui'

interface Form {
  id: string
  name: string
  submission_count: number
  status: ContentStatus
  updated_at: string
}

const columns: ColumnDef<Form>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <Link href={`/forms/${row.original.id}`} className="font-medium text-sm hover:underline">
        {row.getValue('name')}
      </Link>
    ),
  },
  {
    accessorKey: 'submission_count',
    header: 'Submissions',
    cell: ({ row }) => (
      <Badge variant="secondary" className="text-xs">{row.getValue('submission_count')}</Badge>
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

export default function FormsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['forms'],
    queryFn: () => api.get<{ data: Form[] }>('/api/v1/cms/forms'),
  })
  const forms = data?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader title="Forms" description="Manage contact forms and submissions.">
        <Button asChild><Link href="/forms/new"><Plus className="h-4 w-4" /> New form</Link></Button>
      </PageHeader>

      {!isLoading && forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FormInput className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-sm font-medium mb-1">No forms yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first contact form.</p>
          <Button asChild><Link href="/forms/new"><Plus className="h-4 w-4" /> New form</Link></Button>
        </div>
      ) : (
        <DataTable columns={columns} data={forms} isLoading={isLoading} searchKey="name" searchPlaceholder="Search forms…" />
      )}
    </div>
  )
}
