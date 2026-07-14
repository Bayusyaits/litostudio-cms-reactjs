import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamService, type InvitePayload } from '@/services/team.service'
import { TeamPageView } from './TeamPageView'
import { getErrorMessage } from '@litostudio/ui-cms'

// `page`/`search` used to be tracked here and threaded through to
// teamService.getMembers({ page, limit, search }) — but that call ignores
// them (its `_params` argument is never actually forwarded to the HTTP
// request; see team.service.ts), so the backend always returns every
// member regardless, `meta` was always passed as `undefined` below, and the
// pagination footer + search box were dead UI (typing in search filtered
// nothing; the page-number footer never rendered since meta was always
// undefined). Migrating to EnterpriseDataTable (skin="cms") replaces that
// with its own client-side searchKeys filter over the full member list,
// which actually works. Backend pagination is a separate, pre-existing gap
// — not addressed here.
export default function TeamPageContainer() {
  const qc = useQueryClient()
  const [inviteError, setInviteError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: () => teamService.getMembers(),
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
      isLoading={isLoading}
      onInvite={(payload) => inviteMutation.mutate(payload)}
      inviting={inviteMutation.isPending}
      inviteError={inviteError}
      onChangeRole={(id, role) => roleChangeMutation.mutate({ id, role })}
      onRemove={(id) => removeMutation.mutate(id)}
    />
  )
}
