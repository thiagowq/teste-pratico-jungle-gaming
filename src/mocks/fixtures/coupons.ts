import { FIXTURE_NOW } from './nfts'

export interface CouponRecord {
  code: string
  description: string
  /** Desconto percentual (0–100) ou valor fixo em ETH. */
  kind: 'percent' | 'fixed'
  value: string
  minSubtotalEth: string | null
  expiresAt: string
}

const DAY = 86_400_000

/** Cupons de demonstração: válido, válido com mínimo e expirado. Os demais códigos são inválidos. */
export const COUPONS: Record<string, CouponRecord> = {
  KURIO10: {
    code: 'KURIO10',
    description: '10% de desconto no lançamento',
    kind: 'percent',
    value: '10',
    minSubtotalEth: null,
    expiresAt: new Date(FIXTURE_NOW + 3650 * DAY).toISOString(),
  },
  GENESIS05: {
    code: 'GENESIS05',
    description: '0.05 ETH de desconto em pedidos a partir de 0.5 ETH',
    kind: 'fixed',
    value: '0.05',
    minSubtotalEth: '0.5',
    expiresAt: new Date(FIXTURE_NOW + 3650 * DAY).toISOString(),
  },
  BOASVINDAS: {
    code: 'BOASVINDAS',
    description: '15% de desconto de boas-vindas',
    kind: 'percent',
    value: '15',
    minSubtotalEth: null,
    expiresAt: new Date(FIXTURE_NOW - 30 * DAY).toISOString(),
  },
}
