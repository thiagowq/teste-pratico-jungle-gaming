import type { Socket } from 'socket.io-client'
import { EventGate } from './event-gate'
import { REALTIME_EVENT_TYPES, type RealtimeEvent, type RealtimeEventOf, type RealtimeEventType } from './events'

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting'

type Handler<T extends RealtimeEventType> = (event: RealtimeEventOf<T>) => void

function defaultSocketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}`
}

/**
 * Conexão Socket.IO da sessão atual. Uma conexão por token: trocar de usuário
 * ou sair encerra a anterior, limpa listeners e o histórico de versões, de modo
 * que eventos da sessão antiga nunca alcancem a nova.
 *
 * Usa apenas o transporte WebSocket porque o MSW intercepta WebSocket, não
 * long-polling HTTP (ver ARCHITECTURE.md).
 *
 * O `socket.io-client` é importado sob demanda: fica fora do caminho crítico da
 * primeira renderização e só é avaliado depois que o MSW substituiu o `WebSocket`.
 */
class RealtimeClient {
  private socket: Socket | null = null
  private token: string | null = null
  /** Incrementado a cada conexão/desconexão: descarta um import pendente que ficou obsoleto. */
  private generation = 0
  private active = false
  private status: ConnectionStatus = 'idle'
  private readonly gate = new EventGate()
  private readonly handlers = new Map<RealtimeEventType, Set<(event: RealtimeEvent) => void>>()
  private readonly statusListeners = new Set<(status: ConnectionStatus) => void>()
  private readonly reconnectListeners = new Set<() => void>()

  connect(token: string | null) {
    if (token === this.token && this.active) return
    this.disconnect()
    this.token = token
    this.active = true
    this.setStatus('connecting')
    const generation = ++this.generation
    void import('socket.io-client').then(({ io }) => {
      if (generation === this.generation) this.open(io, token)
    })
  }

  private open(io: typeof import('socket.io-client').io, token: string | null) {
    // Visitantes também recebem eventos públicos (preço/disponibilidade).
    const socket = io(defaultSocketUrl(), {
      path: '/realtime/',
      transports: ['websocket'],
      query: token ? { token } : {},
      reconnectionDelay: 500,
      reconnectionDelayMax: 3_000,
      // Tentativa sem resposta é abandonada em 5 s (o padrão de 20 s atrasaria a retomada).
      timeout: 5_000,
    })
    this.socket = socket

    let hasConnected = false
    socket.on('connect', () => {
      this.setStatus('connected')
      // Após reconexão, os recursos ativos são reconciliados com a API REST.
      if (hasConnected) this.reconnectListeners.forEach((listener) => listener())
      hasConnected = true
    })
    socket.on('disconnect', () => this.setStatus('reconnecting'))
    socket.io.on('reconnect_attempt', () => this.setStatus('reconnecting'))

    for (const type of REALTIME_EVENT_TYPES) {
      socket.on(type, (event: RealtimeEvent) => this.dispatch(event))
    }
  }

  disconnect() {
    this.generation++
    this.active = false
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.io.removeAllListeners()
      this.socket.disconnect()
    }
    this.socket = null
    this.token = null
    this.gate.reset()
    this.setStatus('idle')
  }

  on<T extends RealtimeEventType>(type: T, handler: Handler<T>) {
    const set = this.handlers.get(type) ?? new Set()
    const wrapped = handler as (event: RealtimeEvent) => void
    set.add(wrapped)
    this.handlers.set(type, set)
    return () => {
      set.delete(wrapped)
    }
  }

  onReconnect(listener: () => void) {
    this.reconnectListeners.add(listener)
    return () => {
      this.reconnectListeners.delete(listener)
    }
  }

  onStatus(listener: (status: ConnectionStatus) => void) {
    this.statusListeners.add(listener)
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  getStatus() {
    return this.status
  }

  /** Registra a versão de um recurso vinda do REST. */
  observeVersion(resource: { type: string; id: string }, version: number) {
    this.gate.observe(resource, version)
  }

  private dispatch(event: RealtimeEvent) {
    if (!this.gate.accept(event)) return
    this.handlers.get(event.type)?.forEach((handler) => handler(event))
  }

  private setStatus(status: ConnectionStatus) {
    if (status === this.status) return
    this.status = status
    this.statusListeners.forEach((listener) => listener(status))
  }
}

export const realtime = new RealtimeClient()
