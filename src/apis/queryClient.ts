import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // 화면으로 돌아오면 다시 조회 (F-05-02 트리거 ④, NFR-11)
      refetchOnWindowFocus: true,
    },
  },
})
