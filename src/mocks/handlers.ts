import type { RequestHandler, WebSocketHandler } from 'msw'
import { authHandlers } from './handlers/auth'
import { cartHandlers } from './handlers/cart'
import { checkoutHandlers } from './handlers/checkout'
import { walletHandlers } from './handlers/wallets'
import { catalogHandlers } from './handlers/catalog'
import { favoritesHandlers } from './handlers/favorites'
import { realtimeHandlers, setSocketUserResolver } from './handlers/realtime'
import { lookupSession } from './lib/auth'

// Eventos privados só chegam ao socket cujo token pertence a uma sessão válida do usuário.
setSocketUserResolver((token) => {
  const session = lookupSession(token)
  return session.ok ? session.user.id : null
})

export const handlers: Array<RequestHandler | WebSocketHandler> = [
  ...authHandlers,
  ...catalogHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...walletHandlers,
  ...checkoutHandlers,
  ...realtimeHandlers,
]
