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

/** Cupom aplicado ao carrinho. `not-eligible`: válido, mas a condição (ex.: subtotal mínimo) não é atendida. */
export const appliedCoupon = z.object({
  code: z.string(),
  description: z.string(),
  status: z.enum(['applied', 'not-eligible']),
  message: z.string().nullable(),
})
export type AppliedCoupon = z.infer<typeof appliedCoupon>

/** Valores calculados pelo servidor: a interface nunca recalcula o total por conta própria. */
export const cartSummary = z.object({
  subtotalEth: ethAmount,
  discountEth: ethAmount,
  networkFeeEth: ethAmount,
  totalEth: ethAmount,
})
export type CartSummary = z.infer<typeof cartSummary>

export const cart = z.object({
  items: z.array(cartItem),
  itemCount: z.number().int().min(0),
  subtotalEth: ethAmount,
  coupon: appliedCoupon.nullable(),
  summary: cartSummary,
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

export const applyCouponRequest = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Digite um código promocional.')
    .max(30, 'Código muito longo.')
    .transform((value) => value.toUpperCase()),
})
