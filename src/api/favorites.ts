import { api } from './client'
import { favoritesResponse } from './contracts/favorites'
import { parseResponse } from './parse'

export async function fetchFavorites(signal?: AbortSignal) {
  const { data } = await api.get('/favorites', { signal })
  return parseResponse(favoritesResponse, data)
}

export async function addFavorite(nftId: string) {
  await api.put(`/favorites/${encodeURIComponent(nftId)}`)
}

export async function removeFavorite(nftId: string) {
  await api.delete(`/favorites/${encodeURIComponent(nftId)}`)
}
