import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/realtime/events'
import type { NftRecord } from '../fixtures/nfts'
import type { OrderRecord } from '../db'
import { randomToken } from './auth'
import { publish } from './event-bus'

/** Evento público de preço/disponibilidade. A versão é a do registro após a mudança. */
export function publishNftUpdated(record: NftRecord) {
  const event: NftUpdatedEvent = {
    id: randomToken('evt'),
    type: 'nft.updated',
    resource: { type: 'nft', id: record.id },
    version: record.version,
    occurredAt: new Date().toISOString(),
    data: {
      editions: record.editions.map((edition) => ({
        id: edition.id,
        priceEth: edition.priceEth,
        available: edition.available,
      })),
    },
  }
  publish({ event, userId: null })
  return event
}

/** Evento privado de pedido: só chega aos sockets do dono. */
export function publishOrderUpdated(order: OrderRecord) {
  const event: OrderUpdatedEvent = {
    id: randomToken('evt'),
    type: 'order.updated',
    resource: { type: 'order', id: order.id },
    version: order.version,
    occurredAt: order.updatedAt,
    data: { status: order.status, txHash: order.txHash ?? undefined, reason: order.declineReason ?? undefined },
  }
  publish({ event, userId: order.userId })
  return event
}
