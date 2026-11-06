import Decimal from 'decimal.js'
import { HttpResponse, http } from 'msw'
import { z } from 'zod'
import { addCartItemRequest, updateCartItemRequest, type Cart, type CartItem, type CartItemIssue } from '@/api/contracts/cart'
import { editionId as editionIdSchema, type EditionId } from '@/api/contracts/catalog'
import { db, type CartLineRecord, type MockDatabase } from '../db'
import { lookupSession } from '../lib/auth'
import { apiError, withNetwork } from '../lib/respond'
import { EDITION_LABELS } from '../lib/serialize'
import { fieldErrorsFrom, readJson } from '../lib/validation'

const API = '/api'

type Owner = { ok: true; key: string; userId: string | null } | { ok: false; response: Response }

/** Dono do carrinho: a sessão, se houver; senão o id de visitante do header. */
function resolveOwner(request: Request): Owner {
  const header = request.headers.get('Authorization')
  if (header?.startsWith('Bearer ')) {
    const session = lookupSession(header.slice(7))
    if (session.ok) return { ok: true, key: `user:${session.user.id}`, userId: session.user.id }
    return {
      ok: false,
      response:
        session.reason === 'expired'
          ? apiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente para continuar.')
          : apiError(401, 'UNAUTHENTICATED', 'Sessão inválida. Entre novamente.'),
    }
  }
  const guest = request.headers.get('X-Guest-Cart')
  if (!guest) return { ok: false, response: apiError(400, 'VALIDATION_ERROR', 'Carrinho do visitante não identificado.') }
  return { ok: true, key: `guest:${guest}`, userId: null }
}

function findEdition(state: MockDatabase, nftId: string, editionId: EditionId) {
  const nft = state.nfts[nftId]
  const edition = nft?.editions.find((candidate) => candidate.id === editionId)
  return nft && edition ? { nft, edition } : null
}

/** Monta o carrinho com preços e estoque atuais, sinalizando divergências. */
export function buildCart(state: MockDatabase, ownerKey: string): Cart {
  const lines = state.carts[ownerKey] ?? []
  const items: CartItem[] = []
  for (const line of lines) {
    const found = findEdition(state, line.nftId, line.editionId)
    if (!found) continue
    const { nft, edition } = found
    const issues: CartItemIssue[] = []
    if (!new Decimal(edition.priceEth).eq(line.priceAtAddEth)) {
      issues.push({ type: 'price-changed', previousPriceEth: line.priceAtAddEth })
    }
    if (edition.available === 0) issues.push({ type: 'sold-out' })
    else if (line.quantity > edition.available) issues.push({ type: 'insufficient-stock', available: edition.available })
    items.push({
      nftId: nft.id,
      editionId: edition.id,
      quantity: line.quantity,
      name: nft.name,
      tokenId: nft.tokenId,
      artwork: nft.artwork,
      editionLabel: EDITION_LABELS[edition.id],
      unitPriceEth: edition.priceEth,
      lineTotalEth: new Decimal(edition.priceEth).mul(line.quantity).toFixed(),
      available: edition.available,
      maxPerOrder: edition.maxPerOrder,
      nftVersion: nft.version,
      issues,
    })
  }
  const subtotal = items.reduce((sum, item) => sum.plus(item.lineTotalEth), new Decimal(0))
  const updatedAt = lines.reduce((latest, line) => (line.addedAt > latest ? line.addedAt : latest), new Date(0).toISOString())
  return {
    items,
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    subtotalEth: subtotal.toFixed(),
    updatedAt,
  }
}

/** Valida a quantidade final de uma linha contra limite por pedido e estoque. */
function checkQuantity(edition: { available: number; maxPerOrder: number }, quantity: number) {
  if (edition.available === 0) {
    return apiError(409, 'OUT_OF_STOCK', 'Esta edição está esgotada.', { details: { available: 0 } })
  }
  if (quantity > edition.maxPerOrder) {
    return apiError(422, 'VALIDATION_ERROR', `O limite desta edição é de ${edition.maxPerOrder} por pedido.`, {
      fieldErrors: { quantity: `Máximo de ${edition.maxPerOrder} por pedido.` },
      details: { maxPerOrder: edition.maxPerOrder },
    })
  }
  if (quantity > edition.available) {
    return apiError(409, 'OUT_OF_STOCK', `Só ${edition.available} disponíveis desta edição.`, {
      details: { available: edition.available },
    })
  }
  return null
}

export const cartHandlers = [
  http.get(
    `${API}/cart`,
    withNetwork('GET /cart', ({ request }) => {
      const owner = resolveOwner(request)
      if (!owner.ok) return owner.response
      return HttpResponse.json(buildCart(db.get(), owner.key))
    }),
  ),

  http.post(
    `${API}/cart/items`,
    withNetwork('POST /cart/items', async ({ request }) => {
      const owner = resolveOwner(request)
      if (!owner.ok) return owner.response
      const parsed = addCartItemRequest.safeParse(await readJson(request))
      if (!parsed.success) {
        return apiError(422, 'VALIDATION_ERROR', 'Dados inválidos.', { fieldErrors: fieldErrorsFrom(parsed.error) })
      }
      const { nftId, editionId, quantity } = parsed.data
      const state = db.get()
      const found = findEdition(state, nftId, editionId)
      if (!found) return apiError(404, 'NOT_FOUND', 'NFT ou edição inexistente.')
      const existing = (state.carts[owner.key] ?? []).find((line) => line.nftId === nftId && line.editionId === editionId)
      const error = checkQuantity(found.edition, (existing?.quantity ?? 0) + quantity)
      if (error) return error
      const next = db.update((draft) => {
        const lines = (draft.carts[owner.key] ??= [])
        const line = lines.find((candidate) => candidate.nftId === nftId && candidate.editionId === editionId)
        const now = new Date().toISOString()
        if (line) {
          line.quantity += quantity
          line.priceAtAddEth = found.edition.priceEth
          line.addedAt = now
        } else {
          lines.push({ nftId, editionId, quantity, priceAtAddEth: found.edition.priceEth, addedAt: now })
        }
      })
      return HttpResponse.json(buildCart(next, owner.key), { status: 201 })
    }),
  ),

  http.patch<{ nftId: string; editionId: string }>(
    `${API}/cart/items/:nftId/:editionId`,
    withNetwork('PATCH /cart/items', async ({ request, params }) => {
      const owner = resolveOwner(request)
      if (!owner.ok) return owner.response
      const editionId = editionIdSchema.safeParse(params.editionId)
      const parsed = updateCartItemRequest.safeParse(await readJson(request))
      if (!editionId.success || !parsed.success) {
        return apiError(422, 'VALIDATION_ERROR', 'Quantidade inválida.', {
          fieldErrors: parsed.success ? {} : fieldErrorsFrom(parsed.error),
        })
      }
      const state = db.get()
      const line = (state.carts[owner.key] ?? []).find(
        (candidate) => candidate.nftId === params.nftId && candidate.editionId === editionId.data,
      )
      const found = findEdition(state, params.nftId, editionId.data)
      if (!line || !found) return apiError(404, 'NOT_FOUND', 'Item não está no carrinho.')
      const error = checkQuantity(found.edition, parsed.data.quantity)
      if (error) return error
      const next = db.update((draft) => {
        const target = draft.carts[owner.key]!.find(
          (candidate) => candidate.nftId === params.nftId && candidate.editionId === editionId.data,
        )!
        target.quantity = parsed.data.quantity
      })
      return HttpResponse.json(buildCart(next, owner.key))
    }),
  ),

  http.delete<{ nftId: string; editionId: string }>(
    `${API}/cart/items/:nftId/:editionId`,
    withNetwork('DELETE /cart/items', ({ request, params }) => {
      const owner = resolveOwner(request)
      if (!owner.ok) return owner.response
      // Idempotente: remover um item ausente devolve o carrinho atual.
      const next = db.update((draft) => {
        draft.carts[owner.key] = (draft.carts[owner.key] ?? []).filter(
          (line) => !(line.nftId === params.nftId && line.editionId === params.editionId),
        )
      })
      return HttpResponse.json(buildCart(next, owner.key))
    }),
  ),

  http.post(
    `${API}/cart/merge`,
    withNetwork('POST /cart/merge', async ({ request }) => {
      const owner = resolveOwner(request)
      if (!owner.ok) return owner.response
      if (!owner.userId) return apiError(401, 'UNAUTHENTICATED', 'Entre na sua conta para mesclar o carrinho.')
      const parsed = z.object({ guestCartId: z.string().min(1) }).safeParse(await readJson(request))
      if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Carrinho do visitante inválido.')
      const guestKey = `guest:${parsed.data.guestCartId}`
      const next = db.update((draft) => {
        const guestLines: CartLineRecord[] = draft.carts[guestKey] ?? []
        const userLines = (draft.carts[owner.key] ??= [])
        for (const guestLine of guestLines) {
          const found = findEdition(draft, guestLine.nftId, guestLine.editionId)
          if (!found) continue
          const existing = userLines.find(
            (line) => line.nftId === guestLine.nftId && line.editionId === guestLine.editionId,
          )
          // Soma as quantidades respeitando limite por pedido e estoque (mínimo 1 para sinalizar o problema).
          const limit = Math.max(1, Math.min(found.edition.maxPerOrder, found.edition.available))
          if (existing) {
            existing.quantity = Math.min(existing.quantity + guestLine.quantity, limit)
          } else {
            userLines.push({ ...guestLine, quantity: Math.min(guestLine.quantity, limit) })
          }
        }
        delete draft.carts[guestKey]
      })
      return HttpResponse.json(buildCart(next, owner.key))
    }),
  ),
]
