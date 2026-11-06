import { HttpResponse, delay, http } from 'msw'
import {
  createOrderRequest,
  order as orderSchema,
  quoteRequest,
  type Order,
  type Quote,
} from '@/api/contracts/checkout'
import type { Network } from '@/api/contracts/common'
import { WALLET_TYPE_LABELS } from '@/api/contracts/wallets'
import { db, type MockDatabase, type OrderRecord } from '../db'
import { randomToken, requireSession } from '../lib/auth'
import { publishNftUpdated, publishOrderUpdated } from '../lib/events'
import { computeSummary } from '../lib/pricing'
import { apiError, withNetwork } from '../lib/respond'
import { getScenario, hasFlag, updateScenario } from '../lib/scenario'
import { fieldErrorsFrom, readJson } from '../lib/validation'
import { buildCart } from './cart'

const API = '/api'
const QUOTE_TTL_MS = 5 * 60_000
/** Tempo até a "rede" confirmar ou recusar o pagamento. */
const PROCESSING_MS = 4_000

const EXPLORERS: Record<Network, string> = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  solana: 'https://solscan.io/tx/',
}

function hex(length: number) {
  return [...crypto.getRandomValues(new Uint8Array(length / 2))]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/** Monta uma cotação a partir do carrinho atual, ou explica por que não é possível. */
function buildQuote(state: MockDatabase, userId: string, network: Network) {
  const cart = buildCart(state, `user:${userId}`)
  if (cart.items.length === 0) {
    return { ok: false as const, response: apiError(422, 'VALIDATION_ERROR', 'Seu carrinho está vazio.') }
  }
  const unavailable = cart.items.filter((item) =>
    item.issues.some((issue) => issue.type === 'sold-out' || issue.type === 'insufficient-stock'),
  )
  if (unavailable.length > 0) {
    return {
      ok: false as const,
      response: apiError(
        409,
        'OUT_OF_STOCK',
        `Disponibilidade insuficiente para ${unavailable.map((item) => item.name).join(', ')}. Revise o carrinho.`,
        {
          details: { nftIds: unavailable.map((item) => item.nftId) },
        },
      ),
    }
  }
  const { summary } = computeSummary(cart.subtotalEth, state.cartCoupons[`user:${userId}`] ?? null, network)
  const quote: Quote = {
    id: randomToken('quote'),
    network,
    items: cart.items.map((item) => ({
      nftId: item.nftId,
      editionId: item.editionId,
      name: item.name,
      tokenId: item.tokenId,
      artwork: item.artwork,
      editionLabel: item.editionLabel,
      quantity: item.quantity,
      unitPriceEth: item.unitPriceEth,
      lineTotalEth: item.lineTotalEth,
    })),
    couponCode: cart.coupon?.status === 'applied' ? cart.coupon.code : null,
    summary,
    expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
  }
  return { ok: true as const, quote }
}

/** A cotação ainda corresponde ao estado atual (itens, preços, cupom e taxa)? */
function sameTerms(previous: Quote, current: Quote) {
  const key = (quote: Quote) =>
    JSON.stringify({
      items: quote.items.map(({ nftId, editionId, quantity, unitPriceEth }) => ({
        nftId,
        editionId,
        quantity,
        unitPriceEth,
      })),
      couponCode: quote.couponCode,
      summary: quote.summary,
    })
  return key(previous) === key(current)
}

/** Serialização com chaves ordenadas em todos os níveis: o mesmo conteúdo gera sempre o mesmo texto. */
function stableHash(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableHash).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableHash(item)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

/** Remove do registro os campos internos da simulação. */
function toPublic(record: OrderRecord): Order {
  return orderSchema.parse(record)
}

/**
 * Liquida pedidos pendentes cujo prazo passou. Chamado periodicamente e em
 * toda leitura de pedido, então o resultado sobrevive a refresh da página.
 */
export function settleDueOrders(now = Date.now()) {
  const due = Object.values(db.get().orders).filter(
    (order) => order.status === 'pending' && Date.parse(order.processAt) <= now,
  )
  for (const pending of due) {
    let settled: OrderRecord | undefined
    const touched: string[] = []
    db.update((draft) => {
      const order = draft.orders[pending.id]
      if (!order || order.status !== 'pending') return
      order.version += 1
      order.updatedAt = new Date().toISOString()
      if (order.willDecline) {
        order.status = 'declined'
        order.declineReason = 'O pagamento foi recusado pela carteira. Nenhum valor foi cobrado.'
        // Devolve o estoque reservado.
        for (const line of order.items) {
          const nft = draft.nfts[line.nftId]
          const edition = nft?.editions.find((candidate) => candidate.id === line.editionId)
          if (nft && edition) {
            edition.available += line.quantity
            nft.version += 1
            touched.push(nft.id)
          }
        }
      } else {
        order.status = 'confirmed'
        order.txHash = `0x${hex(64)}`
        order.explorerUrl = `${EXPLORERS[order.network]}${order.txHash}`
        // Remove do carrinho apenas o que foi comprado, na quantidade comprada.
        const lines = draft.carts[`user:${order.userId}`] ?? []
        for (const purchased of order.items) {
          const line = lines.find(
            (candidate) => candidate.nftId === purchased.nftId && candidate.editionId === purchased.editionId,
          )
          if (line) line.quantity -= purchased.quantity
        }
        draft.carts[`user:${order.userId}`] = lines.filter((line) => line.quantity > 0)
        if (order.couponCode) delete draft.cartCoupons[`user:${order.userId}`]
      }
      settled = order
    })
    if (settled) publishOrderUpdated(settled)
    for (const id of touched) publishNftUpdated(db.get().nfts[id])
  }
}

if (typeof window !== 'undefined') window.setInterval(() => settleDueOrders(), 1_000)

export const checkoutHandlers = [
  http.post(
    `${API}/checkout/quote`,
    withNetwork('POST /checkout/quote', async ({ request }) => {
      const session = requireSession(request)
      if (!session.ok) return session.response
      const parsed = quoteRequest.safeParse(await readJson(request))
      if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Rede inválida.')
      const result = buildQuote(db.get(), session.user.id, parsed.data.network)
      if (!result.ok) return result.response
      db.update((draft) => {
        draft.quotes[result.quote.id] = { ...result.quote, userId: session.user.id }
      })
      return HttpResponse.json(result.quote, { status: 201 })
    }),
  ),

  http.post(
    `${API}/orders`,
    withNetwork('POST /orders', async ({ request }) => {
      const session = requireSession(request)
      if (!session.ok) return session.response
      const userId = session.user.id
      const key = request.headers.get('Idempotency-Key')
      if (!key || key.length < 8) return apiError(400, 'VALIDATION_ERROR', 'Cabeçalho Idempotency-Key obrigatório.')

      const body = await readJson(request)
      const parsed = createOrderRequest.safeParse(body)
      if (!parsed.success) {
        return apiError(422, 'VALIDATION_ERROR', 'Revise os dados do pedido.', {
          fieldErrors: Object.fromEntries(
            Object.entries(fieldErrorsFrom(parsed.error)).map(([field, message]) => [
              field.replace(/^buyer\./, ''),
              message,
            ]),
          ),
        })
      }
      const payloadHash = stableHash(parsed.data)
      const state = db.get()

      // 1. Idempotência: a mesma tentativa recupera o mesmo pedido.
      const previous = state.idempotency[`${userId}:${key}`]
      if (previous) {
        if (previous.payloadHash !== payloadHash) {
          return apiError(409, 'IDEMPOTENCY_CONFLICT', 'Esta tentativa de compra já foi usada com outros dados.')
        }
        settleDueOrders()
        return HttpResponse.json(toPublic(db.get().orders[previous.orderId]), {
          status: 200,
          headers: { 'Idempotent-Replay': 'true' },
        })
      }

      // 2. Cotação válida e do próprio usuário.
      const quote = state.quotes[parsed.data.quoteId]
      if (!quote || quote.userId !== userId) return apiError(404, 'NOT_FOUND', 'Cotação inexistente. Revise o pedido.')
      if (Date.parse(quote.expiresAt) <= Date.now()) {
        return apiError(409, 'QUOTE_EXPIRED', 'A cotação expirou. Revise os valores e confirme novamente.')
      }

      // 3. Conexão de carteira ativa.
      const connection = state.walletConnections[parsed.data.connectionId]
      if (!connection || connection.userId !== userId || Date.parse(connection.expiresAt) <= Date.now()) {
        return apiError(409, 'CONFLICT', 'A carteira foi desconectada. Conecte-a novamente para pagar.', {
          details: { reason: 'wallet-disconnected' },
        })
      }

      // 4. Revalida preço, disponibilidade, cupom e taxas contra o estado atual.
      const current = buildQuote(state, userId, quote.network)
      if (!current.ok) return current.response
      if (!sameTerms(quote, current.quote)) {
        db.update((draft) => {
          draft.quotes[current.quote.id] = { ...current.quote, userId }
        })
        return apiError(
          409,
          'PRICE_CHANGED',
          'Os valores mudaram desde a revisão. Confira a nova cotação e confirme novamente.',
          {
            details: { quote: current.quote },
          },
        )
      }

      // 5. Cria o pedido pendente, reserva o estoque e agenda a liquidação.
      const now = new Date()
      const order: OrderRecord = {
        id: `ord_${hex(12)}`,
        status: 'pending',
        version: 1,
        network: quote.network,
        wallet: {
          provider: connection.provider,
          address: connection.address,
          label: WALLET_TYPE_LABELS[connection.provider],
        },
        items: quote.items,
        couponCode: quote.couponCode,
        summary: quote.summary,
        txHash: null,
        explorerUrl: null,
        declineReason: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        userId,
        processAt: new Date(
          now.getTime() + (getScenario().network === 'instant' ? 1_500 : PROCESSING_MS),
        ).toISOString(),
        willDecline: hasFlag('paymentDeclined'),
      }
      const touched: string[] = []
      db.update((draft) => {
        draft.orders[order.id] = order
        draft.idempotency[`${userId}:${key}`] = { orderId: order.id, payloadHash }
        delete draft.quotes[quote.id]
        for (const line of order.items) {
          const nft = draft.nfts[line.nftId]
          const edition = nft?.editions.find((candidate) => candidate.id === line.editionId)
          if (nft && edition) {
            edition.available -= line.quantity
            nft.version += 1
            touched.push(nft.id)
          }
        }
      })
      for (const id of touched) publishNftUpdated(db.get().nfts[id])

      // Cenário "timeout após criação": o pedido existe, mas a resposta não chega.
      if (hasFlag('orderTimeout')) {
        updateScenario({ flags: { ...getScenario().flags, orderTimeout: false } })
        await delay('infinite')
      }
      return HttpResponse.json(toPublic(order), { status: 201 })
    }),
  ),

  http.get(
    `${API}/orders`,
    withNetwork('GET /orders', ({ request }) => {
      const session = requireSession(request)
      if (!session.ok) return session.response
      settleDueOrders()
      const status = new URL(request.url).searchParams.get('status')
      const items = Object.values(db.get().orders)
        .filter((order) => order.userId === session.user.id && (!status || order.status === status))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(toPublic)
      return HttpResponse.json({ items })
    }),
  ),

  http.get<{ id: string }>(
    `${API}/orders/:id`,
    withNetwork('GET /orders/:id', ({ request, params }) => {
      const session = requireSession(request)
      if (!session.ok) return session.response
      settleDueOrders()
      const order = db.get().orders[params.id]
      // Pedido de outro usuário responde como inexistente (não revela que existe).
      if (!order || order.userId !== session.user.id) return apiError(404, 'NOT_FOUND', 'Pedido não encontrado.')
      return HttpResponse.json(toPublic(order))
    }),
  ),
]
