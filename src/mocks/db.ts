import type { EditionId } from '@/api/contracts/catalog'
import type { Order, Quote } from '@/api/contracts/checkout'
import type { Wallet, WalletConnection } from '@/api/contracts/wallets'
import { buildNftFixtures, type NftRecord } from './fixtures/nfts'
import { buildUserFixtures, type UserRecord } from './fixtures/users'
import { buildWalletFixtures } from './fixtures/wallets'
import { createPersistentState } from './lib/persist'

/** Linha do carrinho como o servidor guarda: preço registrado no momento da inclusão. */
export interface CartLineRecord {
  nftId: string
  editionId: EditionId
  quantity: number
  priceAtAddEth: string
  addedAt: string
}

export interface WalletConnectionRecord extends WalletConnection {
  userId: string
}

export interface QuoteRecord extends Quote {
  userId: string
}

export interface OrderRecord extends Order {
  userId: string
  /** Momento em que a simulação liquida o pedido (confirmação ou recusa). */
  processAt: string
  willDecline: boolean
}

export interface SessionRecord {
  userId: string
  expiresAt: string
}

/**
 * Estado único e consistente da API simulada. Persistido em localStorage para
 * sobreviver a refresh; `reset()` restaura integralmente as fixtures.
 * A chave tem versão: mudar o formato exige incrementá-la.
 */
export interface MockDatabase {
  users: Record<string, UserRecord>
  sessions: Record<string, SessionRecord>
  nfts: Record<string, NftRecord>
  /** Ordem original do catálogo (desempate estável na ordenação). */
  nftOrder: string[]
  favorites: Record<string, string[]>
  /** Carrinhos por dono: `user:<id>` ou `guest:<uuid>`. */
  carts: Record<string, CartLineRecord[]>
  /** Cupom aplicado por dono do carrinho. */
  cartCoupons: Record<string, string>
  wallets: Record<string, { primary: Wallet | null; secondary: Wallet | null }>
  walletConnections: Record<string, WalletConnectionRecord>
  quotes: Record<string, QuoteRecord>
  orders: Record<string, OrderRecord>
  /** Chaves de idempotência por usuário: `<userId>:<chave>`. */
  idempotency: Record<string, { orderId: string; payloadHash: string }>
}

function seed(): MockDatabase {
  const nfts = buildNftFixtures()
  return {
    users: Object.fromEntries(buildUserFixtures().map((user) => [user.id, user])),
    sessions: {},
    nfts: Object.fromEntries(nfts.map((nft) => [nft.id, nft])),
    nftOrder: nfts.map((nft) => nft.id),
    favorites: { 'user-ana': ['sage-nomad-009'] },
    carts: {},
    cartCoupons: {},
    wallets: buildWalletFixtures(),
    walletConnections: {},
    quotes: {},
    orders: {},
    idempotency: {},
  }
}

export const db = createPersistentState<MockDatabase>('db:v4', seed)
