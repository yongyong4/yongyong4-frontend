import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import { startDemoClock } from '@/apis/demoClock'
import { queryClient } from '@/apis/queryClient'
import { router } from '@/routes/router'
import './index.css'

// 시연 모드(VITE_DEMO_MODE=true)면 BE 가상 시계를 따라감. 아니면 아무것도 안 함
startDemoClock()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
