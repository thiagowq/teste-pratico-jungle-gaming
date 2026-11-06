import { z } from 'zod'
import { artwork, editionId } from './catalog'
import { cartSummary } from './cart'
import { isoDate, network } from './common'
import { walletFields, refineAddress, walletType } from './wallets'

/** Item congelado na cotação e no pedido: alterações posteriores do catálogo não o afetam. */
export const orderLine = z.object({
  nftId: z.string(),
  editionId,
  name: z.string(),
  tokenId: z.string(),
  artwork,
  editionLabel: z.string(),
  quantity: z.number().int().min(1),
  unitPriceEth: z.string(),
  lineTotalEth: z.string(),
})
export type OrderLine = z.infer<typeof orderLine>

/* ---------- Cotação ---------- */

export const quoteRequest = z.object({ network })

export const quote = z.object({
  id: z.string(),
  network,
  items: z.array(orderLine),
  couponCode: z.string().nullable(),
  summary: cartSummary,
  expiresAt: isoDate,
})
export type Quote = z.infer<typeof quote>

/* ---------- Dados do colecionador ---------- */

export const buyerForm = walletFields
  .extend({
    username: z
      .string()
      .trim()
      .min(3, 'Informe o nome de usuário.')
      .max(20, 'Use até 20 caracteres.')
      .regex(/^[a-z0-9._]+$/, 'Use letras minúsculas, números, ponto e sublinhado.'),
    note: z.string().trim().max(280, 'Use até 280 caracteres.'),
  })
  .superRefine(refineAddress)
export type BuyerForm = z.infer<typeof buyerForm>

/* ---------- Pedido ---------- */

export const createOrderRequest = z.object({
  quoteId: z.string(),
  connectionId: z.string(),
  buyer: buyerForm,
})
export type CreateOrderRequest = z.infer<typeof createOrderRequest>

export const ORDER_STATUSES = ['pending', 'confirmed', 'declined'] as const
export const orderStatus = z.enum(ORDER_STATUSES)

export const order = z.object({
  id: z.string(),
  status: orderStatus,
  version: z.number().int().min(1),
  network,
  wallet: z.object({ provider: walletType, address: z.string(), label: z.string() }),
  items: z.array(orderLine),
  couponCode: z.string().nullable(),
  summary: cartSummary,
  txHash: z.string().nullable(),
  explorerUrl: z.string().nullable(),
  declineReason: z.string().nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
})
export type Order = z.infer<typeof order>

export const ordersResponse = z.object({ items: z.array(order) })
