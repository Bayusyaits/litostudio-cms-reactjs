import { useNavigate } from 'react-router-dom'
import { StoriesPageView } from './StoriesPageView'
import { useStories } from './hooks/useStories'

export default function StoriesPageContainer() {
  const navigate = useNavigate()
  const {
    stories, meta, isLoading,
    filter, setFilter,
    deleteMutation,
  } = useStories()

  return (
    <StoriesPageView
      stories={stories}
      isLoading={isLoading}
      search={filter.search}
      onSearch={(search) => setFilter({ ...filter, search, page: 1 })}
      page={filter.page}
      totalPages={meta?.totalPages ?? 1}
      onPage={(page) => setFilter({ ...filter, page })}
      onEdit={(id) => navigate(`/stories/${id}/edit`)}
      onOpenEditor={(id) => navigate(`/stories/${id}/edit`)}
      onDelete={(id) => deleteMutation.mutate(id)}
      statusCounts={undefined}
    />
  )
}
