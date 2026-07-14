import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryService, type CategoryCreateRequest } from '@/services/taxonomy.service'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { getErrorMessage } from '@litostudio/ui-cms'
import { CategoriesPageView } from './CategoriesPageView'

// Search used to be filtered here client-side and passed down as an already-
// filtered `categories` prop + a separate <SearchInput> above the table.
// Since migrating to EnterpriseDataTable (skin="cms"), the table's own
// built-in search box (searchKeys) owns that filtering instead — this
// container now just passes the full, unfiltered list straight through.
export default function CategoriesPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['categories', activeSite?.id],
    queryFn: () => categoryService.getList(activeSite!.id),
    enabled: !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: (payload: CategoryCreateRequest) => categoryService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories', activeSite?.id] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories', activeSite?.id] }),
  })

  return (
    <CategoriesPageView
      categories={data?.data ?? []}
      total={data?.meta?.total ?? 0}
      isLoading={isLoading}
      onCreate={(payload) => {
        if (!activeSite) return
        createMutation.mutate({ ...payload, site_id: activeSite.id })
      }}
      creating={createMutation.isPending}
      createError={createMutation.isError ? getErrorMessage(createMutation.error) : null}
      onDelete={(id) => deleteMutation.mutate(id)}
    />
  )
}
