import Decimal from 'decimal.js'
import type { AppliedCoupon, CartSummary } from '@/api/contracts/cart'
import type { Network } from '@/api/contracts/common'
import { COUPONS } from '../fixtures/coupons'

/** Taxa de rede estimada por pedido (o layout usa 0.016 ETH na Ethereum). */
export const NETWORK_FEES: Record<Network, string> = {
  ethereum: '0.016',
  polygon: '0.002',
  solana: '0.001',
}

export type CouponCheck =
  | { ok: true; coupon: (typeof COUPONS)[string] }
  | { ok: false; code: 'COUPON_INVALID' | 'COUPON_EXPIRED'; message: string }

export function checkCoupon(code: string, now = Date.now()): CouponCheck {
  const coupon = COUPONS[code.toUpperCase()]
  if (!coupon) return { ok: false, code: 'COUPON_INVALID', message: 'Código promocional inválido.' }
  if (Date.parse(coupon.expiresAt) <= now) {
    return { ok: false, code: 'COUPON_EXPIRED', message: 'Este código promocional expirou.' }
  }
  return { ok: true, coupon }
}

/**
 * Resumo de valores. Toda a aritmética usa Decimal sobre strings decimais,
 * sem ponto flutuante: subtotal − desconto + taxa = total.
 */
export function computeSummary(
  subtotalEth: string,
  couponCode: string | null,
  network: Network = 'ethereum',
  hasItems = true,
): { coupon: AppliedCoupon | null; summary: CartSummary } {
  const subtotal = new Decimal(subtotalEth)
  let discount = new Decimal(0)
  let coupon: AppliedCoupon | null = null

  if (couponCode) {
    const check = checkCoupon(couponCode)
    if (check.ok) {
      const { coupon: record } = check
      const meetsMinimum = !record.minSubtotalEth || subtotal.gte(record.minSubtotalEth)
      if (meetsMinimum) {
        discount =
          record.kind === 'percent'
            ? subtotal.mul(record.value).div(100).toDecimalPlaces(6, Decimal.ROUND_DOWN)
            : Decimal.min(record.value, subtotal)
      }
      coupon = {
        code: record.code,
        description: record.description,
        status: meetsMinimum ? 'applied' : 'not-eligible',
        message: meetsMinimum ? null : `Válido para pedidos a partir de ${record.minSubtotalEth} ETH.`,
      }
    } else {
      // O cupom deixou de valer (ex.: expirou com o carrinho aberto).
      coupon = { code: couponCode, description: '', status: 'not-eligible', message: check.message }
    }
  }

  const fee = hasItems ? new Decimal(NETWORK_FEES[network]) : new Decimal(0)
  return {
    coupon,
    summary: {
      subtotalEth: subtotal.toFixed(),
      discountEth: discount.toFixed(),
      networkFeeEth: fee.toFixed(),
      totalEth: subtotal.minus(discount).plus(fee).toFixed(),
    },
  }
}
