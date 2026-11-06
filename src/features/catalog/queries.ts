import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { fetchFeaturedNfts, fetchNftDetail, fetchNftList } from '@/api/catalog'
import type { NftListParams } from '@/api/contracts/catalog'
import type { ApiError } from '@/api/errors'
import { queryKeys } from '@/lib/query-keys'

/**
 * A chave inclui todos os parâmetros: cada combinação tem seu próprio cache e
 * respostas de parâmetros antigos nunca sobrescrevem a consulta atual. O
 * `signal` cancela a requisição obsoleta quando os parâmetros mudam.
 */
export const nftListQuery = (params: NftListParams) =>
  queryOptions({
    queryKey: queryKeys.nfts.list(params),
    queryFn: ({ signal }) => fetchNftList(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

export const nftDetailQuery = (id: string) =>
  queryOptions({
    queryKey: queryKeys.nfts.detail(id),
    queryFn: ({ signal }) => fetchNftDetail(id, signal),
    staleTime: 30_000,
    // 404 é definitivo: não adianta repetir.
    retry: (failureCount, error) => (error as ApiError).code !== 'NOT_FOUND' && failureCount < 2,
  })

export const featuredNftsQuery = () =>
  queryOptions({
    queryKey: queryKeys.nfts.featured(),
    queryFn: ({ signal }) => fetchFeaturedNfts(signal),
    staleTime: 60_000,
  })
