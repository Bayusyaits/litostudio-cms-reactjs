// modules/settings/labels/LabelsPageContainer.tsx
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { labelsService } from '@/services/labels.service'
import { useOrgStore } from '@/stores/org.store'
import { LabelsPageView } from './LabelsPageView'
import type { LabelUpdatePayload, LabelUpsertPayload } from '@/services/labels.service'

export default function LabelsPageContainer() {
  const { org } = useOrgStore()
  const qc = useQueryClient()

  const [filter, setFilter] = useState({
    locale: 'id',
    group_name: '',
    search: '',
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkJson, setBulkJson] = useState('')
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [mutateError, setMutateError] = useState<string | null>(null)

  const qKey = ['labels', org?.id, filter.locale, filter.group_name, filter.search]

  const { data, isLoading } = useQuery({
    queryKey: qKey,
    queryFn: () =>
      labelsService.list({
        organization_id: org!.id,
        locale: filter.locale,
        group_name: filter.group_name || undefined,
        search: filter.search || undefined,
      }),
    enabled: !!org,
    staleTime: 60_000,
  })

  const { data: groupsData } = useQuery({
    queryKey: ['label-groups', org?.id],
    queryFn: () => labelsService.groups(org!.id),
    enabled: !!org,
    staleTime: 5 * 60_000,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LabelUpdatePayload }) =>
      labelsService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labels', org?.id] })
      setEditingId(null)
      setMutateError(null)
    },
    onError: (err: Error) => setMutateError(err.message),
  })

  const createMutation = useMutation({
    mutationFn: (payload: LabelUpsertPayload) => labelsService.upsert(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labels', org?.id] })
      qc.invalidateQueries({ queryKey: ['label-groups', org?.id] })
      setShowCreateModal(false)
      setMutateError(null)
    },
    onError: (err: Error) => setMutateError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => labelsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labels', org?.id] })
    },
    onError: (err: Error) => setMutateError(err.message),
  })

  const bulkMutation = useMutation({
    mutationFn: () => {
      const parsed = JSON.parse(bulkJson) as Array<{
        key: string; value: string; group_name?: string; description?: string
      }>
      return labelsService.bulkImport({
        organization_id: org!.id,
        locale: filter.locale,
        labels: parsed,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labels', org?.id] })
      qc.invalidateQueries({ queryKey: ['label-groups', org?.id] })
      setShowBulkModal(false)
      setBulkJson('')
      setBulkError(null)
    },
    onError: (err: Error) => setBulkError(err.message),
  })

  const handleBulkImport = useCallback(() => {
    setBulkError(null)
    try {
      JSON.parse(bulkJson)
    } catch {
      setBulkError('Invalid JSON')
      return
    }
    bulkMutation.mutate()
  }, [bulkJson, bulkMutation])

  const handleExport = useCallback(() => {
    const rows = (data?.data ?? []).map((l) => ({
      key: l.key,
      value: l.value,
      group_name: l.group_name,
      description: l.description,
    }))
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `labels-${filter.locale}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [data, filter.locale])

  return (
    <LabelsPageView
      labels={data?.data ?? []}
      groups={groupsData?.data ?? []}
      isLoading={isLoading}
      filter={filter}
      setFilter={(f) => setFilter((prev) => ({ ...prev, ...f }))}
      // Inline edit
      editingId={editingId}
      editingValue={editingValue}
      onStartEdit={(id, currentValue) => { setEditingId(id); setEditingValue(currentValue) }}
      onCancelEdit={() => setEditingId(null)}
      onSaveEdit={(id) => updateMutation.mutate({ id, payload: { value: editingValue } })}
      onEditingValueChange={setEditingValue}
      saving={updateMutation.isPending}
      // Create modal
      showCreateModal={showCreateModal}
      onOpenCreate={() => setShowCreateModal(true)}
      onCloseCreate={() => { setShowCreateModal(false); setMutateError(null) }}
      onCreate={(payload) => createMutation.mutate({ ...payload, organization_id: org!.id, locale: filter.locale })}
      creating={createMutation.isPending}
      // Delete
      onDelete={(id) => deleteMutation.mutate(id)}
      // Bulk
      showBulkModal={showBulkModal}
      onOpenBulk={() => setShowBulkModal(true)}
      onCloseBulk={() => { setShowBulkModal(false); setBulkJson(''); setBulkError(null) }}
      bulkJson={bulkJson}
      onBulkJsonChange={setBulkJson}
      onBulkImport={handleBulkImport}
      bulkImporting={bulkMutation.isPending}
      bulkError={bulkError}
      // Export
      onExport={handleExport}
      mutateError={mutateError}
    />
  )
}
