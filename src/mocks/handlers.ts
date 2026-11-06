import type { RequestHandler, WebSocketHandler } from 'msw'
import { realtimeHandlers } from './handlers/realtime'

// Handlers REST são adicionados por recurso em src/mocks/handlers/*.
export const handlers: Array<RequestHandler | WebSocketHandler> = [...realtimeHandlers]
