import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWebsiteStore } from '@/stores/website.store'
import { navigationService, type NavigationMenu, type NavItem } from '@/services/navigation.service'
import { NavigationPageView } from './NavigationPageView'

export default function NavigationPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()
  const siteId = activeSite?.id ?? ''
  const [activeLocation, setActiveLocation] = useState('primary')

  const menusQuery = useQuery({
    queryKey: ['navigation', 'menus', siteId],
    queryFn:  () => navigationService.getMenus(siteId),
    enabled:  !!siteId,
    staleTime: 2 * 60 * 1000,
  })

  const menus: NavigationMenu[] = menusQuery.data?.data ?? []
  const activeMenu = menus.find((m) => m.location === activeLocation) ?? null

  const saveMutation = useMutation({
    mutationFn: (items: NavItem[]) =>
      navigationService.updateMenu(siteId, activeLocation, {
        name:  activeMenu?.name ?? activeLocation,
        items,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['navigation', 'menus', siteId] })
    },
  })

  return (
    <NavigationPageView
      menus={menus}
      activeMenu={activeMenu}
      activeLocation={activeLocation}
      isLoading={menusQuery.isLoading}
      isSaving={saveMutation.isPending}
      onSelectLocation={setActiveLocation}
      onSave={(items) => saveMutation.mutate(items)}
    />
  )
}
