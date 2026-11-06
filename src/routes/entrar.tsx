import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { getSessionToken } from '@/api/session-token'
import { AuthScreen } from '@/features/auth/auth-screen'
import { safeRedirect } from '@/features/auth/safe-redirect'

export const Route = createFileRoute('/entrar')({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  // Quem já está autenticado segue direto para o destino.
  beforeLoad: ({ search }) => {
    if (getSessionToken()) throw redirect({ href: safeRedirect(search.redirect) })
  },
  head: () => ({ meta: [{ title: 'Entrar | Kurio' }] }),
  component: function AuthRoute() {
    const { redirect: target } = Route.useSearch()
    return <AuthScreen mode="login" redirect={target} />
  },
})
