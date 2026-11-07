import { Link, createFileRoute } from '@tanstack/react-router'
import type { Order } from '@/api/contracts/checkout'
import { NETWORK_LABELS } from '@/api/contracts/common'
import type { ApiError } from '@/api/errors'
import { CloseIcon, ThankYouIcon } from '@/components/icons'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'
import { OrderLines } from '@/features/checkout/order-lines'
import { useOrder } from '@/features/orders/use-order'
import { formatEth } from '@/lib/format'

export const Route = createFileRoute('/_auth/pedido/$orderId')({
  head: () => ({ meta: [{ title: 'Pedido | Kurio' }] }),
  component: OrderPage,
})

const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const short = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`

function OrderPage() {
  const { orderId } = Route.useParams()
  const query = useOrder(orderId)

  if (query.isPending) {
    return (
      <main className="py-16" aria-busy="true">
        <Container className="max-w-[578px]">
          <div className="skeleton h-[560px]" />
          <span role="status" className="sr-only">
            Carregando pedido…
          </span>
        </Container>
      </main>
    )
  }

  if (query.isError) {
    const error = query.error as ApiError
    return (
      <main className="py-24">
        <Container className="flex flex-col items-start gap-4" role="alert">
          <h1 className="text-[28px] font-bold">
            {error.code === 'NOT_FOUND' ? 'Pedido não encontrado' : 'Não foi possível carregar o pedido'}
          </h1>
          <p className="text-text-secondary">{error.message}</p>
          {error.code === 'NOT_FOUND' ? (
            <Button asChild>
              <Link to="/">Voltar ao início</Link>
            </Button>
          ) : (
            <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
          )}
        </Container>
      </main>
    )
  }

  const order = query.data
  return (
    <main className="px-4 py-10 md:py-16">
      {order.status === 'pending' && <PendingOrder order={order} />}
      {order.status === 'declined' && <DeclinedOrder order={order} />}
      {order.status === 'confirmed' && <Receipt order={order} />}
    </main>
  )
}

function Card({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <section
      aria-label={label}
      className="relative mx-auto w-full max-w-[578px] overflow-hidden bg-surface-card pb-2.5"
    >
      {children}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-2.5 bg-brand" />
    </section>
  )
}

function PendingOrder({ order }: { order: Order }) {
  return (
    <Card label="Pedido em processamento">
      <div className="flex flex-col items-center gap-5 px-8 py-12 text-center" role="status" aria-live="polite">
        <span
          aria-hidden
          className="size-12 animate-spin rounded-full border-4 border-brand/30 border-t-brand motion-reduce:animate-none"
        />
        <h1 className="text-xl font-bold">Processando seu pagamento</h1>
        <p className="max-w-sm text-sm leading-6 text-text-secondary">
          Aguardando a confirmação na {NETWORK_LABELS[order.network]}. Você pode sair desta página: o pedido continua
          sendo processado e o status aparece aqui quando voltar.
        </p>
        <dl className="grid w-full grid-cols-2 gap-3 text-left text-sm">
          <dt className="text-text-secondary">Pedido</dt>
          <dd className="text-right font-mono">{order.id}</dd>
          <dt className="text-text-secondary">Total</dt>
          <dd className="text-right font-bold text-brand-accent">{formatEth(order.summary.totalEth)}</dd>
        </dl>
      </div>
    </Card>
  )
}

function DeclinedOrder({ order }: { order: Order }) {
  return (
    <Card label="Pagamento recusado">
      <div className="flex flex-col items-center gap-5 px-8 py-12 text-center" role="alert">
        <span
          aria-hidden
          className="grid size-12 place-items-center rounded-full bg-coral/15 text-2xl font-bold text-coral"
        >
          !
        </span>
        <h1 className="text-xl font-bold">Pagamento recusado</h1>
        <p className="max-w-sm text-sm leading-6 text-text-secondary">
          {order.declineReason} Seus itens continuam no carrinho.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/pagamento">Tentar novamente</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/carrinho">Voltar ao carrinho</Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}

/** Recibo (frame "Confirmação de pedido"): reproduz o snapshot gravado no pedido. */
function Receipt({ order }: { order: Order }) {
  return (
    <Card label="Recibo do pedido">
      <Link
        to="/"
        aria-label="Fechar e voltar ao início"
        className="absolute top-4 right-4 grid size-8 place-items-center rounded-sm hover:bg-surface-raised"
      >
        <CloseIcon aria-hidden />
      </Link>
      <header className="flex flex-col items-center gap-5 px-6 pt-6 pb-5">
        <ThankYouIcon aria-hidden />
        <h1 className="text-center text-[15px] leading-5 font-bold text-text-secondary">
          Seus NFTs agora estão na sua carteira
        </h1>
      </header>
      <dl className="grid grid-cols-2 gap-y-3 border-y border-brand px-6 py-4 text-sm leading-5 sm:grid-cols-4 sm:divide-x sm:divide-brand">
        <div className="flex flex-col sm:px-3 sm:first:pl-0">
          <dt className="font-bold text-text-secondary">ID da transação</dt>
          <dd title={order.txHash ?? undefined}>{order.txHash ? short(order.txHash) : '—'}</dd>
        </div>
        <div className="flex flex-col sm:px-3">
          <dt className="text-text-secondary">Data</dt>
          <dd>
            <time dateTime={order.updatedAt}>{dateFormat.format(new Date(order.updatedAt))}</time>
          </dd>
        </div>
        <div className="flex flex-col sm:px-3">
          <dt className="text-text-secondary">Total</dt>
          <dd>{formatEth(order.summary.totalEth)}</dd>
        </div>
        <div className="flex flex-col sm:px-3">
          <dt className="font-bold text-text-secondary">Carteira</dt>
          <dd>{order.wallet.label}</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-3 px-6 pt-6 pb-8 sm:px-11">
        <h2 className="text-[15px] font-bold">Detalhes da transação</h2>
        <div aria-hidden className="flex justify-between border-b border-brand/40 pb-3 text-[15px] font-bold">
          <span>NFTs</span>
          <span>Edições · Subtotal</span>
        </div>
        <OrderLines compact lines={order.items.map((item) => ({ ...item, key: `${item.nftId}-${item.editionId}` }))} />
        <dl className="mt-3 flex flex-col gap-2 border-b border-brand/40 pb-3 text-[15px]">
          {order.couponCode && (
            <div className="flex justify-between">
              <dt>Desconto ({order.couponCode})</dt>
              <dd>(-) {formatEth(order.summary.discountEth)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Taxa de rede</dt>
            <dd className="text-lg leading-4">{formatEth(order.summary.networkFeeEth)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-bold">Total</dt>
            <dd className="text-lg leading-4 font-bold text-brand-accent">{formatEth(order.summary.totalEth)}</dd>
          </div>
        </dl>
        <p className="text-center text-sm leading-[22px] text-text-secondary">
          Transação confirmada na {NETWORK_LABELS[order.network]}. A propriedade foi transferida para sua carteira
          conectada e registrada na rede.
        </p>
        {order.explorerUrl && (
          <Button asChild size="lg" className="mx-auto mt-2 w-fit">
            <a href={order.explorerUrl} target="_blank" rel="noopener noreferrer">
              Ver no explorador <span className="sr-only">(link simulado, abre em nova aba)</span>
            </a>
          </Button>
        )}
        <p className="text-center text-xs text-tan">Pedido {order.id} · referência e link de explorador simulados.</p>
      </div>
    </Card>
  )
}
