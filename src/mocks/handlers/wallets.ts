import { HttpResponse, http } from 'msw'
import { z } from 'zod'
import { connectWalletRequest, walletInput, walletSlot, type WalletsResponse } from '@/api/contracts/wallets'
import { db } from '../db'
import { randomToken, requireSession } from '../lib/auth'
import { apiError, withNetwork } from '../lib/respond'
import { hasFlag } from '../lib/scenario'
import { fieldErrorsFrom, readJson } from '../lib/validation'

const API = '/api'
const CONNECTION_TTL_MS = 30 * 60_000

function walletsOf(userId: string): WalletsResponse {
  return db.get().wallets[userId] ?? { primary: null, secondary: null }
}

export const walletHandlers = [
  http.get(
    `${API}/wallets`,
    withNetwork('GET /wallets', ({ request }) => {
      const session = requireSession(request)
      if (!session.ok) return session.response
      return HttpResponse.json(walletsOf(session.user.id))
    }),
  ),

  http.put<{ slot: string }>(
    `${API}/wallets/:slot`,
    withNetwork('PUT /wallets/:slot', async ({ request, params }) => {
      const session = requireSession(request)
      if (!session.ok) return session.response
      const slot = walletSlot.safeParse(params.slot)
      if (!slot.success) return apiError(404, 'NOT_FOUND', 'Carteira inexistente.')
      const parsed = walletInput.safeParse(await readJson(request))
      if (!parsed.success) {
        return apiError(422, 'VALIDATION_ERROR', 'Revise os campos destacados.', {
          fieldErrors: fieldErrorsFrom(parsed.error),
        })
      }
      const current = walletsOf(session.user.id)
      const other = slot.data === 'primary' ? current.secondary : current.primary
      if (other && other.address.toLowerCase() === parsed.data.address.toLowerCase()) {
        return apiError(409, 'CONFLICT', 'Este endereço já está cadastrado na outra carteira.', {
          fieldErrors: { address: 'Este endereço já está cadastrado na outra carteira.' },
        })
      }
      if (slot.data === 'secondary' && !current.primary) {
        return apiError(409, 'CONFLICT', 'Cadastre a carteira principal antes da secundária.')
      }
      const next = db.update((draft) => {
        const wallets = (draft.wallets[session.user.id] ??= { primary: null, secondary: null })
        wallets[slot.data] = { ...parsed.data, slot: slot.data, updatedAt: new Date().toISOString() }
      })
      return HttpResponse.json(next.wallets[session.user.id])
    }),
  ),

  http.delete<{ slot: string }>(
    `${API}/wallets/:slot`,
    withNetwork('DELETE /wallets/:slot', ({ request, params }) => {
      const session = requireSession(request)
      if (!session.ok) return session.response
      if (params.slot !== 'secondary') {
        return apiError(409, 'CONFLICT', 'A carteira principal não pode ser removida; edite-a.')
      }
      const next = db.update((draft) => {
        const wallets = (draft.wallets[session.user.id] ??= { primary: null, secondary: null })
        wallets.secondary = null
      })
      return HttpResponse.json(next.wallets[session.user.id])
    }),
  ),

  /** Conexão simulada com o provedor. O cenário `walletRejects` faz o "usuário" recusar no app da carteira. */
  http.post(
    `${API}/wallets/connect`,
    withNetwork('POST /wallets/connect', async ({ request }) => {
      const session = requireSession(request)
      if (!session.ok) return session.response
      const parsed = connectWalletRequest.safeParse(await readJson(request))
      if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Dados de conexão inválidos.')
      if (hasFlag('walletRejects')) {
        return apiError(403, 'WALLET_REJECTED', 'A conexão foi recusada na carteira. Tente novamente.')
      }
      const connection = {
        connectionId: randomToken('conn'),
        ...parsed.data,
        expiresAt: new Date(Date.now() + CONNECTION_TTL_MS).toISOString(),
      }
      db.update((draft) => {
        draft.walletConnections[connection.connectionId] = { ...connection, userId: session.user.id }
      })
      return HttpResponse.json(connection, { status: 201 })
    }),
  ),

  http.post(
    `${API}/wallets/disconnect`,
    withNetwork('POST /wallets/disconnect', async ({ request }) => {
      const session = requireSession(request)
      if (!session.ok) return session.response
      const parsed = z.object({ connectionId: z.string() }).safeParse(await readJson(request))
      if (parsed.success) {
        db.update((draft) => {
          const connection = draft.walletConnections[parsed.data.connectionId]
          if (connection?.userId === session.user.id) delete draft.walletConnections[parsed.data.connectionId]
        })
      }
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
