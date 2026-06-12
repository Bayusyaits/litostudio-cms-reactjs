// apps/cms/src/modules/organizations/OrganizationsPageContainer.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { orgService } from '@/services/org.service'
import { useOrgStore } from '@/stores/org.store'
import { useWebsiteStore } from '@/stores/website.store'
import { useAuthStore } from '@/stores/auth.store'
import type { Organization } from '@/types/auth.types'
import { OrganizationsPageView } from './OrganizationsPageView'
import { OrgFormModal } from './OrgFormModal'

export default function OrganizationsPageContainer() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { org: activeOrg, setOrg } = useOrgStore()
  const { setActiveSite, clearSites } = useWebsiteStore()
  const { user, setUser } = useAuthStore()

  const [modalOrg, setModalOrg] = useState<Organization | null | undefined>(undefined)
  // undefined = closed, null = create mode, Organization = edit mode

  // Fetch orgs — wraps the single-org endpoint into an array
  const { data: orgsData, isLoading } = useQuery({
    queryKey: ['orgs'],
    queryFn: orgService.getOrgs,
    staleTime: 60_000,
  })

  const orgs: Organization[] = orgsData?.data ?? []

  // ── Create ───────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: { name: string; slug: string }) =>
      orgService.createOrg(payload),
    onSuccess: (newOrg) => {
      if (!newOrg) return
      qc.invalidateQueries({ queryKey: ['orgs'] })

      // Track whether this is the user's first org (for post-create redirect)
      const isFirstOrg = !activeOrg

      // Auto-select the newly created org
      setOrg(newOrg)
      clearSites()
      // Update user's org context in auth store
      if (user) setUser({ ...user, org_id: newOrg.id, org_role: 'owner' })

      // Reload sites for the new org then auto-select the first one
      orgService.getSitesByOrg(newOrg.id).then(res => {
        const sites = res.data ?? []
        if (sites.length > 0) setActiveSite(sites[0]!)
      })

      setModalOrg(undefined)

      // First-time org creation: redirect to dashboard so the user can start
      // managing content. Subsequent org additions stay on /organizations.
      if (isFirstOrg) {
        navigate('/dashboard', { replace: true })
      }
    },
  })

  // ── Update ───────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name: string; slug: string } }) =>
      orgService.updateOrgById(id, payload),
    onSuccess: (updated) => {
      if (!updated) return
      qc.invalidateQueries({ queryKey: ['orgs'] })
      // Keep activeOrg in sync
      if (activeOrg?.id === updated.id) setOrg(updated)
      setModalOrg(undefined)
    },
  })

  // ── Delete ───────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => orgService.deleteOrg(id),
    onSuccess: (_v, id) => {
      qc.invalidateQueries({ queryKey: ['orgs'] })
      if (activeOrg?.id === id) {
        setOrg(null)
        clearSites()
      }
    },
  })

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function handleSave(payload: { name: string; slug: string }) {
    if (modalOrg) {
      await updateMutation.mutateAsync({ id: modalOrg.id, payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
  }

  function handleSelect(org: Organization) {
    setOrg(org)
    clearSites()
    orgService.getSitesByOrg(org.id).then(res => {
      const sites = res.data ?? []
      if (sites.length > 0) setActiveSite(sites[0]!)
    })
  }

  return (
    <>
      <OrganizationsPageView
        orgs={orgs}
        isLoading={isLoading}
        activeOrgId={activeOrg?.id ?? null}
        onSelect={handleSelect}
        onCreate={() => setModalOrg(null)}
        onEdit={(org) => setModalOrg(org)}
        onDelete={(org) => deleteMutation.mutate(org.id)}
      />

      {modalOrg !== undefined && (
        <OrgFormModal
          org={modalOrg}
          onSave={handleSave}
          onClose={() => setModalOrg(undefined)}
        />
      )}
    </>
  )
}
