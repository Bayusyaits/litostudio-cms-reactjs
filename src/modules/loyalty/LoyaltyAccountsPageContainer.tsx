// modules/loyalty/LoyaltyAccountsPageContainer.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { loyaltyService } from '@/services/loyalty.service'
import { useOrgStore } from '@litostudio/ui-cms'
import { LoyaltyAccountsPageView } from './LoyaltyAccountsPageView'

export default function LoyaltyAccountsPageContainer() {
  const { org } = useOrgStore()

  const [filter, setFilter] = useState({
    search: '',
    page: 1,
    per_page: 20,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['loyalty-accounts', org?.id, filter],
    queryFn: () =>
      loyaltyService.listAccounts({
        search: filter.search || undefined,
        page: filter.page,
        per_page: filter.per_page,
      }),
    enabled: !!org,
    staleTime: 30_000,
  })

  return (
    <LoyaltyAccountsPageView
      accounts={data?.data ?? []}
      meta={data?.meta}
      isLoading={isLoading}
      error={error instanceof Error ? error.message : null}
      filter={filter}
      setFilter={(f) => setFilter((prev) => ({ ...prev, ...f }))}
    />
  )
}
