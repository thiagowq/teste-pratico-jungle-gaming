import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { Cart } from '@/api/contracts/cart'
import type { ApiError } from '@/api/errors'
import { ArrowLeft2Icon } from '@/components/icons'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'
import { CartItemCard, CartItemRow } from '@/features/cart/cart-item'
import { CouponForm, SummaryLines } from '@/features/cart/cart-summary'
import { useAcceptCartChanges, useCart } from '@/features/cart/use-cart'
import { NftCarousel } from '@/features/catalog/components/nft-carousel'
import { nftListQuery } from '@/features/catalog/queries'
import { DESKTOP_QUERY, useMediaQuery } from '@/lib/use-media-query'

export const Route = createFileRoute('/carrinho')({
  head: () => ({ meta: [{ title: 'Carrinho | Kurio' }] }),
  component: CartPage,
})

/** Situação do carrinho para finalizar: itens com alteração pendente bloqueiam o checkout. */
function checkoutState(cart: Cart | undefined) {
  if (!cart || cart.items.length === 0) return { canCheckout: false, reason: null, needsAcceptance: false }
  const issues = cart.items.flatMap((item) => item.issues)
  if (issues.some((issue) => issue.type === 'sold-out')) {
    return { canCheckout: false, reason: 'Remova os itens esgotados para continuar.', needsAcceptance: false }
  }
  if (issues.length > 0) {
    return {
      canCheckout: false,
      reason: 'Preço ou disponibilidade mudaram. Confirme as alterações para continuar.',
      needsAcceptance: true,
    }
  }
  return { canCheckout: true, reason: null, needsAcceptance: false }
}

function ChangesNotice({ cart }: { cart: Cart }) {
  const accept = useAcceptCartChanges()
  const state = checkoutState(cart)
  if (!state.reason) return null
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber/60 bg-amber/10 p-4 text-sm"
    >
      <p className="text-amber">{state.reason}</p>
      {state.needsAcceptance && (
        <Button
          size="sm"
          onClick={() =>
            accept.mutate(undefined, {
              onSuccess: () => toast.success('Carrinho atualizado com os valores atuais.'),
              onError: (error) => toast.error((error as ApiError).message),
            })
          }
          aria-busy={accept.isPending}
          disabled={accept.isPending}
        >
          Confirmar alterações
        </Button>
      )}
    </div>
  )
}

function useRelated(cart: Cart | undefined) {
  const { data } = useQuery(nftListQuery({ sort: 'rating' }))
  const inCart = new Set(cart?.items.map((item) => item.nftId))
  return (data?.items ?? []).filter((nft) => !inCart.has(nft.id)).slice(0, 5)
}

function CartPage() {
  const cartQuery = useCart()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const navigate = useNavigate()
  const cart = cartQuery.data
  const related = useRelated(cart)
  const state = checkoutState(cart)
  const goToCheckout = () => void navigate({ to: '/pagamento' })

  let content: React.ReactNode
  if (cartQuery.isPending) {
    content = <CartSkeleton isDesktop={isDesktop} />
  } else if (cartQuery.isError) {
    content = (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-md border border-border bg-surface-card p-6">
        <p className="font-bold">Não foi possível carregar o carrinho</p>
        <p className="text-sm text-text-secondary">{(cartQuery.error as ApiError).message}</p>
        <Button onClick={() => void cartQuery.refetch()}>Tentar novamente</Button>
      </div>
    )
  } else if (!cart || cart.items.length === 0) {
    content = (
      <div className="flex flex-col items-center gap-4 rounded-md border border-border bg-surface-card px-6 py-16 text-center">
        <p className="text-lg font-bold">Seu carrinho está vazio</p>
        <p className="max-w-sm text-sm text-text-secondary">Explore o mercado e adicione edições para colecionar.</p>
        <Button asChild>
          <Link to="/" hash="mercado">
            Explorar NFTs
          </Link>
        </Button>
      </div>
    )
  } else if (isDesktop) {
    content = (
      <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
        <section aria-labelledby="cart-items-heading" className="flex w-full flex-col gap-3 lg:max-w-[782px]">
          <h2 id="cart-items-heading" className="sr-only">
            Itens do carrinho
          </h2>
          <div
            aria-hidden
            className="grid grid-cols-[minmax(0,250px)_77px_75px_87px_24px] justify-between gap-4 border-b border-brand/40 pr-6 pb-3 text-base leading-4"
          >
            <span className="font-bold">NFTs</span>
            <span className="text-center font-medium">Preço</span>
            <span className="text-center font-bold">Edições</span>
            <span className="font-medium">Total</span>
            <span />
          </div>
          <ChangesNotice cart={cart} />
          <ul className="flex flex-col gap-3">
            {cart.items.map((item) => (
              <CartItemRow key={`${item.nftId}-${item.editionId}`} item={item} />
            ))}
          </ul>
        </section>
        <aside aria-labelledby="summary-heading" className="flex w-full flex-col gap-6 lg:max-w-[332px]">
          <div className="border-b border-brand/40 pb-3">
            <h2 id="summary-heading" className="text-lg leading-4 font-bold">
              Resumo da carteira
            </h2>
          </div>
          <CouponForm cart={cart} variant="desktop" />
          <SummaryLines cart={cart} />
          <div className="flex flex-col items-center gap-3">
            <Button
              size="block"
              onClick={goToCheckout}
              disabled={!state.canCheckout}
              aria-describedby="checkout-reason"
            >
              Conectar e finalizar
            </Button>
            {state.reason && (
              <p id="checkout-reason" className="text-center text-xs text-amber">
                {state.reason}
              </p>
            )}
            <Link to="/" hash="mercado" className="text-[15px] leading-5 text-brand-accent hover:underline">
              Continuar explorando
            </Link>
          </div>
        </aside>
      </div>
    )
  } else {
    content = (
      <>
        <div className="flex flex-col gap-4">
          <ChangesNotice cart={cart} />
          <ul className="flex flex-col gap-5" aria-label="Itens do carrinho">
            {cart.items.map((item) => (
              <CartItemCard key={`${item.nftId}-${item.editionId}`} item={item} />
            ))}
          </ul>
          <Link to="/" hash="mercado" className="self-center py-2 text-[15px] text-brand-accent">
            Continuar explorando
          </Link>
        </div>
        <section
          aria-label="Resumo da carteira"
          className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-5 rounded-t-[40px] bg-surface-card px-6 pt-6 pb-[max(28px,env(safe-area-inset-bottom))] shadow-overlay"
        >
          <CouponForm cart={cart} variant="mobile" />
          <SummaryLines cart={cart} size="md" />
          <Button variant="pill" size="pill" onClick={goToCheckout} disabled={!state.canCheckout}>
            Conectar e finalizar
          </Button>
        </section>
      </>
    )
  }

  if (!isDesktop) {
    return (
      <main className="px-7 pt-8 pb-[380px]">
        <MobileHeader />
        <div className="mt-3">{content}</div>
      </main>
    )
  }

  return (
    <main className="pt-8">
      <Container>
        <nav aria-label="Trilha de navegação" className="text-[15px] leading-4 font-bold">
          <Link to="/" className="hover:text-brand-accent">
            Início
          </Link>
          <span aria-hidden> / </span>
          <Link to="/" hash="mercado" className="hover:text-brand-accent">
            Mercado
          </Link>
          <span aria-hidden> / </span>
          <span aria-current="page">Carrinho</span>
        </nav>
        <h1 className="sr-only">Carrinho de NFTs</h1>
        <div className="mt-3">{content}</div>
        <div className="mt-24">
          <NftCarousel title="Colecionadores também viram" items={related} headingId="also-viewed" />
        </div>
      </Container>
    </main>
  )
}

function MobileHeader() {
  const router = useRouter()
  return (
    <div className="relative flex h-11 items-start justify-center">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? router.history.back() : void router.navigate({ to: '/' }))}
        aria-label="Voltar"
        className="absolute left-0 grid size-[35px] place-items-center rounded-full border border-border bg-surface-raised"
      >
        <ArrowLeft2Icon aria-hidden className="size-5" />
      </button>
      <h1 className="pt-2 text-xl leading-4 font-bold">Carrinho de NFTs</h1>
    </div>
  )
}

function CartSkeleton({ isDesktop }: { isDesktop: boolean }) {
  return (
    <div aria-busy="true" aria-label="Carregando carrinho">
      <span role="status" className="sr-only">
        Carregando carrinho…
      </span>
      {isDesktop ? (
        <div className="flex justify-between gap-8">
          <div className="flex w-full max-w-[782px] flex-col gap-3">
            <div className="skeleton h-7" />
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="skeleton h-[70px]" />
            ))}
          </div>
          <div className="flex w-[332px] flex-col gap-6">
            <div className="skeleton h-7" />
            <div className="skeleton h-16" />
            <div className="skeleton h-28" />
            <div className="skeleton h-10" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="skeleton h-[100px] rounded-[14px]" />
          ))}
        </div>
      )}
    </div>
  )
}
