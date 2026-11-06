import type { RealtimeEvent } from '@/realtime/events'

/**
 * Barramento interno dos mocks: handlers REST publicam aqui e o handler
 * Socket.IO repassa aos clientes conectados. Assim a mesma mudança aparece
 * tanto na resposta REST quanto no evento.
 */
export interface Delivery {
  event: RealtimeEvent
  /** `null` = todos os clientes; caso contrário, apenas sockets desse usuário. */
  userId: string | null
}

type Subscriber = (delivery: Delivery) => void
const subscribers = new Set<Subscriber>()

export function publish(delivery: Delivery) {
  subscribers.forEach((subscriber) => subscriber(delivery))
}

export function subscribe(subscriber: Subscriber) {
  subscribers.add(subscriber)
  return () => {
    subscribers.delete(subscriber)
  }
}
