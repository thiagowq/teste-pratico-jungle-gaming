import { api } from './client'
import { cart, type AddCartItemRequest } from './contracts/cart'
import type { EditionId } from './contracts/catalog'
import { parseResponse } from './parse'

const itemPath = (nftId: string, editionId: EditionId) =>
  `/cart/items/${encodeURIComponent(nftId)}/${encodeURIComponent(editionId)}`

export async function fetchCart(signal?: AbortSignal) {
  const { data } = await api.get('/cart', { signal })
  return parseResponse(cart, data)
}

export async function addCartItem(body: AddCartItemRequest) {
  const { data } = await api.post('/cart/items', body)
  return parseResponse(cart, data)
}

export async function updateCartItem(nftId: string, editionId: EditionId, quantity: number) {
  const { data } = await api.patch(itemPath(nftId, editionId), { quantity })
  return parseResponse(cart, data)
}

export async function removeCartItem(nftId: string, editionId: EditionId) {
  const { data } = await api.delete(itemPath(nftId, editionId))
  return parseResponse(cart, data)
}

/** Mescla o carrinho do visitante ao da conta recém-autenticada. */
export async function mergeGuestCart(guestCartId: string) {
  const { data } = await api.post('/cart/merge', { guestCartId })
  return parseResponse(cart, data)
}

export async function applyCoupon(code: string) {
  const { data } = await api.post('/cart/coupon', { code })
  return parseResponse(cart, data)
}

export async function removeCoupon() {
  const { data } = await api.delete('/cart/coupon')
  return parseResponse(cart, data)
}

/** Confirma preços e estoques atuais após alterações sinalizadas pelo servidor. */
export async function acceptCartChanges() {
  const { data } = await api.post('/cart/accept-changes')
  return parseResponse(cart, data)
}
