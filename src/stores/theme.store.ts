import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ColorMode = 'light' | 'dark' | 'system'

interface ThemeStore {
  colorMode:    ColorMode
  isDark:       boolean
  sidebarOpen:  boolean

  setColorMode: (mode: ColorMode) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  applyTheme: () => void
}

function resolveIsDark(mode: ColorMode): boolean {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      colorMode:   'light',
      isDark:      false,
      sidebarOpen: true,

      setColorMode: (mode) => {
        const isDark = resolveIsDark(mode)
        set({ colorMode: mode, isDark })
        if (isDark) document.documentElement.setAttribute('data-dark', '1')
        else document.documentElement.removeAttribute('data-dark')
      },

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      applyTheme: () => {
        const { colorMode } = get()
        const isDark = resolveIsDark(colorMode)
        set({ isDark })
        if (isDark) document.documentElement.setAttribute('data-dark', '1')
        else document.documentElement.removeAttribute('data-dark')
      },
    }),
    {
      name:       'cms-theme',
      partialize: (state) => ({ colorMode: state.colorMode }),
    },
  ),
)
