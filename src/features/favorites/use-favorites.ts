import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addFavorite, fetchFavorites, removeFavorite } from '@/api/favorites'
import type { FavoritesResponse } from '@/api/contracts/favorites'
import { queryKeys } from '@/lib/query-keys'
import { useSession } from '@/features/auth/session'

export function useFavorites() {
  const { user } = useSession()
  const query = useQuery({
    queryKey: queryKeys.user.favorites(user?.id ?? 'anonymous'),
    queryFn: ({ signal }) => fetchFavorites(signal),
    enabled: user !== null,
    staleTime: 60_000,
  })
  const ids = new Set(query.data?.nftIds ?? [])
  return { ...query, isFavorite: (nftId: string) => ids.has(nftId), isAuthenticated: user !== null }
}

/**
 * Alterna favorito com atualização otimista: a UI muda na hora e, se a API
 * falhar, o estado anterior é restaurado. Ao final, o cache é revalidado.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const { user } = useSession()

  return useMutation({
    mutationKey: ['favorites', 'toggle'],
    mutationFn: async ({ nftId, favorite }: { nftId: string; favorite: boolean }) => {
      if (favorite) await addFavorite(nftId)
      else await removeFavorite(nftId)
    },
    onMutate: async ({ nftId, favorite }) => {
      if (!user) return undefined
      const key = queryKeys.user.favorites(user.id)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<FavoritesResponse>(key)
      queryClient.setQueryData<FavoritesResponse>(key, (current) => {
        const ids = new Set(current?.nftIds ?? [])
        if (favorite) ids.add(nftId)
        else ids.delete(nftId)
        return { nftIds: [...ids] }
      })
      return { key, previous }
    },
    onError: (_error, _variables, context) => {
      if (context) queryClient.setQueryData(context.key, context.previous)
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context) void queryClient.invalidateQueries({ queryKey: context.key })
    },
  })
}
