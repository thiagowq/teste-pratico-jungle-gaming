import { useEffect } from 'react'
import { Outlet, createFileRoute, redirect, useNavigate, useRouterState } from '@tanstack/react-router'
import { getSessionToken } from '@/api/session-token'
import { useSessionToken } from '@/features/auth/session'

/**
 * Layout das áreas privadas (conta, favoritos, pagamento, pedidos).
 * Sem sessão, leva ao login guardando o destino para voltar depois.
 * Se a sessão expirar com a página aberta, faz o mesmo sem perder o contexto.
 */
export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ location }) => {
    if (!getSessionToken()) throw redirect({ to: '/entrar', search: { redirect: location.href } })
  },
  component: ProtectedLayout,
})

function ProtectedLayout() {
  const token = useSessionToken()
  const navigate = useNavigate()
  const href = useRouterState({ select: (state) => state.location.href })

  useEffect(() => {
    if (!token) void navigate({ to: '/entrar', search: { redirect: href }, replace: true })
  }, [token, href, navigate])

  if (!token) return null
  return <Outlet />
}
