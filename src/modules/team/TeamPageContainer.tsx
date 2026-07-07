import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamService, type InvitePayload } from '@/services/team.service'
import { TeamPageView } from './TeamPageView'
import { getErrorMessage } from '@litostudio/ui-cms'

export default function TeamPageContainer() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['team', page, search],
    queryFn: () => teamService.getMembers({ page, limit: 20, search: search || undefined }),
    staleTime: 2 * 60 * 1000,
  })

  const inviteMutation = useMutation({
    mutationFn: (payload: InvitePayload) => teamService.invite(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] })
      setInviteError(null)
    },
    onError: (err) => setInviteError(getErrorMessage(err)),
  })

  const roleChangeMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: InvitePayload['role'] }) =>
      teamService.updateRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => teamService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  })

  return (
    <TeamPageView
      members={data?.data ?? []}
      meta={undefined}
      isLoading={isLoading}
      search={search}
      onSearch={useCallback((s: string) => { setSearch(s); setPage(1) }, [])}
      page={page}
      onPage={setPage}
      onInvite={(payload) => inviteMutation.mutate(payload)}
      inviting={inviteMutation.isPending}
      inviteError={inviteError}
      onChangeRole={(id, role) => roleChangeMutation.mutate({ id, role })}
      onRemove={(id) => removeMutation.mutate(id)}
    />
  )
}
