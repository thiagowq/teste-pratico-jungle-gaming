import { api } from './client'
import { featuredResponse, nftDetail, nftListResponse, type NftListParams } from './contracts/catalog'
import { parseResponse } from './parse'

export async function fetchNftList(params: NftListParams, signal?: AbortSignal) {
  const { data } = await api.get('/nfts', { params, signal })
  return parseResponse(nftListResponse, data)
}

export async function fetchNftDetail(id: string, signal?: AbortSignal) {
  const { data } = await api.get(`/nfts/${encodeURIComponent(id)}`, { signal })
  return parseResponse(nftDetail, data)
}

export async function fetchFeaturedNfts(signal?: AbortSignal) {
  const { data } = await api.get('/nfts/featured', { signal })
  return parseResponse(featuredResponse, data)
}
