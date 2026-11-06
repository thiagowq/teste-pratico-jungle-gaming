import { useEffect } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSessionEndReason } from '@/features/auth/session'
import {
  HeadContent,
  Link,
  Outlet,
  createRootRouteWithContext,
  useRouterState,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { Container } from '@/components/layout/container'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
  errorComponent: RouteError,
})

/** Páginas com a linha divisória sob o cabeçalho, como no Figma. */
function useHeaderDivider() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return pathname === '/' || pathname === '/entrar' || pathname === '/cadastro' || pathname.startsWith('/conta')
}

/** Telas com barra de ação própria no mobile (detalhe, carrinho, pagamento): sem barra inferior e rodapé. */
function useImmersiveMobile() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return /^\/(nft|carrinho|pagamento|entrar|cadastro)/.test(pathname)
}

function RootLayout() {
  const divider = useHeaderDivider()
  const immersive = useImmersiveMobile()
  return (
    <TooltipProvider delayDuration={300}>
      <HeadContent />
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-brand px-4 py-2 font-bold text-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader divider={divider} />
      <div id="conteudo" tabIndex={-1} className="outline-none">
        <Outlet />
      </div>
      <SiteFooter className={immersive ? 'max-md:hidden' : undefined} />
      {!immersive && <MobileTabBar />}
      <Toaster position="top-center" richColors closeButton />
      <SessionExpiredNotice />
    </TooltipProvider>
  )
}

/** Avisa quando a sessão expira em uma página pública (nas privadas, o layout leva ao login). */
function SessionExpiredNotice() {
  const reason = useSessionEndReason()
  useEffect(() => {
    if (reason === 'expired')
      toast.warning('Sua sessão expirou. Entre novamente para acessar sua conta.', { id: 'session-expired' })
  }, [reason])
  return null
}

export function NotFound() {
  return (
    <main className="py-24">
      <Container className="flex flex-col items-start gap-4">
        <p className="text-sm font-bold tracking-[0.1em] text-brand-accent">ERRO 404</p>
        <h1 className="text-[28px] leading-[37px] font-bold">Página não encontrada</h1>
        <p className="max-w-prose text-text-secondary">O endereço acessado não existe ou foi movido.</p>
        <Button asChild>
          <Link to="/">Voltar ao início</Link>
        </Button>
      </Container>
    </main>
  )
}

function RouteError({ error, reset }: ErrorComponentProps) {
  return (
    <main className="py-24">
      <Container className="flex flex-col items-start gap-4" role="alert">
        <h1 className="text-[28px] leading-[37px] font-bold">Algo deu errado</h1>
        <p className="max-w-prose text-text-secondary">
          {(error instanceof Error && error.message) || 'Não foi possível carregar esta página.'}
        </p>
        <Button onClick={reset}>Tentar novamente</Button>
      </Container>
    </main>
  )
}
