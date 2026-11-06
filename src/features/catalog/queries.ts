import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { fetchFeaturedNfts, fetchNftDetail, fetchNftList } from '@/api/catalog'
import type { NftListParams } from '@/api/contracts/catalog'
import type { ApiError } from '@/api/errors'
import { queryKeys } from '@/lib/query-keys'
import { realtime } from '@/realtime/socket'

/** Registra a versão de cada NFT vinda do REST: eventos com versão igual ou menor são descartados. */
function observe<T extends { id: string; version: number }>(items: T[]) {
  for (const item of items) realtime.observeVersion({ type: 'nft', id: item.id }, item.version)
}

/**
 * A chave inclui todos os parâmetros: cada combinação tem seu próprio cache e
 * respostas de parâmetros antigos nunca sobrescrevem a consulta atual. O
 * `signal` cancela a requisição obsoleta quando os parâmetros mudam.
 */
export const nftListQuery = (params: NftListParams) =>
  queryOptions({
    queryKey: queryKeys.nfts.list(params),
    queryFn: async ({ signal }) => {
      const data = await fetchNftList(params, signal)
      observe(data.items)
      return data
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

export const nftDetailQuery = (id: string) =>
  queryOptions({
    queryKey: queryKeys.nfts.detail(id),
    queryFn: async ({ signal }) => {
      const data = await fetchNftDetail(id, signal)
      observe([data, ...data.related])
      return data
    },
    staleTime: 30_000,
    // 404 é definitivo: não adianta repetir.
    retry: (failureCount, error) => (error as ApiError).code !== 'NOT_FOUND' && failureCount < 2,
  })

export const featuredNftsQuery = () =>
  queryOptions({
    queryKey: queryKeys.nfts.featured(),
    queryFn: async ({ signal }) => {
      const data = await fetchFeaturedNfts(signal)
      observe(data.items)
      return data
    },
    staleTime: 60_000,
  })
