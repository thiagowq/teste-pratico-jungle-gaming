import type { NftListParams } from '@/api/contracts/catalog'

/**
 * Chaves do TanStack Query. Dados privados ficam sob `['user', userId, ...]`:
 * isolados por usuário e removidos de uma vez no logout ou troca de conta.
 */
export const queryKeys = {
  nfts: {
    all: ['nfts'] as const,
    list: (params: NftListParams) => ['nfts', 'list', params] as const,
    detail: (id: string) => ['nfts', 'detail', id] as const,
    featured: () => ['nfts', 'featured'] as const,
  },
  session: (token: string | null) => ['session', token] as const,
  guestCart: () => ['cart', 'guest'] as const,
  user: {
    all: ['user'] as const,
    scope: (userId: string) => ['user', userId] as const,
    favorites: (userId: string) => ['user', userId, 'favorites'] as const,
    cart: (userId: string) => ['user', userId, 'cart'] as const,
  },
}
