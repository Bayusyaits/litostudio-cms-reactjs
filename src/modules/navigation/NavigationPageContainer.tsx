import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWebsiteStore } from '@/stores/website.store'
import { navigationService, type NavItem } from '@/services/navigation.service'
import { NavigationPageView } from './NavigationPageView'

// Virtual "menu" shape expected by NavigationPageView, constructed by grouping nav_type
export interface NavigationMenu {
  location: string
  name: string
  items: NavItem[]
}

export default function NavigationPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()
  const siteId = activeSite?.id ?? ''
  const [activeLocation, setActiveLocation] = useState('main')

  const navQuery = useQuery({
    queryKey: ['navigation', siteId],
    queryFn:  () => navigationService.getNavigation(siteId),
    enabled:  !!siteId,
    staleTime: 2 * 60 * 1000,
  })

  // Group flat NavItem[] by nav_type to create virtual menus
  const allItems: NavItem[] = navQuery.data?.data ?? []
  const locationSet = ['main', 'footer', 'social']
  const menus: NavigationMenu[] = locationSet.map((loc) => ({
    location: loc,
    name: loc.charAt(0).toUpperCase() + loc.slice(1) + ' Menu',
    items: allItems.filter((item) => (item.nav_type ?? 'main') === loc),
  }))

  const activeMenu = menus.find((m) => m.location === activeLocation) ?? menus[0] ?? null

  const saveMutation = useMutation({
    mutationFn: (items: NavItem[]) => {
      const otherItems = allItems.filter((item) => (item.nav_type ?? 'main') !== activeLocation)
      const newItems = items.map((item) => ({ ...item, nav_type: activeLocation }))
      return navigationService.updateNavigation(siteId, [...otherItems, ...newItems])
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['navigation', siteId] })
    },
  })

  return (
    <NavigationPageView
      menus={menus}
      activeMenu={activeMenu}
      activeLocation={activeLocation}
      isLoading={navQuery.isLoading}
      isSaving={saveMutation.isPending}
      onSelectLocation={setActiveLocation}
      onSave={(items) => saveMutation.mutate(items)}
    />
  )
}
