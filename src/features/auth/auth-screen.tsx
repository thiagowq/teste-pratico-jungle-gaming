import { useNavigate } from '@tanstack/react-router'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { CloseIcon } from '@/components/icons'
import { Container } from '@/components/layout/container'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { CatalogSection } from '@/features/catalog/components/catalog-section'
import { Hero } from '@/features/home/hero'
import { DESKTOP_QUERY, useMediaQuery } from '@/lib/use-media-query'
import { AuthPanel, type AuthMode } from './auth-panel'
import { safeRedirect } from './safe-redirect'

const noop = () => {}

/**
 * Login e cadastro. Desktop: diálogo sobre uma prévia da tela inicial (como no
 * Figma), com foco preso no diálogo e fundo inerte. Mobile: página própria.
 */
export function AuthScreen({ mode, redirect }: { mode: AuthMode; redirect?: string }) {
  const navigate = useNavigate()
  const close = () => void navigate({ href: safeRedirect(redirect) })
  // Só uma versão do formulário existe por vez: evita IDs duplicados e foco em campo oculto.
  const isDesktop = useMediaQuery(DESKTOP_QUERY)

  if (!isDesktop) {
    return (
      <main className="px-7 pt-20 pb-6">
        <p aria-hidden className="py-12 text-center text-[32px] leading-[42px] font-bold tracking-[0.1em]">
          KURIO
        </p>
        <AuthPanel mode={mode} redirect={redirect} variant="page" />
      </main>
    )
  }

  return (
    <>
      <div inert aria-hidden>
        <main className="flex flex-col gap-24 pt-8">
          <Container>
            <Hero />
          </Container>
          <Container>
            <CatalogSection params={{}} onChange={noop} />
          </Container>
        </main>
      </div>

      <div>
        <Dialog open onOpenChange={(open) => !open && close()}>
          <DialogContent
            showCloseButton={false}
            className="max-h-[92dvh] overflow-y-auto rounded-lg border-none bg-surface-card p-0 shadow-overlay sm:max-w-[500px]"
          >
            <DialogTitle className="sr-only">{mode === 'login' ? 'Entrar' : 'Criar conta'}</DialogTitle>
            <DialogDescription className="sr-only">
              {mode === 'login' ? 'Entre com e-mail e senha.' : 'Crie sua conta de colecionador.'}
            </DialogDescription>
            <AuthPanel mode={mode} redirect={redirect} variant="dialog" />
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-2.5 bg-brand" />
            <DialogPrimitive.Close
              aria-label="Fechar"
              className="absolute top-3 right-3 grid size-8 place-items-center rounded-sm hover:bg-surface-raised"
            >
              <CloseIcon aria-hidden />
            </DialogPrimitive.Close>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
