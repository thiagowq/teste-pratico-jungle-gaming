import { z } from 'zod'
import { artwork, editionId } from './catalog'
import { ethAmount, isoDate } from './common'

/**
 * Problemas de um item detectados pelo servidor ao montar o carrinho:
 * - `price-changed`: o preço da edição mudou desde que o item foi adicionado;
 * - `insufficient-stock`: a quantidade pedida passou a exceder o disponível;
 * - `sold-out`: a edição esgotou.
 */
export const cartItemIssue = z.discriminatedUnion('type', [
  z.object({ type: z.literal('price-changed'), previousPriceEth: ethAmount }),
  z.object({ type: z.literal('insufficient-stock'), available: z.number().int().min(0) }),
  z.object({ type: z.literal('sold-out') }),
])
export type CartItemIssue = z.infer<typeof cartItemIssue>

export const cartItem = z.object({
  nftId: z.string(),
  editionId,
  quantity: z.number().int().min(1),
  name: z.string(),
  tokenId: z.string(),
  artwork,
  editionLabel: z.string(),
  unitPriceEth: ethAmount,
  lineTotalEth: ethAmount,
  available: z.number().int().min(0),
  maxPerOrder: z.number().int().min(1),
  /** Versão do NFT usada no cálculo; eventos mais novos disparam revalidação. */
  nftVersion: z.number().int().min(1),
  issues: z.array(cartItemIssue),
})
export type CartItem = z.infer<typeof cartItem>

export const cart = z.object({
  items: z.array(cartItem),
  itemCount: z.number().int().min(0),
  subtotalEth: ethAmount,
  updatedAt: isoDate,
})
export type Cart = z.infer<typeof cart>

export const addCartItemRequest = z.object({
  nftId: z.string(),
  editionId,
  quantity: z.number().int().min(1, 'A quantidade mínima é 1.'),
})
export type AddCartItemRequest = z.infer<typeof addCartItemRequest>

export const updateCartItemRequest = z.object({
  quantity: z.number().int().min(1, 'A quantidade mínima é 1.'),
})
