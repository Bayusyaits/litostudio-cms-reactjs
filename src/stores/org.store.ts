import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Organization } from '@/types/auth.types'

interface OrgStore {
  org: Organization | null
  setOrg: (org: Organization | null) => void
  clearOrg: () => void
}

export const useOrgStore = create<OrgStore>()(
  persist(
    (set) => ({
      org:      null,
      setOrg:   (org) => set({ org }),
      clearOrg: () => set({ org: null }),
    }),
    { name: 'cms-org' },
  ),
)
