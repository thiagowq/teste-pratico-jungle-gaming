import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { startSessionSync } from '@/features/auth/session'
import { queryClient } from '@/lib/query-client'
import { startRealtimeSync } from '@/realtime/sync'
import { router } from './router'

export function mountApp(element: HTMLElement) {
  // Listeners de eventos antes da conexão: nada que chegue na abertura é perdido.
  startRealtimeSync(queryClient)
  startSessionSync(queryClient)
  createRoot(element).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}
