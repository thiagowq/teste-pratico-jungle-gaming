import { HttpResponse, http } from 'msw'
import type { FavoritesResponse } from '@/api/contracts/favorites'
import { db } from '../db'
import { requireSession } from '../lib/auth'
import { apiError, withNetwork } from '../lib/respond'
import { toSummary } from '../lib/serialize'

const API = '/api'

export const favoritesHandlers = [
  http.get(
    `${API}/favorites`,
    withNetwork('GET /favorites', ({ request }) => {
      const session = requireSession(request)
      if (!session.ok) return session.response
      const state = db.get()
      const nftIds = state.favorites[session.user.id] ?? []
      const items = nftIds
        .map((id) => state.nfts[id])
        .filter(Boolean)
        .map(toSummary)
      return HttpResponse.json<FavoritesResponse>({ nftIds, items })
    }),
  ),

  // PUT e DELETE são idempotentes: repetir a operação não muda o resultado.
  http.put<{ nftId: string }>(
    `${API}/favorites/:nftId`,
    withNetwork('PUT /favorites/:nftId', ({ request, params }) => {
      const session = requireSession(request)
      if (!session.ok) return session.response
      if (!db.get().nfts[params.nftId]) return apiError(404, 'NOT_FOUND', 'NFT inexistente.')
      db.update((draft) => {
        const list = draft.favorites[session.user.id] ?? []
        if (!list.includes(params.nftId)) list.push(params.nftId)
        draft.favorites[session.user.id] = list
      })
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.delete<{ nftId: string }>(
    `${API}/favorites/:nftId`,
    withNetwork('DELETE /favorites/:nftId', ({ request, params }) => {
      const session = requireSession(request)
      if (!session.ok) return session.response
      db.update((draft) => {
        draft.favorites[session.user.id] = (draft.favorites[session.user.id] ?? []).filter((id) => id !== params.nftId)
      })
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
