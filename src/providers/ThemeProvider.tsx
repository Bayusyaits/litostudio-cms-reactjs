import { useEffect } from 'react'
import { useThemeStore } from '@/stores/theme.store'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { colorMode, setColorMode } = useThemeStore()

  // Apply theme on mount and whenever colorMode changes
  useEffect(() => {
    setColorMode(colorMode)
  }, [colorMode, setColorMode])

  // Listen for system preference changes when mode is 'system'
  useEffect(() => {
    if (colorMode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setColorMode('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [colorMode, setColorMode])

  return <>{children}</>
}
