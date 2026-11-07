import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import * as cartApi from '@/api/cart'
import { getGuestCartId, resetGuestCartId } from '@/api/cart-identity'
import type { AddCartItemRequest, Cart } from '@/api/contracts/cart'
import type { EditionId } from '@/api/contracts/catalog'
import { useSession } from '@/features/auth/session'
import { queryKeys } from '@/lib/query-keys'

/**
 * Chave do carrinho: do usuário (sob `['user', id]`, limpa no logout) ou do
 * visitante. Enquanto a sessão é verificada, a consulta espera para não
 * guardar o carrinho de um dono na chave do outro.
 */
export function useCartKey() {
  const { user, token, isPending } = useSession()
  const key = user ? queryKeys.user.cart(user.id) : queryKeys.guestCart()
  return { key, enabled: !isPending && !(token && !user) }
}

export function useCart() {
  const { key, enabled } = useCartKey()
  return useQuery({
    queryKey: key,
    queryFn: ({ signal }) => cartApi.fetchCart(signal),
    enabled,
    staleTime: 15_000,
  })
}

export function useCartCount() {
  return useCart().data?.itemCount ?? 0
}

/** Mutations do carrinho: a resposta do servidor substitui o cache (fonte da verdade). */
export function useAddToCart() {
  const queryClient = useQueryClient()
  const { key } = useCartKey()
  return useMutation({
    mutationKey: ['cart', 'add'],
    mutationFn: (body: AddCartItemRequest) => cartApi.addCartItem(body),
    onSuccess: (cart) => queryClient.setQueryData<Cart>(key, cart),
  })
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient()
  const { key } = useCartKey()
  return useMutation({
    mutationKey: ['cart', 'update'],
    mutationFn: ({ nftId, editionId, quantity }: { nftId: string; editionId: EditionId; quantity: number }) =>
      cartApi.updateCartItem(nftId, editionId, quantity),
    onSuccess: (cart) => queryClient.setQueryData<Cart>(key, cart),
  })
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()
  const { key } = useCartKey()
  return useMutation({
    mutationKey: ['cart', 'remove'],
    mutationFn: ({ nftId, editionId }: { nftId: string; editionId: EditionId }) =>
      cartApi.removeCartItem(nftId, editionId),
    onSuccess: (cart) => queryClient.setQueryData<Cart>(key, cart),
  })
}

function useCartMutation<TVariables>(mutationKey: string, mutationFn: (variables: TVariables) => Promise<Cart>) {
  const queryClient = useQueryClient()
  const { key } = useCartKey()
  return useMutation({
    mutationKey: ['cart', mutationKey],
    mutationFn,
    onSuccess: (cart) => queryClient.setQueryData<Cart>(key, cart),
  })
}

export const useApplyCoupon = () => useCartMutation('coupon', (code: string) => cartApi.applyCoupon(code))
export const useRemoveCoupon = () => useCartMutation('remove-coupon', () => cartApi.removeCoupon())
export const useAcceptCartChanges = () => useCartMutation('accept-changes', () => cartApi.acceptCartChanges())

/**
 * Após o login: leva os itens do visitante para o carrinho da conta.
 * Falha aqui não impede o login; os itens continuam no carrinho do visitante
 * e a mesclagem é tentada de novo no próximo login.
 */
export async function mergeGuestCartAfterLogin(queryClient: QueryClient, userId: string) {
  try {
    const cart = await cartApi.mergeGuestCart(getGuestCartId())
    resetGuestCartId()
    queryClient.setQueryData<Cart>(queryKeys.user.cart(userId), cart)
    queryClient.removeQueries({ queryKey: queryKeys.guestCart() })
    return cart
  } catch {
    return null
  }
}
