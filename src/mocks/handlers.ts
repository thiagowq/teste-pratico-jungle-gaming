import type { RequestHandler, WebSocketHandler } from 'msw'

// Handlers REST e Socket.IO são adicionados por recurso em src/mocks/handlers/*.
export const handlers: Array<RequestHandler | WebSocketHandler> = []
