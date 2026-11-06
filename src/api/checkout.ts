import { api } from './client'
import { order, ordersResponse, quote, type CreateOrderRequest } from './contracts/checkout'
import type { Network } from './contracts/common'
import { parseResponse } from './parse'

/** Cotação: congela itens, cupom e taxas da rede escolhida por alguns minutos. */
export async function createQuote(network: Network) {
  const { data } = await api.post('/checkout/quote', { network })
  return parseResponse(quote, data)
}

/**
 * Cria o pedido. A mesma `idempotencyKey` recupera o mesmo pedido em
 * reenvios (clique repetido, timeout); com outro conteúdo, o servidor responde 409.
 */
export async function createOrder(body: CreateOrderRequest, idempotencyKey: string) {
  const { data } = await api.post('/orders', body, {
    headers: { 'Idempotency-Key': idempotencyKey },
    timeout: 8_000,
  })
  return parseResponse(order, data)
}

export async function fetchOrder(id: string, signal?: AbortSignal) {
  const { data } = await api.get(`/orders/${encodeURIComponent(id)}`, { signal })
  return parseResponse(order, data)
}

export async function fetchPendingOrders(signal?: AbortSignal) {
  const { data } = await api.get('/orders', { params: { status: 'pending' }, signal })
  return parseResponse(ordersResponse, data)
}
