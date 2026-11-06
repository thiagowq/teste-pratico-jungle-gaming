import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { subscribe } from '../lib/event-bus'

/**
 * Servidor Socket.IO simulado. Intercepta o WebSocket do `socket.io-client`
 * (transporte `websocket`) e repassa eventos publicados no barramento dos mocks.
 *
 * O cliente usa o caminho `/realtime/` (e não o padrão `/socket.io/`): com o
 * MSW 2.15 o padrão de URL não casa conexões em `/socket.io/`, ver ARCHITECTURE.md.
 */
const socketIo = ws.link(/\/realtime\//)

type SocketUserResolver = (token: string | null) => string | null
let resolveUser: SocketUserResolver = () => null

/** Registrado pelo módulo de sessão dos mocks para mapear token → usuário. */
export function setSocketUserResolver(resolver: SocketUserResolver) {
  resolveUser = resolver
}

interface OpenConnection {
  close: () => void
}
const openConnections = new Set<OpenConnection>()

/** Derruba todas as conexões abertas (simula queda de rede no socket). */
export function dropSocketConnections() {
  openConnections.forEach((connection) => connection.close())
}

// O binding não responde ao heartbeat do Engine.IO; sem pings o cliente
// derruba a conexão a cada `pingInterval + pingTimeout`. Enviamos o ping.
const PING_INTERVAL_MS = 20_000

export const realtimeHandlers = [
  socketIo.addEventListener('connection', (connection) => {
    const token = new URL(connection.client.url).searchParams.get('token')
    const io = toSocketIo(connection)

    const ping = window.setInterval(() => connection.client.send('2'), PING_INTERVAL_MS)

    const unsubscribe = subscribe(({ event, userId }) => {
      // Resolvido a cada entrega: sessão encerrada/expirada deixa de receber eventos privados.
      if (userId !== null && resolveUser(token) !== userId) return
      io.client.emit(event.type, event)
    })

    const open: OpenConnection = { close: () => connection.client.close() }
    openConnections.add(open)

    connection.client.addEventListener('close', () => {
      window.clearInterval(ping)
      unsubscribe()
      openConnections.delete(open)
    })
  }),
]
