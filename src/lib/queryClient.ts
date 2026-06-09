import { QueryClient } from '@tanstack/react-query'
import { getErrorMessage } from './axios'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,       // 2 min
      gcTime:    1000 * 60 * 10,      // 10 min
      retry:     (failureCount, error) => {
        const msg = getErrorMessage(error)
        if (msg.includes('401') || msg.includes('403')) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})
