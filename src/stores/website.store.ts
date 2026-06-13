import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Site } from '@/types/auth.types'

interface WebsiteStore {
  activeSite: Site | null
  sites: Site[]
  setSites: (sites: Site[]) => void
  setActiveSite: (site: Site | null) => void
  clearSites: () => void
}

export const useWebsiteStore = create<WebsiteStore>()(
  persist(
    (set) => ({
      activeSite:    null,
      sites:         [],
      setSites:      (sites) => set({ sites }),
      setActiveSite: (site) => set({ activeSite: site }),
      clearSites:    () => set({ activeSite: null, sites: [] }),
    }),
    {
      name:       'cms-website',
      partialize: (state) => ({ activeSite: state.activeSite }),
    },
  ),
)
