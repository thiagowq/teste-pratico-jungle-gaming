import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import type { Cart } from '@/api/contracts/cart'
import type { Wallet, WalletSlot, WalletsResponse } from '@/api/contracts/wallets'
import { NETWORK_LABELS } from '@/api/contracts/common'
import { ArrowLeft2Icon } from '@/components/icons'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'
import { CouponForm, SummaryLines } from '@/features/cart/cart-summary'
import { useCart } from '@/features/cart/use-cart'
import { BuyerFields, NoteField } from '@/features/checkout/buyer-fields'
import { OrderLines } from '@/features/checkout/order-lines'
import { ReviewDialog } from '@/features/checkout/review-dialog'
import { useCheckout } from '@/features/checkout/use-checkout'
import { WalletProviders } from '@/features/checkout/wallet-providers'
import { usePendingOrder } from '@/features/orders/use-order'
import { useWallets } from '@/features/wallets/use-wallets'
import { formatEth } from '@/lib/format'
import { DESKTOP_QUERY, useMediaQuery } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_auth/pagamento')({
  head: () => ({ meta: [{ title: 'Pagamento | Kurio' }] }),
  component: CheckoutPage,
})

function PendingOrderNotice() {
  const { data: pending } = usePendingOrder()
  if (!pending) return null
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber/60 bg-amber/10 p-4 text-sm"
    >
      <span className="text-amber">Você tem um pedido em processamento ({formatEth(pending.summary.totalEth)}).</span>
      <Link to="/pedido/$orderId" params={{ orderId: pending.id }} className="font-bold text-brand-accent underline">
        Acompanhar pedido
      </Link>
    </div>
  )
}

function CheckoutPage() {
  const cartQuery = useCart()
  const walletsQuery = useWallets()
  const cart = cartQuery.data

  if (cartQuery.isPending || walletsQuery.isPending) {
    return (
      <main aria-busy="true" className="pt-8">
        <Container className="flex flex-col gap-6 lg:flex-row">
          <div className="skeleton h-[560px] flex-1" />
          <div className="skeleton h-[560px] lg:w-[405px]" />
        </Container>
        <span role="status" className="sr-only">
          Carregando pagamento…
        </span>
      </main>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="py-24">
        <Container className="flex flex-col items-start gap-4">
          <PendingOrderNotice />
          <h1 className="text-[28px] font-bold">Seu carrinho está vazio</h1>
          <p className="text-text-secondary">Adicione NFTs ao carrinho para finalizar uma compra.</p>
          <Button asChild>
            <Link to="/" hash="mercado">
              Explorar NFTs
            </Link>
          </Button>
        </Container>
      </main>
    )
  }

  if (walletsQuery.isError || !walletsQuery.data) {
    return (
      <main className="py-24">
        <Container className="flex flex-col items-start gap-4" role="alert">
          <h1 className="text-[28px] font-bold">Não foi possível carregar suas carteiras</h1>
          <Button onClick={() => void walletsQuery.refetch()}>Tentar novamente</Button>
        </Container>
      </main>
    )
  }

  return <CheckoutForm cart={cart} wallets={walletsQuery.data} />
}

/** Montado só com carrinho e carteiras carregados: o formulário já nasce preenchido. */
function CheckoutForm({ cart, wallets }: { cart: Cart; wallets: WalletsResponse }) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const checkout = useCheckout(wallets)
  const [showCoupon, setShowCoupon] = useState(false)
  const lockWallet = checkout.slot !== 'manual'
  const hasSecondary = Boolean(wallets.secondary)
  const review = (
    <ReviewDialog
      quote={checkout.quote}
      connection={checkout.connection.status === 'connected' ? checkout.connection.connection : null}
      notice={checkout.reviewNotice}
      submitting={checkout.isSubmitting}
      submitStatus={checkout.submitStatus}
      onConfirm={checkout.confirm}
      onClose={checkout.closeReview}
    />
  )
  const providers = (
    <WalletProviders
      variant={isDesktop ? 'desktop' : 'mobile'}
      provider={checkout.provider}
      connection={checkout.connection}
      connectionMatches={checkout.connectionMatches}
      onConnect={checkout.connect}
      onDisconnect={() => void checkout.disconnect()}
    />
  )
  const confirmLabel = checkout.isQuoting ? 'Calculando valores…' : 'Confirmar compra'

  if (!isDesktop) {
    return (
      <main className="px-7 pt-8 pb-[150px]">
        <MobileHeader />
        <div className="mt-4 flex flex-col gap-6">
          <PendingOrderNotice />
          {wallets.primary ? (
            <section aria-labelledby="mobile-wallets" className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 id="mobile-wallets" className="text-base font-bold">
                  Carteira conectada
                </h2>
                <Link to="/conta/carteiras" className="text-sm font-bold text-brand-accent">
                  Trocar carteira
                </Link>
              </div>
              <div role="radiogroup" aria-label="Carteira de pagamento" className="flex flex-col gap-4">
                {(['secondary', 'primary'] as WalletSlot[])
                  .map((slot) => wallets[slot])
                  .filter((wallet): wallet is Wallet => wallet !== null)
                  .map((wallet) => (
                    <MobileWalletCard
                      key={wallet.slot}
                      wallet={wallet}
                      selected={checkout.slot === wallet.slot}
                      onSelect={() => checkout.chooseSlot(wallet.slot)}
                    />
                  ))}
              </div>
            </section>
          ) : (
            <section aria-labelledby="mobile-buyer" className="flex flex-col gap-3">
              <h2 id="mobile-buyer" className="text-base font-bold">
                Dados da carteira
              </h2>
              <BuyerFields form={checkout.form} lockWallet={false} />
            </section>
          )}
          <section aria-labelledby="mobile-providers" className="flex flex-col gap-3">
            <h2 id="mobile-providers" className="text-base font-bold">
              Carteira e rede
            </h2>
            {providers}
          </section>
          <p className="flex items-center justify-end gap-6 text-lg font-bold">
            Total: <span className="text-xl text-brand-accent">{formatEth(cart.summary.totalEth)}</span>
          </p>
        </div>
        <div className="fixed inset-x-0 bottom-0 z-40 px-7 pb-[max(28px,env(safe-area-inset-bottom))]">
          <Button
            variant="pill"
            size="pill"
            onClick={checkout.review}
            disabled={checkout.isQuoting}
            aria-busy={checkout.isQuoting}
          >
            {confirmLabel}
          </Button>
        </div>
        {review}
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
          <span aria-current="page">Pagamento</span>
        </nav>
        <h1 className="sr-only">Pagamento</h1>
        <div className="mt-8">
          <PendingOrderNotice />
        </div>

        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            checkout.review()
          }}
          className="mt-4 flex flex-col gap-8 lg:flex-row"
        >
          <section aria-labelledby="buyer-heading" className="flex flex-1 flex-col gap-3">
            <h2 id="buyer-heading" className="text-[17px] leading-4 font-bold">
              Perfil do colecionador
            </h2>
            <BuyerFields form={checkout.form} lockWallet={lockWallet} />
            <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-[15px]">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={checkout.slot !== 'primary'}
                onChange={(event) =>
                  checkout.chooseSlot(event.target.checked ? (hasSecondary ? 'secondary' : 'manual') : 'primary')
                }
                disabled={!wallets.primary}
              />
              <span
                aria-hidden
                className="grid size-[15px] place-items-center rounded-full border-2 border-brand peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-brand-accent"
              />
              Usar outra carteira?
              <span className="text-xs text-text-secondary">
                {checkout.slot === 'secondary'
                  ? `(${wallets.secondary?.nickname})`
                  : checkout.slot === 'manual'
                    ? '(preenchimento manual)'
                    : ''}
              </span>
            </label>
            <div className="mt-3">
              <NoteField form={checkout.form} />
            </div>
          </section>

          <aside aria-labelledby="your-nfts" className="flex w-full flex-col gap-3 lg:w-[405px]">
            <h2 id="your-nfts" className="text-[17px] leading-4 font-bold">
              Seus NFTs
            </h2>
            <div aria-hidden className="flex justify-between border-b border-brand/40 pb-3 text-base leading-4">
              <span className="font-bold">NFTs</span>
              <span className="font-medium">Subtotal</span>
            </div>
            <OrderLines lines={cart.items.map((item) => ({ ...item, key: `${item.nftId}-${item.editionId}` }))} />
            <div className="flex flex-col gap-3">
              {showCoupon || cart.coupon ? (
                <CouponForm cart={cart} variant="desktop" />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCoupon(true)}
                  className="text-center text-sm hover:text-brand-accent"
                >
                  Tem um código promocional? <span className="underline">Aplique aqui</span>
                </button>
              )}
              <SummaryLines cart={cart} />
              <p className="text-xs text-text-secondary">
                A taxa final depende da rede escolhida ({NETWORK_LABELS[checkout.form.values.network]}) e aparece na
                revisão.
              </p>
            </div>
            <h2 className="mt-3 text-center text-[17px] leading-4 font-bold">Carteira e rede</h2>
            {providers}
            <Button
              type="submit"
              className={cn('mt-2 h-[45px] w-full rounded-lg text-[15px]')}
              disabled={checkout.isQuoting}
              aria-busy={checkout.isQuoting}
            >
              {confirmLabel}
            </Button>
          </aside>
        </form>
        {review}
      </Container>
    </main>
  )
}

function MobileWalletCard({ wallet, selected, onSelect }: { wallet: Wallet; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex items-start gap-4 rounded-[14px] border bg-surface-card p-4 text-left',
        selected ? 'border-brand' : 'border-transparent',
      )}
    >
      <span
        aria-hidden
        className="mt-1 grid size-[17px] shrink-0 place-items-center rounded-full border-[1.2px] border-brand"
      >
        {selected && <span className="size-2.5 rounded-full bg-brand" />}
      </span>
      <span className="flex min-w-0 flex-col gap-1.5">
        <span className="text-base font-bold">{wallet.nickname}</span>
        <span className="truncate text-sm text-text-secondary">
          {wallet.ensSecondary || `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`}
        </span>
        <span className="text-sm text-text-secondary">
          {wallet.slot === 'primary' ? 'Rede principal ' : 'Rede '}
          {NETWORK_LABELS[wallet.network]}
        </span>
      </span>
    </button>
  )
}

function MobileHeader() {
  const router = useRouter()
  return (
    <div className="flex h-11 items-start gap-4">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? router.history.back() : void router.navigate({ to: '/carrinho' }))}
        aria-label="Voltar"
        className="grid size-[35px] shrink-0 place-items-center rounded-full border border-border bg-surface-raised"
      >
        <ArrowLeft2Icon aria-hidden className="size-5" />
      </button>
      <h1 className="pt-2.5 text-lg leading-4 font-bold min-[380px]:text-xl">Pagamento com carteira</h1>
    </div>
  )
}
