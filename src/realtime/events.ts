/**
 * Contrato dos eventos Socket.IO. Todo evento carrega identidade estável (`id`),
 * o recurso afetado e a versão desse recurso após a mudança. O cliente usa
 * `id` para descartar duplicatas e `version` para descartar eventos antigos.
 */
export interface RealtimeEnvelope<TType extends string, TResource extends string, TData> {
  id: string
  type: TType
  resource: { type: TResource; id: string }
  version: number
  occurredAt: string
  data: TData
}

export interface NftUpdatedData {
  editions: Array<{ id: string; priceEth: string; available: number }>
}

export type OrderStatus = 'pending' | 'confirmed' | 'declined'

export interface OrderUpdatedData {
  status: OrderStatus
  txHash?: string
  reason?: string
}

export type NftUpdatedEvent = RealtimeEnvelope<'nft.updated', 'nft', NftUpdatedData>
export type OrderUpdatedEvent = RealtimeEnvelope<'order.updated', 'order', OrderUpdatedData>

export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent
export type RealtimeEventType = RealtimeEvent['type']
export type RealtimeEventOf<T extends RealtimeEventType> = Extract<RealtimeEvent, { type: T }>

export const REALTIME_EVENT_TYPES: readonly RealtimeEventType[] = ['nft.updated', 'order.updated']

export function resourceKey(resource: { type: string; id: string }) {
  return `${resource.type}:${resource.id}`
}
